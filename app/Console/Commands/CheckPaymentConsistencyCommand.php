<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\PaymentMonitoringService;

class CheckPaymentConsistencyCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'payments:check-consistency {--fix : Auto-fix issues found}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check for payment consistency issues and optionally fix them';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔍 Checking payment consistency...');
        
        $monitoringService = new PaymentMonitoringService();
        
        // Get statistics
        $stats = $monitoringService->getPaymentStatistics();
        
        $this->info('📊 Payment Statistics:');
        $this->table(
            ['Metric', 'Count'],
            [
                ['Total Invoices', $stats['total_invoices']],
                ['Paid Invoices', $stats['paid_invoices']],
                ['Total Payment Records', $stats['total_payment_records']],
                ['Active Payment Records', $stats['active_payment_records']],
                ['Inactive Payment Records', $stats['inactive_payment_records']],
                ['Paid Invoices Without Payments', $stats['paid_invoices_without_payments']],
                ['Inactive Records for Paid Invoices', $stats['inactive_records_for_paid_invoices']]
            ]
        );
        
        // Check for issues
        $issues = $monitoringService->checkPaymentConsistency();
        
        if (empty($issues)) {
            $this->info('✅ No payment consistency issues found!');
            return 0;
        }
        
        $this->warn('⚠️  Found ' . count($issues) . ' payment consistency issues:');
        
        foreach ($issues as $issue) {
            $this->error("  - {$issue['description']}: {$issue['count']} items");
        }
        
        // Auto-fix if requested
        if ($this->option('fix')) {
            $this->info('🔧 Auto-fixing issues...');
            
            $fixResult = $monitoringService->autoFixPaymentIssues();
            
            if ($fixResult['total_fixed'] > 0) {
                $this->info("✅ Fixed {$fixResult['total_fixed']} issues:");
                
                foreach ($fixResult['fixed'] as $fixed) {
                    $this->line("  - {$fixed['type']}: " . json_encode($fixed));
                }
            }
            
            if ($fixResult['total_errors'] > 0) {
                $this->error("❌ {$fixResult['total_errors']} errors occurred:");
                
                foreach ($fixResult['errors'] as $error) {
                    if (is_array($error)) {
                        $type = $error['type'] ?? 'unknown';
                        $message = $error['message'] ?? $error['error'] ?? 'No message';
                        $this->error("  - $type: $message");
                    } else {
                        $this->error("  - $error");
                    }
                }
            }
            
            // Re-check after fixing
            $this->info('🔍 Re-checking after fixes...');
            $issuesAfterFix = $monitoringService->checkPaymentConsistency();
            
            if (empty($issuesAfterFix)) {
                $this->info('✅ All issues have been resolved!');
            } else {
                $this->warn('⚠️  Some issues remain:');
                foreach ($issuesAfterFix as $issue) {
                    $this->error("  - {$issue['description']}: {$issue['count']} items");
                }
            }
        } else {
            $this->info('💡 Run with --fix to automatically fix these issues');
        }
        
        return 0;
    }
}



