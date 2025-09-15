<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\School>
 */
class SchoolFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $schoolTypes = ['High School', 'Elementary School', 'Middle School', 'Academy', 'Institute'];
        $schoolNames = [
            'Lincoln', 'Washington', 'Jefferson', 'Roosevelt', 'Kennedy', 
            'Madison', 'Adams', 'Monroe', 'Jackson', 'Van Buren'
        ];
        
        return [
            'name' => $this->faker->randomElement($schoolNames) . ' ' . $this->faker->randomElement($schoolTypes),
            'address' => $this->faker->streetAddress() . ', ' . $this->faker->city() . ', ' . $this->faker->stateAbbr() . ' ' . $this->faker->postcode(),
            'phone_number' => $this->faker->numerify('555-###-####'),
            'email' => $this->faker->unique()->safeEmail(),
        ];
    }
}
