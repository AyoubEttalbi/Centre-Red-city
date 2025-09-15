<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Classes;
use App\Models\School;
use App\Models\Level;

class ClassSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ensure we have schools and levels before creating classes
        if (School::count() === 0) {
            $this->call(SchoolSeeder::class);
        }
        
        if (Level::count() === 0) {
            $this->call(LevelSeeder::class);
        }
        
        // Create classes using factory
        Classes::factory()->count(10)->create();
    }
}
