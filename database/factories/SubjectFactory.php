<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Subject>
 */
class SubjectFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $subjects = [
            'Mathematics', 'Physics', 'Chemistry', 'Biology', 'History', 
            'Geography', 'Literature', 'English', 'French', 'Arabic',
            'Computer Science', 'Physical Education', 'Art', 'Music'
        ];
        
        $colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
        ];
        
        return [
            'name' => $this->faker->unique()->randomElement($subjects),
            'icon' => $this->faker->randomElement(['📚', '🔬', '🧮', '🌍', '📖', '🎨', '🎵', '💻']),
            'color' => $this->faker->randomElement($colors),
        ];
    }
}
