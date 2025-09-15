<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\TeacherMembershipPaymentService;

class CleanupDuplicateTeacherPayments extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'teachers:cleanup-duplicates';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up duplicate teacher membership payment records';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting cleanup of duplicate teacher membership payment records...');
        
        $service = new TeacherMembershipPaymentService();
        $result = $service->cleanupDuplicateRecords();
        
        $this->info("Cleanup completed!");
        $this->info("Duplicates found: {$result['duplicates_found']}");
        $this->info("Records deleted: {$result['records_deleted']}");
        
        if ($result['records_deleted'] > 0) {
            $this->warn("⚠️  {$result['records_deleted']} duplicate records were deleted!");
        } else {
            $this->info("✅ No duplicate records found!");
        }
        
        return 0;
    }
}
