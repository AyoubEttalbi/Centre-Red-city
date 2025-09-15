<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Student;
use App\Models\School;
use App\Models\Level;
use App\Models\Classes;

class StudentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ensure we have the necessary dependencies before creating students
        if (School::count() === 0) {
            $this->call(SchoolSeeder::class);
        }
        
        if (Level::count() === 0) {
            $this->call(LevelSeeder::class);
        }
        
        if (Classes::count() === 0) {
            $this->call(ClassSeeder::class);
        }
        
        // Create students using factory
        try {
            Student::factory()->count(500)->create();
            $this->command->info('Successfully created 50 students.');
        } catch (\Exception $e) {
            $this->command->error('Error creating students: ' . $e->getMessage());
            $this->command->info('Make sure you have schools, levels, and classes seeded first.');
        }
    }
}
