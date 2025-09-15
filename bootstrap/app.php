<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        //
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })
    ->withSchedule(function (\Illuminate\Console\Scheduling\Schedule $schedule) {
        // Schedule the membership expiration command to run daily
        $schedule->command('memberships:update-payment-status')->daily();
        
        // Schedule the membership stats update to run daily at 1 AM
        $schedule->command('memberships:update-stats --all')->dailyAt('01:00');
        
         // Schedule teacher monthly payments to run on the 1st of each month at 2 AM
         $schedule->command('teachers:process-monthly-payments')->monthlyOn(1, '02:00');
        
        // Weekly monitoring: Fix any membership inconsistencies every Sunday at 2 AM
        $schedule->command('memberships:fix-end-dates')->weekly()->sundays()->at('02:00');
        
        // Clean up old stats monthly on the 1st at 3 AM
        $schedule->call(function () {
            $service = new \App\Services\MembershipStatsService();
            $service->cleanupOldStats(5); // Keep 5 years of stats
        })->monthlyOn(1, '03:00');
    })
    ->create();
