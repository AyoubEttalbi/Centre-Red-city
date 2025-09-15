<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Membership;
use App\Models\Invoice;
use Carbon\Carbon;

class FixMembershipEndDates extends Command
{
    protected $signature = 'memberships:fix-end-dates {--dry-run : Show what would be changed without making changes}';
    protected $description = 'Fix membership end dates based on actual paid periods from invoices';

    public function handle()
    {
        $dryRun = $this->option('dry-run');
        
        if ($dryRun) {
            $this->info('🔍 DRY RUN MODE - No changes will be made');
        }

        $this->info('Analyzing memberships and their invoices...');
        
        $memberships = Membership::with(['invoices'])->get();
        $fixedCount = 0;
        
        foreach ($memberships as $membership) {
            $invoices = $membership->invoices;
            
            if ($invoices->isEmpty()) {
                continue;
            }
            
            // Find the latest invoice with the most recent end date
            $latestInvoice = $invoices->sortByDesc('endDate')->first();
            
            if (!$latestInvoice) {
                continue;
            }
            
            $invoiceEndDate = Carbon::parse($latestInvoice->endDate);
            $membershipEndDate = $membership->end_date ? Carbon::parse($membership->end_date) : null;
            
            // Check if membership end date is beyond the actual paid period
            if ($membershipEndDate && $membershipEndDate->gt($invoiceEndDate)) {
                $this->line("Membership ID {$membership->id}:");
                $this->line("  Current end date: {$membership->end_date}");
                $this->line("  Invoice end date: {$latestInvoice->endDate}");
                $this->line("  Invoice ID: {$latestInvoice->id}");
                $this->line("  Selected months: " . json_encode($latestInvoice->selected_months));
                
                // Check if the membership should be expired
                $now = Carbon::now();
                $shouldBeExpired = $invoiceEndDate->lt($now);
                
                if ($shouldBeExpired) {
                    $this->line("  ⚠️  Should be EXPIRED (invoice ended on {$latestInvoice->endDate})");
                    
                    if (!$dryRun) {
                        $membership->update([
                            'end_date' => $latestInvoice->endDate,
                            'payment_status' => 'expired',
                            'is_active' => false
                        ]);
                        $this->line("  ✅ Fixed: Set to expired");
                    } else {
                        $this->line("  🔍 Would fix: Set to expired");
                    }
                } else {
                    $this->line("  ⚠️  End date should be adjusted to {$latestInvoice->endDate}");
                    
                    if (!$dryRun) {
                        $membership->update([
                            'end_date' => $latestInvoice->endDate
                        ]);
                        $this->line("  ✅ Fixed: Adjusted end date");
                    } else {
                        $this->line("  🔍 Would fix: Adjust end date");
                    }
                }
                
                $fixedCount++;
                $this->line('');
            }
        }
        
        if ($fixedCount > 0) {
            if ($dryRun) {
                $this->info("🔍 Found {$fixedCount} memberships that need fixing. Run without --dry-run to apply changes.");
            } else {
                $this->info("✅ Successfully fixed {$fixedCount} memberships.");
            }
        } else {
            $this->info("ℹ️  No memberships need fixing.");
        }
    }
}
