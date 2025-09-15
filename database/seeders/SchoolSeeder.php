<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\School;

class SchoolSeeder extends Seeder
{
    public function run()
    {
        // Create the specific schools mentioned in your database
        School::create([
            'name' => 'Lincoln High School',
            'address' => '123 Main St, Anytown, USA',
            'phone_number' => '555-555-5555',
            'email' => 'lincolnhigh@example.com',
        ]);
        
        School::create([
            'name' => 'Washington Elementary School',
            'address' => '456 Elm St, Anytown, USA',
            'phone_number' => '555-123-4567',
            'email' => 'washington elem@example.com',
        ]);
        
        School::create([
            'name' => 'Jefferson Middle School',
            'address' => '789 Oak St, Anytown, USA',
            'phone_number' => '555-901-2345',
            'email' => 'jeffersonmiddle@example.com',
        ]);
        
        // Optionally create additional schools using factory
        School::factory()->count(2)->create();
    }
}
