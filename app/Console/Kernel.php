<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;
use App\Services\MembershipStatsService;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // Schedule the membership expiration command to run daily
        $schedule->command('memberships:update-payment-status')->daily();
        
        // Schedule the membership stats update to run daily at 1 AM
        $schedule->command('memberships:update-stats --all')->dailyAt('01:00');
        
        // Schedule teacher monthly payments to run on the 1st of each month at 2 AM
        $schedule->command('teachers:process-monthly-payments')->monthlyOn(1, '02:00');
        
        // Clean up old stats monthly on the 1st at 3 AM
        $schedule->call(function () {
            $service = new MembershipStatsService();
            $service->cleanupOldStats(2); // Keep 2 years of stats
        })->monthlyOn(1, '03:00');
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');
        require base_path('routes/console.php');
    }
} 