<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Assistant;

class AssistantSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        try {
            Assistant::factory()->count(10)->create();
            $this->command->info('Successfully created 10 assistants.');
        } catch (\Exception $e) {
            $this->command->error('Error creating assistants: ' . $e->getMessage());
        }
    }
}
