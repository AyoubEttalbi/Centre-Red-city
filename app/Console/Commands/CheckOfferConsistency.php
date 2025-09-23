<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Invoice;
use App\Models\Membership;
use Illuminate\Support\Facades\Log;

class CheckOfferConsistency extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'invoices:check-offer-consistency';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check for invoices with offer_id mismatches with their memberships';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking for offer consistency issues...');

        // Get all invoices with their memberships
        $invoices = Invoice::with(['membership'])->get();
        $mismatches = [];

        foreach ($invoices as $invoice) {
            if (!$invoice->membership) continue;
            
            if ($invoice->offer_id != $invoice->membership->offer_id) {
                $mismatches[] = [
                    'invoice_id' => $invoice->id,
                    'student_name' => $invoice->membership->student->firstName . ' ' . $invoice->membership->student->lastName,
                    'invoice_offer_id' => $invoice->offer_id,
                    'membership_offer_id' => $invoice->membership->offer_id,
                    'created_at' => $invoice->created_at,
                ];
            }
        }

        if (count($mismatches) == 0) {
            $this->info('✅ No offer consistency issues found!');
            return 0;
        }

        $this->error('⚠️ Found ' . count($mismatches) . ' invoices with offer mismatches:');
        
        foreach ($mismatches as $mismatch) {
            $this->line("Invoice {$mismatch['invoice_id']}: {$mismatch['student_name']} - Invoice Offer {$mismatch['invoice_offer_id']} vs Membership Offer {$mismatch['membership_offer_id']}");
        }

        // Log the issue
        Log::error('Offer consistency check failed', [
            'mismatch_count' => count($mismatches),
            'mismatches' => $mismatches
        ]);

        return 1;
    }
}

