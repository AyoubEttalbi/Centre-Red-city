<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use function Pest\Laravel\call;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();
        $this->call(UserSeeder::class);
        $this->call(SchoolSeeder::class);
        $this->call(LevelSeeder::class);
        $this->call(ClassSeeder::class);
        $this->call(StudentSeeder::class);
        $this->call(SubjectSeeder::class);
        $this->call(TeacherSeeder::class);
        $this->call(AssistantSeeder::class);
        // $this->call(AssistantDashboardTestSeeder::class);
        // User::factory()->create([
        //     'name' => 'Test User',
        //     'email' => 'test@example.com',
        // ]);
    }
}
