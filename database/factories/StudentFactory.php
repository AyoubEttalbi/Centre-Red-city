<?php

namespace Database\Factories;

use App\Models\Classes;
use App\Models\Level;
use App\Models\School;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class StudentFactory extends Factory
{
    public function definition(): array
    {
        // Get available IDs dynamically
        $levelIds = Level::pluck('id')->toArray();
        $levelId = !empty($levelIds) ? $this->faker->randomElement($levelIds) : 1;
        
        $classIds = Classes::pluck('id')->toArray();
        $classId = !empty($classIds) ? $this->faker->randomElement($classIds) : null;
        
        $schoolIds = School::pluck('id')->toArray();
        $schoolId = !empty($schoolIds) ? $this->faker->randomElement($schoolIds) : 1;
        
        // Generate guardian name
        $guardianName = $this->faker->name();
        
        // Determine if student has disease
        $hasDisease = $this->faker->boolean(20); // 20% chance of having disease
        
        return [
            'firstName' => $this->faker->firstName(),
            'lastName' => $this->faker->lastName(),
            'dateOfBirth' => $this->faker->dateTimeBetween('-18 years', '-6 years'),
            'billingDate' => $this->faker->dateTimeBetween('-1 year', 'now'),
            'address' => $this->faker->address(),
            'guardianNumber' => $this->faker->phoneNumber(),
            'guardianName' => $guardianName,
            'CIN' => $this->faker->unique()->regexify('[A-Z0-9]{10}'),
            'phoneNumber' => $this->faker->phoneNumber(),
            'email' => $this->faker->unique()->safeEmail(),
            'massarCode' => $this->faker->unique()->regexify('[A-Z0-9]{10}'),
            'levelId' => $levelId,
            'classId' => $classId,
            'schoolId' => $schoolId,
            'status' => $this->faker->randomElement(['active', 'inactive']),
            'assurance' => $this->faker->boolean(80), // 80% chance of having assurance
            'assuranceAmount' => $this->faker->randomFloat(2, 100, 1000),
            'profile_image' => $this->faker->imageUrl(640, 480, 'people'),
            'hasDisease' => $hasDisease,
            'diseaseName' => $hasDisease ? $this->faker->randomElement(['Asthma', 'Diabetes', 'Allergies', 'Epilepsy', 'Heart Condition']) : null,
            'medication' => $hasDisease ? $this->faker->sentence(3) : null,
        ];
    }
}

