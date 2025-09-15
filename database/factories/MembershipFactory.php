<?php

namespace Database\Factories;

use App\Models\Student;
use App\Models\Offer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Membership>
 */
class MembershipFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // Get available IDs dynamically
        $studentIds = Student::pluck('id')->toArray();
        $studentId = !empty($studentIds) ? $this->faker->randomElement($studentIds) : 1;
        
        $offerIds = Offer::pluck('id')->toArray();
        $offerId = !empty($offerIds) ? $this->faker->randomElement($offerIds) : 1;
        
        return [
            'student_id' => $studentId,
            'offer_id' => $offerId,
            'teachers' => $this->faker->randomElements([1, 2, 3, 4, 5], $this->faker->numberBetween(1, 3)),
            'payment_status' => $this->faker->randomElement(['paid', 'pending', 'overdue']),
            'is_active' => $this->faker->boolean(80), // 80% chance of being active
            'start_date' => $this->faker->dateTimeBetween('-1 year', 'now'),
            'end_date' => $this->faker->dateTimeBetween('now', '+1 year'),
        ];
    }
}
