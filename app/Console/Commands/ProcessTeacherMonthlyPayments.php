<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\TeacherMembershipPaymentService;
use Carbon\Carbon;

class ProcessTeacherMonthlyPayments extends Command
{
    protected $signature = 'teachers:process-monthly-payments {--month= : Specific month to process (YYYY-MM format)}';
    protected $description = 'Process monthly payments for teachers based on membership payments';

    protected $paymentService;

    public function __construct(TeacherMembershipPaymentService $paymentService)
    {
        parent::__construct();
        $this->paymentService = $paymentService;
    }

    public function handle()
    {
        $month = $this->option('month');
        
        if ($month) {
            // Validate month format
            if (!preg_match('/^\d{4}-\d{2}$/', $month)) {
                $this->error('Invalid month format. Use YYYY-MM format (e.g., 2025-01)');
                return 1;
            }
        } else {
            $month = now()->format('Y-m');
        }

        $this->info("Processing teacher monthly payments for {$month}...");

        try {
            $result = $this->paymentService->processMonthlyPayments($month);

            $this->info("✅ Successfully processed {$result['processed_count']} teacher payments");
            $this->info("💰 Total amount distributed: {$result['total_amount']} DH");
            $this->info("📅 Month processed: {$result['month']}");

            if ($result['processed_count'] === 0) {
                $this->warn("⚠️  No payments were processed for this month.");
            }

            return 0;
        } catch (\Exception $e) {
            $this->error("❌ Error processing monthly payments: " . $e->getMessage());
            return 1;
        }
    }
}
