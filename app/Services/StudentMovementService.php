<?php

namespace App\Services;

use App\Models\Student;
use App\Models\StudentMovement;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class StudentMovementService
{
    /**
     * Record a student inscription
     */
    public function recordInscription(Student $student)
    {
        $monthYear = Carbon::parse($student->billingDate)->format('Y-m');
        
        return StudentMovement::create([
            'student_id' => $student->id,
            'movement_type' => 'inscribed',
            'movement_date' => $student->billingDate,
            'month_year' => $monthYear,
            'school_id' => $student->schoolId,
            'class_id' => $student->classId,
            'level_id' => $student->levelId,
            'student_first_name' => $student->firstName,
            'student_last_name' => $student->lastName,
            'student_full_name' => $student->firstName . ' ' . $student->lastName,
            'guardian_name' => $student->guardianName,
            'guardian_number' => $student->guardianNumber,
            'new_status' => $student->status,
            'billing_date' => $student->billingDate,
            'assurance_amount' => $student->assuranceAmount,
            'has_assurance' => $student->assurance,
            'recorded_by' => Auth::id(),
            'notes' => 'Student inscribed automatically',
        ]);
    }

    /**
     * Record a student abandonment
     */
    public function recordAbandonment(Student $student, $reason = null, $previousStatus = null)
    {
        $monthYear = Carbon::now()->format('Y-m');
        
        return StudentMovement::create([
            'student_id' => $student->id,
            'movement_type' => 'abandoned',
            'movement_date' => Carbon::now()->toDateString(),
            'month_year' => $monthYear,
            'school_id' => $student->schoolId,
            'class_id' => $student->classId,
            'level_id' => $student->levelId,
            'student_first_name' => $student->firstName,
            'student_last_name' => $student->lastName,
            'student_full_name' => $student->firstName . ' ' . $student->lastName,
            'guardian_name' => $student->guardianName,
            'guardian_number' => $student->guardianNumber,
            'reason' => $reason,
            'previous_status' => $previousStatus,
            'new_status' => $student->status,
            'recorded_by' => Auth::id(),
            'notes' => 'Student abandoned',
        ]);
    }

    /**
     * Get movement statistics for a specific month and school
     */
    public function getMovementStats($monthYear, $schoolId = null)
    {
        $query = StudentMovement::query();

        if ($schoolId) {
            $query->forSchool($schoolId);
        }

        $inscribedCount = $query->clone()->inscribed()->forMonth($monthYear)->count();
        $abandonedCount = $query->clone()->abandoned()->forMonth($monthYear)->count();

        return [
            'inscribed' => $inscribedCount,
            'abandoned' => $abandonedCount,
            'month' => $monthYear,
            'school_id' => $schoolId,
        ];
    }

    /**
     * Get detailed movement data for a specific month and school
     */
    public function getMovementDetails($monthYear, $schoolId = null)
    {
        $query = StudentMovement::with(['student', 'school', 'class', 'level', 'recordedBy']);

        if ($schoolId) {
            $query->forSchool($schoolId);
        }

        return $query->forMonth($monthYear)->orderBy('movement_date')->get();
    }

    /**
     * Sync existing student data to movements table
     */
    public function syncExistingData()
    {
        // Get all students and create movement records for inscriptions
        $students = Student::all();
        
        foreach ($students as $student) {
            // Check if inscription record already exists
            $existingInscription = StudentMovement::where('student_id', $student->id)
                ->where('movement_type', 'inscribed')
                ->first();

            if (!$existingInscription && $student->billingDate) {
                $this->recordInscription($student);
            }

            // Check if abandonment record exists for inactive students
            if ($student->status === 'inactive') {
                $existingAbandonment = StudentMovement::where('student_id', $student->id)
                    ->where('movement_type', 'abandoned')
                    ->first();

                if (!$existingAbandonment) {
                    $this->recordAbandonment($student, 'Status changed to inactive', 'active');
                }
            }
        }
    }
} 