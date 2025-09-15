<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Teacher;

class TeacherSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        try {
            Teacher::factory()->count(20)->create();
            $this->command->info('Successfully created 20 teachers.');
        } catch (\Exception $e) {
            $this->command->error('Error creating teachers: ' . $e->getMessage());
        }
    }
}
