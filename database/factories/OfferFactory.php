<?php

namespace Database\Factories;

use App\Models\Offer;
use App\Models\Level;
use Illuminate\Database\Eloquent\Factories\Factory;

class OfferFactory extends Factory
{
    protected $model = Offer::class;

    public function definition()
    {
        return [
            'offer_name' => $this->faker->words(3, true), // Random offer name (e.g., "Math & Pc")
            'price' => $this->faker->randomFloat(2, 100, 1000), // Random price between 100 and 1000 with 2 decimal places
            'levelId' => Level::inRandomOrder()->first()->id, // Random level from the 'levels' table
            'subjects' => $this->faker->randomElements(['Math', 'Physics', 'Chemistry', 'Biology', 'English'], 2), // Random subjects
            'percentage' => [
                'Math' => $this->faker->numberBetween(10, 30), // Random percentage for Math
                'Physics' => $this->faker->numberBetween(10, 30), // Random percentage for Physics
            ],
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}
