<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Subject;
class SubjectSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $subjectsData = [
            ['name' => 'Programming', 'icon' => 'Code', 'color' => 'bg-blue-100 text-blue-700'],
            ['name' => 'Design', 'icon' => 'Palette', 'color' => 'bg-purple-100 text-purple-700'],
            ['name' => 'Literature', 'icon' => 'BookOpen', 'color' => 'bg-yellow-100 text-yellow-700'],
            ['name' => 'Mathematics', 'icon' => 'Calculator', 'color' => 'bg-green-100 text-green-700'],
            ['name' => 'Languages', 'icon' => 'Globe', 'color' => 'bg-red-100 text-red-700'],
            ['name' => 'Science', 'icon' => 'Microscope', 'color' => 'bg-cyan-100 text-cyan-700'],
            ['name' => 'Music', 'icon' => 'Music', 'color' => 'bg-pink-100 text-pink-700'],
            ['name' => 'Physical Education', 'icon' => 'Dumbbell', 'color' => 'bg-orange-100 text-orange-700'],
        ];

        foreach ($subjectsData as $subject) {
            Subject::create($subject);
        }
    }
}
