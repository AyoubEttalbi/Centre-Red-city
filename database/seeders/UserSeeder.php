<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{
    public function run()
    {
        DB::table('users')->insert([
            'name' => 'John Doe',
            'email' => 'john.doe@example.com',
            'email_verified_at' => now(),
            'password' => Hash::make('password123'),
            'remember_token' => Str::random(10),
            'role' => 'admin', 
        ]);
        DB::table('users')->insert([
            'name' => 'Red City Admin',
            'email' => 'redcity@admin.com',
            'email_verified_at' => now(),
            'password' => Hash::make('RedCity@123'),
            'remember_token' => Str::random(10),
            'role' => 'admin', 
        ]);
        
    }
}