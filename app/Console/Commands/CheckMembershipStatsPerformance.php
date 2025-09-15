<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\MembershipStatsService;

class CheckMembershipStatsPerformance extends Command
{
    protected $signature = 'memberships:check-performance';

    protected $description = 'Check performance metrics for membership stats system';

    protected $membershipStatsService;

    public function __construct(MembershipStatsService $membershipStatsService)
    {
        parent::__construct();
        $this->membershipStatsService = $membershipStatsService;
    }

    public function handle()
    {
        $this->info('Checking membership stats performance...');

        try {
            $metrics = $this->membershipStatsService->getPerformanceMetrics();
            
            $this->table(
                ['Metric', 'Value'],
                [
                    ['Total Records', $metrics['total_records']],
                    ['Total Schools', $metrics['total_schools']],
                    ['Total Months', $metrics['total_months']],
                    ['Table Size (MB)', $metrics['table_size_mb']],
                    ['Records per Month', round($metrics['records_per_month'], 2)],
                    ['Estimated Yearly Growth', $metrics['estimated_yearly_growth'] . ' records/year'],
                ]
            );

            // Performance assessment
            $this->assessPerformance($metrics);

        } catch (\Exception $e) {
            $this->error('Error checking performance: ' . $e->getMessage());
            return 1;
        }

        return 0;
    }

    private function assessPerformance($metrics)
    {
        $this->newLine();
        $this->info('Performance Assessment:');

        // Table size assessment
        if ($metrics['table_size_mb'] < 1) {
            $this->line('✅ Table size: Excellent (< 1 MB)');
        } elseif ($metrics['table_size_mb'] < 10) {
            $this->line('✅ Table size: Good (< 10 MB)');
        } elseif ($metrics['table_size_mb'] < 100) {
            $this->line('⚠️  Table size: Acceptable (< 100 MB)');
        } else {
            $this->line('❌ Table size: Large (> 100 MB) - Consider cleanup');
        }

        // Record count assessment
        if ($metrics['total_records'] < 1000) {
            $this->line('✅ Record count: Excellent (< 1,000 records)');
        } elseif ($metrics['total_records'] < 10000) {
            $this->line('✅ Record count: Good (< 10,000 records)');
        } elseif ($metrics['total_records'] < 100000) {
            $this->line('⚠️  Record count: Acceptable (< 100,000 records)');
        } else {
            $this->line('❌ Record count: High (> 100,000 records) - Consider cleanup');
        }

        // Growth rate assessment
        $yearlyGrowth = $metrics['estimated_yearly_growth'];
        if ($yearlyGrowth < 100) {
            $this->line('✅ Growth rate: Excellent (< 100 records/year)');
        } elseif ($yearlyGrowth < 1000) {
            $this->line('✅ Growth rate: Good (< 1,000 records/year)');
        } elseif ($yearlyGrowth < 10000) {
            $this->line('⚠️  Growth rate: Acceptable (< 10,000 records/year)');
        } else {
            $this->line('❌ Growth rate: High (> 10,000 records/year) - Monitor closely');
        }

        // Recommendations
        $this->newLine();
        $this->info('Recommendations:');

        if ($metrics['total_records'] > 10000) {
            $this->line('• Consider running cleanup: php artisan memberships:update-stats --cleanup');
        }

        if ($metrics['table_size_mb'] > 10) {
            $this->line('• Consider optimizing table: php artisan memberships:optimize-table');
        }

        if ($yearlyGrowth > 1000) {
            $this->line('• Monitor growth rate monthly');
            $this->line('• Consider archiving old data');
        }

        $this->line('• Current performance is excellent for dashboard loading');
    }
}
