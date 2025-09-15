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
        
        // Base query with level relationship
        $classesQuery = Classes::with('level');
        
        // If a school is selected in the session, filter by that school
        if ($selectedSchoolId) {
            $classesQuery->where('school_id', $selectedSchoolId);
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
        if ($role === 'teacher') {
            // Find the teacher using email
            $teacher = Teacher::where('email', $user->email)->first();
            
            if ($teacher) {
                // Filter to only get classes this teacher teaches at the selected school
                $teacherClassIds = $teacher->classes->pluck('id')->toArray();
                $classesQuery->whereIn('id', $teacherClassIds);
            } else {
                // If teacher record not found, return empty collection
                return Inertia::render('Menu/ClassesPage', [
                    'classes' => [],
                    'levels' => $levels,
                    'filters' => $request->only(['search', 'level', 'school']),
                ]);
            }
        }
        
        // Execute the query
        $classes = $classesQuery->get();
        
        // Update student and teacher counts for all classes
        $classes->each(function ($class) {
            $class->updateStudentCount();
            $class->updateTeacherCount();
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
        $students = DB::table('students')->where('classId', $class->id);
        $studentsList = $students->get();
        
        // Get student IDs for promotion data lookup
        $studentIds = $studentsList->pluck('id')->toArray();
        
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
        
        return Inertia::render('Menu/SingleClassPage', [
            'class' => $class->load('level'), 
            'students' => $studentsList,
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
}