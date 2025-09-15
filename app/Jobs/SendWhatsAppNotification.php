<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use WasenderApi\Facades\WasenderApi;

class SendWhatsAppNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $backoff = [10, 30, 60];
    public $timeout = 60;
    
    protected $phone;
    protected $message;
    protected $studentId;

    public function __construct($phone, $message, $studentId)
    {
        $this->phone = $phone;
        $this->message = $message;
        $this->studentId = $studentId;
    }

    public function handle()
    {
        try {
            $lockKey = 'whatsapp_rate_limit';
            $lastSentKey = 'whatsapp_last_sent';
            
            $lock = Cache::lock($lockKey, 10);
            
            if ($lock->get()) {
                try {
                    $lastSent = Cache::get($lastSentKey, 0);
                    $timeSinceLastSent = time() - $lastSent;
                    
                    if ($timeSinceLastSent < 5) {
                        $sleepTime = 5 - $timeSinceLastSent + 1;
                        Log::info('Rate limiting: waiting before sending', [
                            'student_id' => $this->studentId,
                            'sleep_seconds' => $sleepTime
                        ]);
                        sleep($sleepTime);
                    }
                    
                    WasenderApi::sendText($this->phone, $this->message);
                    Cache::put($lastSentKey, time(), 60);
                    
                    Log::info('WhatsApp message sent successfully', [
                        'student_id' => $this->studentId,
                        'phone' => $this->phone
                    ]);
                    
                } finally {
                    $lock->release();
                }
            } else {
                Log::info('Could not acquire rate limit lock, re-queuing job', [
                    'student_id' => $this->studentId
                ]);
                $this->release(5);
                return;
            }
            
        } catch (\Exception $e) {
            Log::error('Failed to send WhatsApp message in job', [
                'student_id' => $this->studentId,
                'phone' => $this->phone,
                'error' => $e->getMessage(),
                'attempt' => $this->attempts()
            ]);
            
            if ($this->attempts() >= $this->tries) {
                Log::critical('WhatsApp message permanently failed', [
                    'student_id' => $this->studentId,
                    'phone' => $this->phone,
                    'final_error' => $e->getMessage()
                ]);
            }
            
            throw $e;
        }
    }

    public function failed(\Throwable $exception)
    {
        Log::critical('WhatsApp job failed permanently', [
            'student_id' => $this->studentId,
            'phone' => $this->phone,
            'error' => $exception->getMessage()
        ]);
    }
}
