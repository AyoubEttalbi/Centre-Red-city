<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Membership;
use Carbon\Carbon;

class UpdateMembershipPaymentStatus extends Command
{
    protected $signature = 'memberships:update-payment-status';
    protected $description = 'Update membership payment status to expired if end_date has passed';

    public function handle()
    {
        $now = Carbon::now();
        $processedCount = 0;
        
        // 1. Process memberships with end_date < now (standard case)
        $expiredMemberships = Membership::where('end_date', '<', $now)
            ->where('payment_status', '!=', 'expired')
            ->get();

        foreach ($expiredMemberships as $membership) {
            $membership->payment_status = 'expired';
            $membership->is_active = false;
            $membership->save();
            $this->info("Membership ID {$membership->id} marked as expired (end_date: {$membership->end_date}).");
            $processedCount++;
        }

        // 2. Process memberships with NULL end_date that are pending for more than 30 days
        $oldPendingMemberships = Membership::whereNull('end_date')
            ->where('payment_status', 'pending')
            ->where('created_at', '<', $now->copy()->subDays(30))
            ->get();

        foreach ($oldPendingMemberships as $membership) {
            $membership->payment_status = 'expired';
            $membership->is_active = false;
            $membership->save();
            $this->info("Membership ID {$membership->id} marked as expired (pending for >30 days, created: {$membership->created_at}).");
            $processedCount++;
        }

        // 3. Process memberships with NULL end_date that are pending for more than 7 days and have no start_date
        $incompleteMemberships = Membership::whereNull('end_date')
            ->whereNull('start_date')
            ->where('payment_status', 'pending')
            ->where('created_at', '<', $now->copy()->subDays(7))
            ->get();

        foreach ($incompleteMemberships as $membership) {
            $membership->payment_status = 'expired';
            $membership->is_active = false;
            $membership->save();
            $this->info("Membership ID {$membership->id} marked as expired (incomplete for >7 days, created: {$membership->created_at}).");
            $processedCount++;
        }

        if ($processedCount > 0) {
            $this->info("✅ Successfully processed {$processedCount} membership(s).");
        } else {
            $this->info("ℹ️  No memberships needed status updates.");
        }
        
        $this->info('Membership payment statuses update completed.');
    }
}
