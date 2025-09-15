<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\MembershipStatsService;
use Carbon\Carbon;

class UpdateMembershipStats extends Command
{
        protected $signature = 'memberships:update-stats {--school= : Specific school ID to update} {--month= : Specific month (YYYY-MM format)} {--all : Update stats for all schools and months} {--recalculate : Recalculate all historical stats} {--cleanup : Clean up old stats data}';

    protected $description = 'Update membership monthly statistics for dashboard';

    protected $membershipStatsService;

    public function __construct(MembershipStatsService $membershipStatsService)
    {
        parent::__construct();
        $this->membershipStatsService = $membershipStatsService;
    }

    public function handle()
    {
        $this->info('Starting membership stats update...');

        try {
                           if ($this->option('cleanup')) {
                   $this->cleanupOldStats();
               } elseif ($this->option('recalculate')) {
                   $this->recalculateAllStats();
               } elseif ($this->option('all')) {
                   $this->updateAllStats();
               } elseif ($this->option('school') || $this->option('month')) {
                   $this->updateSpecificStats();
               } else {
                   $this->updateCurrentMonthStats();
               }

            $this->info('Membership stats update completed successfully!');
            return 0;
        } catch (\Exception $e) {
            $this->error('Error updating membership stats: ' . $e->getMessage());
            return 1;
        }
    }

    private function updateCurrentMonthStats()
    {
        $this->info('Updating current month stats...');
        
        $schoolId = $this->option('school');
        $stats = $this->membershipStatsService->updateCurrentMonthStats($schoolId);
        
        $this->info("Updated stats for " . ($schoolId ? "school {$schoolId}" : "all schools"));
        $this->table(
            ['Metric', 'Count'],
            [
                ['Total Memberships', $stats->total_memberships],
                ['Paid', $stats->paid_count],
                ['Unpaid', $stats->unpaid_count],
                ['Expired', $stats->expired_count],
                ['Pending', $stats->pending_count],
            ]
        );
    }

    private function updateSpecificStats()
    {
        $schoolId = $this->option('school');
        $month = $this->option('month');
        
        if ($month) {
            $date = Carbon::parse($month);
            $year = $date->year;
            $monthNum = $date->month;
            
            $this->info("Updating stats for {$month}...");
            $stats = $this->membershipStatsService->updateMonthlyStats($schoolId, $year, $monthNum);
        } else {
            $this->info("Updating current month stats for " . ($schoolId ? "school {$schoolId}" : "all schools") . "...");
            $stats = $this->membershipStatsService->updateCurrentMonthStats($schoolId);
        }
        
        $this->table(
            ['Metric', 'Count'],
            [
                ['Total Memberships', $stats->total_memberships],
                ['Paid', $stats->paid_count],
                ['Unpaid', $stats->unpaid_count],
                ['Expired', $stats->expired_count],
                ['Pending', $stats->pending_count],
            ]
        );
    }

    private function updateAllStats()
    {
        $this->info('Updating stats for all schools...');
        
        $currentYear = now()->year;
        $currentMonth = now()->month;
        
        $stats = $this->membershipStatsService->updateAllSchoolsStats($currentYear, $currentMonth);
        
        $this->info("Updated stats for " . count($stats) . " school(s)");
        
        foreach ($stats as $stat) {
            $schoolName = $stat->school ? $stat->school->name : 'All Schools';
            $this->line("  - {$schoolName}: {$stat->paid_count} paid, {$stat->unpaid_count} unpaid");
        }
    }

    private function recalculateAllStats()
    {
        $this->info('Recalculating all historical stats...');
        
        $startYear = now()->subYear()->year;
        $endYear = now()->year;
        
        $this->warn("This will recalculate stats from {$startYear} to {$endYear}. This may take a while.");
        
        if (!$this->confirm('Do you want to continue?')) {
            $this->info('Operation cancelled.');
            return;
        }
        
        $bar = $this->output->createProgressBar(($endYear - $startYear + 1) * 12);
        $bar->start();
        
        $updatedStats = $this->membershipStatsService->recalculateAllStats($startYear, $endYear);
        
        $bar->finish();
        $this->newLine();
        
                       $this->info("Recalculated stats for " . count($updatedStats) . " periods");
           }

           private function cleanupOldStats()
           {
               $this->info('Cleaning up old membership stats...');
               
               $deletedCount = $this->membershipStatsService->cleanupOldStats(2); // Keep 2 years
               
               $this->info("Cleaned up {$deletedCount} old records");
               
               // Show updated metrics
               $metrics = $this->membershipStatsService->getPerformanceMetrics();
               $this->table(
                   ['Metric', 'Value'],
                   [
                       ['Total Records', $metrics['total_records']],
                       ['Table Size (MB)', $metrics['table_size_mb']],
                       ['Records per Month', round($metrics['records_per_month'], 2)],
                   ]
               );
           }
}
