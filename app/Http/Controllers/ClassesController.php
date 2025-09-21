<?php

namespace App\Http\Controllers;

use App\Models\Classes;
use App\Models\Level;
use App\Models\School;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
class ClassesController extends Controller
{
    /**
     * Display a listing of the resource.
     */
   public function index(Request $request)
    {   
        $user = $request->user();
        $role = $user->role;
        $levels = Level::all();
        $schools = School::all();
        // Get the selected school from session
        $selectedSchoolId = session('school_id');
        
        // Initialize teacher variable
        $teacher = null;
        if ($role === 'teacher') {
            $teacher = Teacher::where('email', $user->email)->first();
        }
        
        // Base query with level relationship
        $classesQuery = Classes::with('level');
        
        // If a school is selected in the session, filter by that school
        // For teachers, show classes from their school OR classes with no school assigned
        if ($selectedSchoolId) {
            if ($role === 'teacher') {
                $classesQuery->where(function($q) use ($selectedSchoolId) {
                    $q->where('school_id', $selectedSchoolId)
                      ->orWhereNull('school_id');
                });
                Log::info('Debug: School filtering for teacher', [
                    'selected_school_id' => $selectedSchoolId,
                    'filter_logic' => 'school_id = ' . $selectedSchoolId . ' OR school_id IS NULL'
                ]);
            } else {
                $classesQuery->where('school_id', $selectedSchoolId);
                Log::info('Debug: School filtering for admin/assistant', [
                    'selected_school_id' => $selectedSchoolId,
                    'filter_logic' => 'school_id = ' . $selectedSchoolId
                ]);
            }
        } else {
            Log::info('Debug: No school filtering applied', [
                'selected_school_id' => null
            ]);
        }

        // Apply search filter if search term is provided
        if ($request->has('search') && !empty($request->search)) {
            $searchTerm = $request->search;
            $classesQuery->where(function ($query) use ($searchTerm) {
                $query->where('name', 'LIKE', "%{$searchTerm}%")
                      ->orWhereHas('level', function ($levelQuery) use ($searchTerm) {
                          $levelQuery->where('name', 'LIKE', "%{$searchTerm}%");
                      });
            });
        }

        // Apply additional filters
        if (!empty($request->level)) {
            $classesQuery->where('level_id', $request->level);
        }

        if (!empty($request->school)) {
            $classesQuery->where('school_id', $request->school);
        }
        
        // If user is a teacher, only show classes they teach
        if ($role === 'teacher' && $teacher) {
            // Debug: Check the teacher-class relationship
            $teacherClasses = $teacher->classes;
            $teacherClassIds = $teacherClasses->pluck('id')->toArray();
            
            Log::info('Debug: Teacher classes relationship', [
                'teacher_id' => $teacher->id,
                'teacher_email' => $user->email,
                'classes_count' => $teacherClasses->count(),
                'class_ids' => $teacherClassIds,
                'classes_data' => $teacherClasses->map(function($class) {
                    return [
                        'id' => $class->id,
                        'name' => $class->name,
                        'school_id' => $class->school_id
                    ];
                })
            ]);
            
            // Also check the pivot table directly
            $pivotData = DB::table('classes_teacher')->where('teacher_id', $teacher->id)->get();
            Log::info('Debug: Pivot table data', [
                    'teacher_id' => $teacher->id,
                    'pivot_records_count' => $pivotData->count(),
                    'pivot_data' => $pivotData->toArray()
                ]);
                
            // Filter to only get classes this teacher teaches at the selected school
            $classesQuery->whereIn('id', $teacherClassIds);
        } elseif ($role === 'teacher' && !$teacher) {
            // If teacher record not found, return empty collection
            return Inertia::render('Menu/ClassesPage', [
                'classes' => [],
                'levels' => $levels,
                'filters' => $request->only(['search', 'level', 'school']),
            ]);
        }
        
        // Execute the query
        $classes = $classesQuery->get();
        
        // Debug: Log the final results
        Log::info('Debug: Classes query results', [
            'user_role' => $role,
            'teacher_id' => $role === 'teacher' ? ($teacher ? $teacher->id : null) : null,
            'classes_count' => $classes->count(),
            'classes_data' => $classes->map(function($class) {
                return [
                    'id' => $class->id,
                    'name' => $class->name,
                    'school_id' => $class->school_id
                ];
            })
        ]);
        
        // Update student and teacher counts for all classes
        $classes->each(function ($class) use ($role, $teacher) {
            $class->updateTeacherCount();
            
            // For teachers, calculate student count based on students they teach
            if ($role === 'teacher' && $teacher) {
                $teacherStudentCount = $this->getTeacherStudentCount($class, $teacher);
                $class->number_of_students = $teacherStudentCount;
            } else {
                // For admins/assistants, use the regular count
                $class->updateStudentCount();
            }
        });
        
        return Inertia::render('Menu/ClassesPage', [
            'classes' => $classes,
            'schools' => $schools,
            'levels' => $levels,
            'filters' => $request->only(['search', 'level', 'school']),
            'selectedSchool' => $selectedSchoolId ? [
                'id' => $selectedSchoolId,
                'name' => session('school_name')
            ] : null
        ]);
    }


    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $levels = Level::all(); // Fetch all levels for the dropdown
        $schools = School::all(); // Fetch all schools for the dropdown
        return Inertia::render('Menu/ClassesPage', [
            'levels' => $levels,
            'schools' => $schools,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Validate the request data
        $validatedData = $request->validate([
            'name' => 'required|string|max:255|unique:classes,name',
            'level_id' => 'required|exists:levels,id',
            'school_id' => 'required|exists:schools,id',
            'number_of_students' => 'nullable|integer|min:0',
        ]);

        // Create a new class
        Classes::create($validatedData);

        // Redirect to the classes index page with a success message
        return redirect()->route('classes.index')->with('success', 'Class created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Classes $class)
    {   
        $user = $request->user();
        $role = $user->role;
        
        // If user is a teacher, check if they teach this class
        if ($role === 'teacher') {
            $teacher = Teacher::where('email', $user->email)->first();
            
            if (!$teacher) {
                return redirect()->route('classes.index')
                    ->with('error', 'Teacher record not found');
            }
            
            // Check if the teacher teaches this class
            $teachesClass = $teacher->classes()->where('classes.id', $class->id)->exists();
            
            if (!$teachesClass) {
                // Teacher does not teach this class, redirect back with error
                return redirect()->route('classes.index')
                    ->with('error', 'You do not have access to this class');
            }
        }
        
        $schools = School::all();
        $classes = Classes::all();
        $levels = Level::all();
        
        // Get teachers through the relationship instead of direct DB query
        $teachers = $class->teachers;
        
        // Update both student and teacher counts
        $class->updateCounts();
        
        // Get students in this class
        try {
            if ($role === 'teacher' && isset($teacher)) {
                // For teachers, only get students they teach
                $studentsList = $this->getTeacherStudentsInClass($class, $teacher);
            } else {
                // For admins/assistants, get all students in the class
                $students = DB::table('students')->where('classId', $class->id);
                $studentsList = $students->get()->toArray();
            }
        } catch (\Exception $e) {
            Log::error('Error getting students for class', [
                'class_id' => $class->id,
                'user_role' => $role,
                'error' => $e->getMessage()
            ]);
            $studentsList = [];
        }
        
        // Ensure studentsList is always an array
        if (!is_array($studentsList)) {
            $studentsList = [];
        }
        
        // Debug: Log the students list format
        Log::info('Debug: Students list format', [
            'user_role' => $role,
            'students_count' => is_countable($studentsList) ? count($studentsList) : 'not countable',
            'students_type' => gettype($studentsList),
            'students_class' => is_object($studentsList) ? get_class($studentsList) : 'not object',
            'is_array' => is_array($studentsList),
            'is_collection' => $studentsList instanceof \Illuminate\Support\Collection
        ]);
        
        // Get student IDs for promotion data lookup
        $studentIds = collect($studentsList)->pluck('id')->toArray();
        
        // First check if there's promotion data in the session (from setupPromotions redirect)
        $promotionData = session('promotionData', null);
        
        // If no session data, query the database
        if (!$promotionData) {
            // Get promotion data for these students using Eloquent models
            $studentsWithPromotions = Student::whereIn('id', $studentIds)->with(['promotions' => function($query) {
                $query->where('school_year', date('Y'));
            }])->get();
            
            // Convert to a format compatible with the existing code
            $promotionData = collect();
            foreach ($studentsWithPromotions as $student) {
                if ($student->promotions->isNotEmpty()) {
                    $promotionData->push($student->promotions->first());
                }
            }
        }
        
        
        
        // Ensure students is always an array
        $studentsArray = is_array($studentsList) ? $studentsList : [];
        
        // Debug: Log the actual student data being passed to frontend
        Log::info('Debug: Student data for frontend', [
            'students_count' => count($studentsArray),
            'students_data' => $studentsArray,
            'first_student_keys' => count($studentsArray) > 0 ? array_keys((array)$studentsArray[0]) : 'no students'
        ]);
        
        return Inertia::render('Menu/SingleClassPage', [
            'class' => $class->load('level'), 
            'students' => $studentsArray,
            'Alllevels' => $levels,
            'Allclasses' => $classes,
            'className' => $class->name,
            'Allschools' => $schools,
            'teachers' => $teachers,
            'promotionData' => $promotionData
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Classes $class)
    {
        $levels = Level::all(); // Fetch all levels for the dropdown
        $schools = School::all(); // Fetch all schools for the dropdown
        return Inertia::render('Classes/Edit', [
            'class' => $class,
            'levels' => $levels,
            'schools' => $schools,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Classes $class)
    {
        // Validate the request data
        $validatedData = $request->validate([
            'name' => 'required|string|max:255|unique:classes,name,' . $class->id,
            'level_id' => 'required|exists:levels,id',
            'school_id' => 'required|exists:schools,id',
            'number_of_students' => 'nullable|integer|min:0',
        ]);

        // Remove number_of_teachers from the data to update
        unset($validatedData['number_of_teachers']);

        // Update the class
        $class->update($validatedData);

        // Redirect to the classes index page with a success message
        return redirect()->route('classes.index')->with('success', 'Class updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Classes $class)
    {
        // Delete the class
        $class->delete();

        // Redirect to the classes index page with a success message
        return redirect()->route('classes.index')->with('success', 'Class deleted successfully.');
    }
    function removeStudent(Student $student){
        $student->delete();
       
    }
    
    /**
     * Update student and teacher counts for all classes.
     * This method can be called via a route to fix any discrepancies in counts.
     */
    public function fixAllClassCounts()
    {
        try {
            $classes = Classes::all();
            $updatedClasses = 0;
            
            foreach ($classes as $class) {
                $oldStudentCount = $class->number_of_students;
                $oldTeacherCount = $class->number_of_teachers;
                
                $class->updateCounts();
                
                // Check if counts were updated
                if ($oldStudentCount != $class->number_of_students || 
                    $oldTeacherCount != $class->number_of_teachers) {
                    $updatedClasses++;
                    
                    Log::info('Fixed class counts', [
                        'class_id' => $class->id,
                        'class_name' => $class->name,
                        'old_student_count' => $oldStudentCount,
                        'new_student_count' => $class->number_of_students,
                        'old_teacher_count' => $oldTeacherCount,
                        'new_teacher_count' => $class->number_of_teachers
                    ]);
                }
            }
            
            return redirect()->back()->with('success', "Fixed counts for {$updatedClasses} classes.");
        } catch (\Exception $e) {
            Log::error('Error fixing class counts', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return redirect()->back()->with('error', 'Failed to fix class counts: ' . $e->getMessage());
        }
    }
  
    /**
     * Return all classes as JSON (for filters, etc.)
     */
    public function listJson(Request $request)
    {
        $query = Classes::query();
        if ($request->has('school_id')) {
            $query->where('school_id', $request->school_id);
        }
        $classes = $query->get(['id', 'name']);
        return response()->json($classes);
    }
    
    /**
     * Get the count of students that a specific teacher teaches in a class
     */
    private function getTeacherStudentCount($class, $teacher)
    {
        // Get all students in the class
        $classStudents = $class->students()->where('status', 'active')->get();
        
        // Filter to only include students taught by this teacher
        $teacherStudents = $classStudents->filter(function ($student) use ($teacher) {
            $memberships = $student->memberships()->get();
            foreach ($memberships as $membership) {
                $teacherArr = is_array($membership->teachers)
                    ? $membership->teachers
                    : json_decode($membership->teachers, true);
                if (is_array($teacherArr)) {
                    foreach ($teacherArr as $t) {
                        if ((string)($t['teacherId'] ?? null) === (string)$teacher->id) {
                            return true; // Student is taught by this teacher
                        }
                    }
                }
            }
            return false; // Student is not taught by this teacher
        });
        
        Log::info('Debug: Teacher student count calculation', [
            'teacher_id' => $teacher->id,
            'class_id' => $class->id,
            'class_name' => $class->name,
            'total_students_in_class' => $classStudents->count(),
            'students_taught_by_teacher' => $teacherStudents->count()
        ]);
        
        return $teacherStudents->count();
    }
    
    /**
     * Get the students that a specific teacher teaches in a class
     */
    private function getTeacherStudentsInClass($class, $teacher)
    {
        // Get all students in the class
        $classStudents = $class->students()->where('status', 'active')->get();
        
        // Filter to only include students taught by this teacher
        $teacherStudents = $classStudents->filter(function ($student) use ($teacher) {
            $memberships = $student->memberships()->get();
            foreach ($memberships as $membership) {
                $teacherArr = is_array($membership->teachers)
                    ? $membership->teachers
                    : json_decode($membership->teachers, true);
                if (is_array($teacherArr)) {
                    foreach ($teacherArr as $t) {
                        if ((string)($t['teacherId'] ?? null) === (string)$teacher->id) {
                            return true; // Student is taught by this teacher
                        }
                    }
                }
            }
            return false; // Student is not taught by this teacher
        });
        
        Log::info('Debug: Teacher students in class', [
            'teacher_id' => $teacher->id,
            'class_id' => $class->id,
            'class_name' => $class->name,
            'total_students_in_class' => $classStudents->count(),
            'students_taught_by_teacher' => $teacherStudents->count(),
            'student_ids' => $teacherStudents->pluck('id')->toArray(),
            'return_type' => get_class($teacherStudents)
        ]);
        
        // Convert to array format that matches the DB query result
        // Get student IDs first
        $studentIds = $teacherStudents->pluck('id')->toArray();
        
        // Query the database directly to get the same format as admin path
        $result = DB::table('students')
            ->whereIn('id', $studentIds)
            ->where('classId', $class->id)
            ->get()
            ->toArray();
        
        // Ensure we always return an array
        return is_array($result) ? $result : [];
    }
}