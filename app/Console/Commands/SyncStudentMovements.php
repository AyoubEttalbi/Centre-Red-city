<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\StudentMovementService;

class SyncStudentMovements extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'students:sync-movements';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync existing student data to movements table';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting student movements sync...');
        
        $service = new StudentMovementService();
        
        try {
            $service->syncExistingData();
            $this->info('Student movements sync completed successfully!');
        } catch (\Exception $e) {
            $this->error('Error syncing student movements: ' . $e->getMessage());
            return 1;
        }
        
        return 0;
    }
}
