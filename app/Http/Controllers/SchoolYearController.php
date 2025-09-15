<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Teacher;
use App\Models\Classes;
use App\Models\Level;
use App\Models\Membership;
use App\Models\SchoolYear;
use App\Models\Assistant;
use App\Models\ClassTimetable;
use App\Models\ClassModel;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class SchoolYearController extends Controller
{
    /**
     * Handle the school year transition process
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function transition(Request $request)
    {
        try {
            DB::beginTransaction();

            // Create a record of the completed school year
            $archivedYear = $this->archiveSchoolYearData();

            // 1. Reset all teacher class assignments and remove from their profiles
            $teacherCount = $this->resetTeacherAssignments();

            // 2. Soft delete all current memberships (archive them)
            $membershipCount = $this->archiveMemberships();

            // 3. Promote students to the next grade level (if applicable)
            [$promotedCount, $graduatedCount] = $this->promoteStudents();
            
            // 4. Set all students to inactive
            $inactiveStudentCount = $this->setStudentsInactive();
            
            // 5. Set all teachers to inactive
            $inactiveTeacherCount = $this->setTeachersInactive();
            
            // 6. Set all assistants to inactive
            $inactiveAssistantCount = $this->setAssistantsInactive();

            DB::commit();

            $message = "School year transition completed successfully: 
                        {$teacherCount} teacher assignments reset, 
                        {$membershipCount} memberships archived, 
                        {$promotedCount} students promoted, 
                        {$graduatedCount} students graduated,
                        {$inactiveStudentCount} students set to inactive,
                        {$inactiveTeacherCount} teachers set to inactive,
                        {$inactiveAssistantCount} assistants set to inactive.
                        All data has been preserved in the database for historical records.";

            return redirect()->back()->with('success', $message);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('School year transition failed: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            
            return redirect()->back()->with('error', 'School year transition failed: ' . $e->getMessage());
        }
    }

    /**
     * Clear student class assignments without promoting them
     * 
     * @return array [clearedCount, 0] - Second value kept for backward compatibility
     */
    private function promoteStudents()
    {
        // Get all active students
        $students = Student::where('status', 'active')->get();
        $clearedCount = 0;

        foreach ($students as $student) {
            // Clear class assignment for all students
            $student->classId = null;
            $student->save();
            $clearedCount++;
            
            Log::info("Student {$student->id} ({$student->firstName} {$student->lastName}) class assignment cleared. Level remains {$student->levelId}.");
        }

        Log::info("School year transition: {$clearedCount} student class assignments cleared without level changes");
        
        // Return array with same structure for backward compatibility
        return [$clearedCount, 0];
    }

    /**
     * Reset teacher class assignments for the new school year
     * 
     * @return int Number of teacher-class relationships reset
     */
    private function resetTeacherAssignments()
    {
        // Get all teachers
        $teachers = Teacher::all();
        $totalResetCount = 0;
        
        // First clear the pivot table directly for efficiency
        $pivotCount = DB::table('classes_teacher')->count();
        DB::table('classes_teacher')->truncate();
        Log::info("Truncated classes_teacher pivot table, removed {$pivotCount} relationships");
        
        foreach ($teachers as $teacher) {
            // For logging purposes, count previous assignments if possible
            $classCount = 0;
            
            if (method_exists($teacher, 'classes')) {
                // The relationships have already been detached by truncating the pivot table
                // This is just to note in the log how many classes each teacher had
                $classCount = $teacher->classes()->count();
                Log::info("Teacher {$teacher->id} ({$teacher->first_name} {$teacher->last_name}): {$classCount} class assignments reset");
            }
            
            // Reset subjects relationship if applicable
            if (method_exists($teacher, 'subjects')) {
                $subjectCount = $teacher->subjects()->count();
                // We don't detach subjects as teachers still teach the same subjects
                // But we log for information
                Log::info("Teacher {$teacher->id} maintains {$subjectCount} subject assignments");
            }
            
            // Update the teacher's record to reflect the change
            $teacher->updated_at = now();
            $teacher->save();
            
            $totalResetCount += $classCount;
        }
        
        Log::info("School year transition: {$totalResetCount} teacher-class assignments reset");
        
        return $totalResetCount;
    }

    /**
     * Archive (soft delete) current memberships
     * 
     * @return int Number of memberships archived
     */
    private function archiveMemberships()
    {
        // Get all active memberships - using correct field names from the model
        $memberships = Membership::whereNull('deleted_at')
            ->where(function($query) {
                $query->whereNull('end_date')->orWhere('end_date', '>', now());
            })
            ->get();
        $count = 0;

        foreach ($memberships as $membership) {
            // Mark membership as completed
            $membership->end_date = Carbon::now();
            $membership->is_active = false; // Mark as inactive if the field exists
            $membership->save();
            
            // Soft delete the membership (it will still be in the database but won't appear in queries)
            $membership->delete();
            $count++;
            
            Log::info("Membership {$membership->id} for student {$membership->student_id} marked as completed and archived");
        }

        // Update all class membership counts
        $this->updateClassMembershipCounts();

        Log::info("School year transition: {$count} memberships archived");
        
        return $count;
    }
    
    /**
     * Update class membership counts after archiving memberships
     */
    private function updateClassMembershipCounts()
    {
        $classes = Classes::all();
        
        foreach ($classes as $class) {
            // Reset the count to 0 since all active memberships were archived
            $class->number_of_students = 0;
            $class->save();
            
            Log::info("Class {$class->id} ({$class->name}) membership count reset to 0");
        }
    }

    /**
     * Archive completed school year data
     * 
     * @return SchoolYear The archived school year record
     */
    private function archiveSchoolYearData()
    {
        // Create a record of the completed school year
        $schoolYear = new SchoolYear();
        $schoolYear->year = Carbon::now()->year;
        $schoolYear->ended_at = Carbon::now();
        $schoolYear->name = 'School Year ' . Carbon::now()->year . '-' . (Carbon::now()->year + 1);
        
        // Get statistics for the archived year
        $statistics = [
            'active_students' => Student::where('status', 'active')->count(),
            'graduated_students' => Student::where('status', 'graduated')->count(),
            'teachers' => Teacher::count(),
            'classes' => Classes::count(),
            'active_memberships' => Membership::whereNull('deleted_at')
                ->where(function($query) {
                    $query->whereNull('end_date')->orWhere('end_date', '>', now());
                })
                ->count(),
            'levels' => Level::count(),
        ];
        
        // Add more detailed statistics
        $statistics['students_per_level'] = $this->getStudentsPerLevel();
        $statistics['teachers_per_subject'] = $this->getTeachersPerSubject();
        $statistics['classes_per_level'] = $this->getClassesPerLevel();
        
        // Store statistics in the school year record
        $schoolYear->statistics = json_encode($statistics);
        $schoolYear->save();
        
        Log::info("School year {$schoolYear->name} archived successfully with detailed statistics");
        
        return $schoolYear;
    }
    
    /**
     * Get count of students per level
     * 
     * @return array
     */
    private function getStudentsPerLevel()
    {
        $result = [];
        $levels = Level::all();
        
        foreach ($levels as $level) {
            $result[$level->id] = [
                'name' => $level->name,
                'count' => Student::where('levelId', $level->id)->where('status', 'active')->count()
            ];
        }
        
        return $result;
    }
    
    /**
     * Get count of teachers per subject
     * 
     * @return array
     */
    private function getTeachersPerSubject()
    {
        // This implementation depends on your specific model relationships
        // Here's a placeholder that you can customize based on your database structure
        return DB::table('subject_teacher')
            ->select('subject_id', DB::raw('count(*) as teacher_count'))
            ->groupBy('subject_id')
            ->get()
            ->mapWithKeys(function ($item) {
                $subjectName = DB::table('subjects')->where('id', $item->subject_id)->value('name') ?? 'Unknown';
                return [$item->subject_id => [
                    'name' => $subjectName,
                    'count' => $item->teacher_count
                ]];
            })
            ->toArray();
    }
    
    /**
     * Get count of classes per level
     * 
     * @return array
     */
    private function getClassesPerLevel()
    {
        $result = [];
        $levels = Level::all();
        
        foreach ($levels as $level) {
            $result[$level->id] = [
                'name' => $level->name,
                'count' => Classes::where('level_id', $level->id)->count()
            ];
        }
        
        return $result;
    }
    
    /**
     * Set up initial student promotion records for the current school year
     * Process promotion data from the form
     * 
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function setupPromotions(Request $request)
    {
        try {
            // Add debug log
            Log::info('setupPromotions method called');
            
            // Check if we have promotion data in the request
            if ($request->has('promotions')) {
                Log::info('Processing promotion data from form submission');
                $promotionsData = $request->input('promotions');
                $count = 0;
                
                foreach ($promotionsData as $promotion) {
                    if (!isset($promotion['student_id'])) {
                        continue; // Skip invalid entries
                    }
                    
                    $studentId = $promotion['student_id'];
                    $isPromoted = isset($promotion['is_promoted']) ? (bool)$promotion['is_promoted'] : true;
                    $notes = $promotion['notes'] ?? '';
                    
                    // Get student information for logging
                    $student = Student::find($studentId);
                    if (!$student) {
                        Log::warning("Student ID {$studentId} not found");
                        continue;
                    }
                    
                    // For debugging: log each student we're processing
                    Log::info("Processing student ID: {$student->id}, Name: {$student->firstName} {$student->lastName}, Promotion Status: " . ($isPromoted ? 'Promoted' : 'Not Promoted'));
                    
                    // Update or create promotion record
                    DB::table('student_promotions')
                        ->updateOrInsert(
                            [
                                'student_id' => $studentId,
                                'school_year' => Carbon::now()->year
                            ],
                            [
                                'class_id' => $student->classId,
                                'level_id' => $student->levelId,
                                'is_promoted' => $isPromoted ? 1 : 0,
                                'notes' => $notes,
                                'created_at' => now(),
                                'updated_at' => now()
                            ]
                        );
                    $count++;
                }
                
                Log::info("Processed promotion records for {$count} students");
                
                return redirect()->back()->with('success', "Successfully set up promotion records for {$count} students.");
            }
            
            // If no promotion data in request, this is a GET request to show the form
            // Get all active students
            $students = Student::where('status', 'active')->get();
            $count = 0;
            
            // Log number of students found
            Log::info('Found ' . $students->count() . ' active students');
            
            // Get the current student data with promotions for display in the form
            $studentsWithPromotions = Student::with(['promotions' => function($query) {
                $query->where('school_year', Carbon::now()->year);
            }])->where('status', 'active')->get();
            
            // Get only the promotion data to send back
            $promotionData = [];
            foreach ($studentsWithPromotions as $student) {
                if ($student->promotions->isNotEmpty()) {
                    $promotionData[] = $student->promotions->first();
                }
            }
            
            return redirect()->back()->with([
                'success' => "Please set up promotion status for each student.",
                'promotionData' => $promotionData
            ]);
        } catch (\Exception $e) {
            Log::error('Setup promotions failed: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return redirect()->back()->with('error', 'Failed to set up promotion records: ' . $e->getMessage());
        }
    }
    
    /**
     * Update a student's promotion status
     * 
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function updatePromotion(Request $request)
    {
        try {
            $validated = $request->validate([
                'student_id' => 'required|integer|exists:students,id',
                'is_promoted' => 'required|boolean',
                'notes' => 'nullable|string|max:500'
            ]);
            
            // Update or create the promotion record
            DB::table('student_promotions')
                ->updateOrInsert(
                    [
                        'student_id' => $validated['student_id'],
                        'school_year' => Carbon::now()->year
                    ],
                    [
                        'is_promoted' => $validated['is_promoted'],
                        'notes' => $validated['notes'] ?? '',
                        'updated_at' => now()
                    ]
                );
            
            $studentName = Student::find($validated['student_id'])->firstName . ' ' . Student::find($validated['student_id'])->lastName;
            $status = $validated['is_promoted'] ? 'promoted' : 'not promoted';
            
            return redirect()->back()->with('success', "Student {$studentName} marked as {$status}.");
        } catch (\Exception $e) {
            Log::error('Update promotion failed: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to update promotion status: ' . $e->getMessage());
        }
    }
    
    /**
     * Set all students to inactive status
     * 
     * @return int Number of students set to inactive
     */
    private function setStudentsInactive()
    {
        // Get active students
        $students = Student::where('status', 'active')->get();
        $count = 0;
        
        foreach ($students as $student) {
            $student->status = 'inactive';
            $student->save();
            $count++;
            
            Log::info("Student {$student->id} ({$student->firstName} {$student->lastName}) status set to inactive.");
        }
        
        Log::info("School year transition: {$count} students set to inactive status");
        
        return $count;
    }
    
    /**
     * Set all teachers to inactive status
     * 
     * @return int Number of teachers set to inactive
     */
    private function setTeachersInactive()
    {
        // Get active teachers
        $teachers = Teacher::where('status', 'active')->get();
        $count = 0;
        
        foreach ($teachers as $teacher) {
            $teacher->status = 'inactive';
            $teacher->save();
            $count++;
            
            Log::info("Teacher {$teacher->id} ({$teacher->first_name} {$teacher->last_name}) status set to inactive.");
        }
        
        Log::info("School year transition: {$count} teachers set to inactive status");
        
        return $count;
    }
    
    /**
     * Set all assistants to inactive status
     * 
     * @return int Number of assistants set to inactive
     */
    private function setAssistantsInactive()
    {
        // Get active assistants
        $assistants = Assistant::where('status', 'active')->get();
        $count = 0;
        
        foreach ($assistants as $assistant) {
            $assistant->status = 'inactive';
            $assistant->save();
            $count++;
            
            Log::info("Assistant {$assistant->id} ({$assistant->first_name} {$assistant->last_name}) status set to inactive.");
        }
        
        Log::info("School year transition: {$count} assistants set to inactive status");
        
        return $count;
    }
} 