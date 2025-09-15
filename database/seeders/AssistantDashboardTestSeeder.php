<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AssistantDashboardTestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $today = Carbon::now();
        
        // Check if assistant exists, otherwise create
        $assistant = DB::table('assistants')->where('email', 'test.assistant@example.com')->first();
        if ($assistant) {
            $assistantId = $assistant->id;
            $this->command->info("Using existing assistant: ID $assistantId");
        } else {
            $assistantId = DB::table('assistants')->insertGetId([
                'first_name' => 'Test',
                'last_name' => 'Assistant',
                'email' => 'test.assistant@example.com',
                'phone_number' => '123456789',
                'status' => 'active',
                'salary' => 5000,
                'created_at' => $today,
                'updated_at' => $today
            ]);
            $this->command->info("Created new assistant: ID $assistantId");
        }
        
        // Check if schools exist, otherwise create
        $school1 = DB::table('schools')->where('email', 'school1@example.com')->first();
        if ($school1) {
            $schoolId1 = $school1->id;
            $this->command->info("Using existing school 1: ID $schoolId1");
        } else {
            $schoolId1 = DB::table('schools')->insertGetId([
                'name' => 'Test School 1',
                'address' => '123 Test Street',
                'phone_number' => '123-456-7890',
                'email' => 'school1@example.com',
                'created_at' => $today,
                'updated_at' => $today
            ]);
            $this->command->info("Created new school 1: ID $schoolId1");
        }
        
        $school2 = DB::table('schools')->where('email', 'school2@example.com')->first();
        if ($school2) {
            $schoolId2 = $school2->id;
            $this->command->info("Using existing school 2: ID $schoolId2");
        } else {
            $schoolId2 = DB::table('schools')->insertGetId([
                'name' => 'Test School 2',
                'address' => '456 Test Avenue',
                'phone_number' => '987-654-3210',
                'email' => 'school2@example.com',
                'created_at' => $today,
                'updated_at' => $today
            ]);
            $this->command->info("Created new school 2: ID $schoolId2");
        }
        
        // Check if association already exists before creating
        $association1 = DB::table('assistant_school')
            ->where('school_id', $schoolId1)
            ->where('assistant_id', $assistantId)
            ->first();
            
        $association2 = DB::table('assistant_school')
            ->where('school_id', $schoolId2)
            ->where('assistant_id', $assistantId)
            ->first();
            
        if (!$association1) {
            DB::table('assistant_school')->insert([
                'school_id' => $schoolId1, 
                'assistant_id' => $assistantId, 
                'created_at' => $today, 
                'updated_at' => $today
            ]);
            $this->command->info("Associated assistant with school 1");
        }
        
        if (!$association2) {
            DB::table('assistant_school')->insert([
                'school_id' => $schoolId2, 
                'assistant_id' => $assistantId, 
                'created_at' => $today, 
                'updated_at' => $today
            ]);
            $this->command->info("Associated assistant with school 2");
        }
        
        // Check if classes exist, otherwise create
        $class1 = DB::table('classes')->where('name', 'Class A')->where('school_id', $schoolId1)->first();
        if ($class1) {
            $classId1 = $class1->id;
            $this->command->info("Using existing class A: ID $classId1");
        } else {
            $classId1 = DB::table('classes')->insertGetId([
                'name' => 'Class A',
                'school_id' => $schoolId1,
                'level_id' => 1,
                'number_of_students' => 20,
                'created_at' => $today,
                'updated_at' => $today
            ]);
            $this->command->info("Created new class A: ID $classId1");
        }
        
        $class2 = DB::table('classes')->where('name', 'Class B')->where('school_id', $schoolId2)->first();
        if ($class2) {
            $classId2 = $class2->id;
            $this->command->info("Using existing class B: ID $classId2");
        } else {
            $classId2 = DB::table('classes')->insertGetId([
                'name' => 'Class B',
                'school_id' => $schoolId2,
                'level_id' => 1,
                'number_of_students' => 15,
                'created_at' => $today,
                'updated_at' => $today
            ]);
            $this->command->info("Created new class B: ID $classId2");
        }
        
        // Create students (check by email to avoid duplicates)
        $students = [];
        for ($i = 1; $i <= 20; $i++) {
            $studentEmail = "student{$i}@example.com";
            $existingStudent = DB::table('students')->where('email', $studentEmail)->first();
            
            if ($existingStudent) {
                $students[] = $existingStudent->id;
                $this->command->info("Using existing student #{$i}: ID {$existingStudent->id}");
            } else {
                $schoolId = $i <= 10 ? $schoolId1 : $schoolId2;
                $classId = $i <= 10 ? $classId1 : $classId2;
                
                $studentId = DB::table('students')->insertGetId([
                    'firstName' => "Student",
                    'lastName' => "#{$i}",
                    'dateOfBirth' => $today->copy()->subYears(15 + ($i % 5)),
                    'billingDate' => $today->copy()->format('Y-m-d'),
                    'address' => "123 Student Address #{$i}",
                    'guardianNumber' => "123456{$i}",
                    'CIN' => "CIN{$i}",
                    'phoneNumber' => "987654{$i}",
                    'email' => $studentEmail,
                    'massarCode' => "S{$i}",
                    'levelId' => 1, // Default level ID
                    'classId' => $classId,
                    'schoolId' => $schoolId,
                    'status' => 'active',
                    'assurance' => 0,
                    'hasDisease' => 0,
                    'diseaseName' => null,
                    'medication' => null,
                    'profile_image' => null,
                    'created_at' => $today,
                    'updated_at' => $today
                ]);
                $students[] = $studentId;
                $this->command->info("Created new student #{$i}: ID {$studentId}");
            }
        }
        
        // Create offers if they don't exist
        $offer1 = DB::table('offers')->where('offer_name', 'Basic Plan')->first();
        if ($offer1) {
            $offerId1 = $offer1->id;
            $this->command->info("Using existing Basic Plan offer: ID $offerId1");
        } else {
            $offerId1 = DB::table('offers')->insertGetId([
                'offer_name' => 'Basic Plan',
                'price' => 500,
                'levelId' => 1, // Default level ID
                'subjects' => json_encode(['Math', 'Science']),
                'percentage' => json_encode([50, 50]),
                'created_at' => $today,
                'updated_at' => $today
            ]);
            $this->command->info("Created new Basic Plan offer: ID $offerId1");
        }
        
        $offer2 = DB::table('offers')->where('offer_name', 'Premium Plan')->first();
        if ($offer2) {
            $offerId2 = $offer2->id;
            $this->command->info("Using existing Premium Plan offer: ID $offerId2");
        } else {
            $offerId2 = DB::table('offers')->insertGetId([
                'offer_name' => 'Premium Plan',
                'price' => 1000,
                'levelId' => 1, // Default level ID
                'subjects' => json_encode(['Math', 'Science', 'English', 'History']),
                'percentage' => json_encode([25, 25, 25, 25]),
                'created_at' => $today,
                'updated_at' => $today
            ]);
            $this->command->info("Created new Premium Plan offer: ID $offerId2");
        }
        
        // Clear existing test data
        $this->command->info("Clearing existing test data...");
        DB::table('attendances')->whereIn('student_id', $students)->delete();
        $this->command->info("Cleared existing attendance records");
        
        // Insert 15 attendances (11 in the last 7 days, 4 older ones)
        // This ensures we have more than 10 in the last 7 days for the "See more" button
        $this->command->info("Inserting new test data...");
        for ($i = 0; $i < 15; $i++) {
            $dayOffset = $i < 11 ? $i : 7 + $i; // First 11 in last 7 days, last 4 in days 8-18
            $status = $i % 2 == 0 ? 'absent' : 'late';
            $reason = $status == 'absent' ? 'Sickness' : 'Traffic';
            
            DB::table('attendances')->insert([
                'student_id' => $students[$i % 20],
                'classId' => $i < 10 ? $classId1 : $classId2,
                'date' => $today->copy()->subDays($dayOffset),
                'status' => $status,
                'reason' => $reason . ' ' . ($i + 1),
                'recorded_by' => 1,
                'created_at' => $today,
                'updated_at' => $today
            ]);
        }
        $this->command->info("Inserted 15 attendance records");
        
        // Clear existing test invoices for these students
        DB::table('invoices')->whereIn('student_id', $students)->delete();
        $this->command->info("Cleared existing invoice records");
        
        // Insert 15 unpaid invoices (11 in the last 7 days, 4 older ones)
        for ($i = 0; $i < 15; $i++) {
            $dayOffset = $i < 11 ? $i : 10 + $i; // First 11 in last 7 days
            $totalAmount = 1000 + ($i * 100);
            $amountPaid = $totalAmount / 2;
            
            DB::table('invoices')->insert([
                'student_id' => $students[$i % 20],
                'months' => 1, // Default to 1 month
                'billDate' => $today->copy()->subDays($dayOffset),
                'creationDate' => $today->copy()->subDays($dayOffset),
                'totalAmount' => $totalAmount,
                'amountPaid' => $amountPaid,
                'rest' => $totalAmount - $amountPaid,
                'endDate' => $today->copy()->addMonths(1),
                'created_at' => $today,
                'updated_at' => $today
            ]);
        }
        $this->command->info("Inserted 15 unpaid invoices");
        
        // Clear existing memberships
        DB::table('memberships')->whereIn('student_id', $students)->delete();
        $this->command->info("Cleared existing membership records");
        
        // Insert 15 memberships expiring soon (11 in next 7 days, 4 in days 8-14)
        for ($i = 0; $i < 15; $i++) {
            $dayOffset = $i < 11 ? $i + 1 : 7 + $i; // First 11 in next 7 days
            
            DB::table('memberships')->insert([
                'student_id' => $students[$i % 20],
                'offer_id' => $i % 2 == 0 ? $offerId1 : $offerId2,
                'start_date' => $today->copy()->subMonths(1),
                'end_date' => $today->copy()->addDays($dayOffset),
                'payment_status' => 'paid',
                'is_active' => 1,
                'teachers' => json_encode([1]), // JSON encoded array for teachers
                'created_at' => $today,
                'updated_at' => $today
            ]);
        }
        $this->command->info("Inserted 15 memberships");
        
        // Insert 15 paid invoices (recent payments)
        for ($i = 0; $i < 15; $i++) {
            $dayOffset = $i < 11 ? $i : 10 + $i; // First 11 in last 7 days
            $amount = 800 + ($i * 50);
            
            DB::table('invoices')->insert([
                'student_id' => $students[$i % 20],
                'months' => 1, // Default to 1 month
                'billDate' => $today->copy()->subDays($dayOffset + 5),
                'creationDate' => $today->copy()->subDays($dayOffset + 5),
                'totalAmount' => $amount,
                'amountPaid' => $amount,
                'rest' => 0,
                'endDate' => $today->copy()->addMonths(1),
                'created_at' => $today->copy()->subDays($dayOffset + 5),
                'updated_at' => $today->copy()->subDays($dayOffset) // Payment date
            ]);
        }
        $this->command->info("Inserted 15 paid invoices");
        
        $this->command->info('Test data for Assistant Dashboard created successfully!');
    }
} 