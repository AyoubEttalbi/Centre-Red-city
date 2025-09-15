<?php

namespace App\Http\Controllers;

use App\Models\Teacher;
use App\Models\Classes;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class TeacherClassController extends Controller
{
    /**
     * Display a listing of teacher-class assignments.
     */
    public function index(Request $request)
    {
        // Ensure user is admin
        if (Auth::user()->role !== 'admin') {
            return redirect()->route('dashboard')->with('error', 'Access denied. This page is for admins only.');
        }
        
        $teachers = Teacher::with(['classes', 'schools', 'subjects'])->get();
        $classes = Classes::with(['level', 'school'])->get();
        
        return Inertia::render('TeacherClasses/Index', [
            'teachers' => $teachers,
            'classes' => $classes
        ]);
    }

    /**
     * Show the form for creating a new assignment.
     */
    public function create(Request $request)
    {
        // Ensure user is admin
        if (Auth::user()->role !== 'admin') {
            return redirect()->route('dashboard')->with('error', 'Access denied. This page is for admins only.');
        }
        
        $teachers = Teacher::with(['schools', 'subjects'])->get();
        $classes = Classes::with(['level', 'school'])->get();
        
        return Inertia::render('TeacherClasses/Create', [
            'teachers' => $teachers,
            'classes' => $classes
        ]);
    }

    /**
     * Store a newly created teacher-class assignment.
     */
    public function store(Request $request)
    {
        // Ensure user is admin
        if (Auth::user()->role !== 'admin') {
            return redirect()->route('dashboard')->with('error', 'Access denied. This action is for admins only.');
        }
        
        try {
            $validated = $request->validate([
                'teacher_id' => 'required|exists:teachers,id',
                'class_id' => 'required|exists:classes,id',
            ]);
            
            $teacher = Teacher::findOrFail($validated['teacher_id']);
            $class = Classes::findOrFail($validated['class_id']);
            
            // Check if the assignment already exists
            if ($teacher->classes()->where('classes.id', $class->id)->exists()) {
                return redirect()->back()->with('warning', 'This teacher is already assigned to this class.');
            }
            
            // Attach the class to the teacher
            $teacher->classes()->attach($class->id);
            
            // Update the class teacher count
            $class->updateTeacherCount();
            
            Log::info("Teacher {$teacher->id} ({$teacher->first_name} {$teacher->last_name}) assigned to class {$class->id} ({$class->name})");
            
            return redirect()->route('teacher-classes.index')->with('success', 'Teacher assigned to class successfully.');
        } catch (\Exception $e) {
            Log::error('Error assigning teacher to class: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to assign teacher to class: ' . $e->getMessage());
        }
    }

    /**
     * Bulk assign teachers to classes.
     */
    public function bulkAssign(Request $request)
    {
        // Ensure user is admin
        if (Auth::user()->role !== 'admin') {
            return redirect()->route('dashboard')->with('error', 'Access denied. This action is for admins only.');
        }
        
        try {
            $validated = $request->validate([
                'teacher_id' => 'required|exists:teachers,id',
                'class_ids' => 'required|array',
                'class_ids.*' => 'exists:classes,id',
            ]);
            
            $teacher = Teacher::findOrFail($validated['teacher_id']);
            
            // Attach multiple classes to the teacher
            $teacher->classes()->syncWithoutDetaching($validated['class_ids']);
            
            // Update the teacher counts for all affected classes
            foreach ($validated['class_ids'] as $classId) {
                $class = Classes::find($classId);
                if ($class) {
                    $class->updateTeacherCount();
                }
            }
            
            Log::info("Teacher {$teacher->id} ({$teacher->first_name} {$teacher->last_name}) assigned to multiple classes: " . implode(', ', $validated['class_ids']));
            
            return redirect()->route('teacher-classes.index')->with('success', 'Teacher assigned to multiple classes successfully.');
        } catch (\Exception $e) {
            Log::error('Error bulk assigning teacher to classes: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to assign teacher to classes: ' . $e->getMessage());
        }
    }

    /**
     * Remove a teacher from a class.
     */
    public function removeTeacherFromClass(Request $request, $teacher_id, $class_id)
    {
        // Check for admin access
        if (!auth()->user()->isAdmin) {
            if ($request->header('X-Inertia')) {
                return Inertia::location(route('dashboard'));
            }
            
            if ($request->ajax() || $request->wantsJson()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Not authorized'
                ], 403);
            }
            
            return redirect()->route('dashboard')->with('error', 'Not authorized');
        }

        // Initialize success message variable
        $successMsg = '';

        try {
            $teacher = Teacher::with(['classes', 'subjects'])->findOrFail($teacher_id);

            // Check if the teacher is assigned to the class
            $class = $teacher->classes->firstWhere('id', $class_id);

            if (!$class) {
                if ($request->header('X-Inertia')) {
                    return back()->with('error', 'Teacher not assigned to this class');
                }
                
                if ($request->ajax() || $request->wantsJson()) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Teacher not assigned to this class'
                    ], 404);
                }
                
                return redirect()->back()->with('error', 'Teacher not assigned to this class');
            }

            // Detach the class from the teacher
            $teacher->classes()->detach($class_id);

            // Update teacher count
            $this->updateTeacherCount($class_id);

            // Class is fetched again to get full details for the response
            $class = Classes::with(['level', 'school'])->findOrFail($class_id);

            $successMsg = "Teacher {$teacher->first_name} {$teacher->last_name} removed from class {$class->name}";

            Log::info("Admin " . auth()->user()->name . " removed teacher {$teacher->first_name} {$teacher->last_name} from class {$class->name}");
            
            // Get updated data for the response
            $teachers = Teacher::with(['classes', 'schools', 'subjects'])->get();
            $classes = Classes::with(['level', 'school'])->get();
            
        } catch (\Exception $e) {
            Log::error("Error removing teacher from class: " . $e->getMessage());
            
            if ($request->header('X-Inertia')) {
                return back()->with('error', 'Error removing teacher from class: ' . $e->getMessage());
            }
            
            if ($request->ajax() || $request->wantsJson()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Error removing teacher from class: ' . $e->getMessage()
                ], 500);
            }
            
            return redirect()->back()->with('error', 'Error removing teacher from class: ' . $e->getMessage());
        }

        // Check if this is an Inertia request first
        if ($request->header('X-Inertia')) {
            return back()->with('success', $successMsg);
        }
        
        // For other AJAX/JSON requests
        if ($request->ajax() || $request->wantsJson()) {
            return response()->json([
                'status' => 'success',
                'message' => $successMsg,
                'teacher' => $teacher,
                'teachers' => $teachers,
                'classes' => $classes
            ]);
        }

        // For regular requests, redirect back with a success message
        return redirect()->back()->with('success', $successMsg);
    }

    /**
     * Helper method to update teacher count for a class
     */
    private function updateTeacherCount($class_id)
    {
        $class = Classes::find($class_id);
        if ($class) {
            $class->updateTeacherCount();
        }
    }

    /**
     * Get all classes for a specific teacher.
     */
    public function getClassesByTeacher(Request $request, $teacherId)
    {
        // Ensure user is admin
        if (Auth::user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. This API is for admins only.'
            ], 403);
        }
        
        try {
            $teacher = Teacher::with(['classes.level', 'classes.school'])->findOrFail($teacherId);
            
            $classes = $teacher->classes->map(function($class) {
                return [
                    'id' => $class->id,
                    'name' => $class->name,
                    'level' => $class->level ? $class->level->name : null,
                    'school' => $class->school ? $class->school->name : null
                ];
            });
            
            return response()->json([
                'success' => true,
                'classes' => $classes
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting classes by teacher: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve classes for this teacher',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all teachers for a specific class.
     */
    public function getTeachersByClass(Request $request, $classId)
    {
        // Ensure user is admin
        if (Auth::user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. This API is for admins only.'
            ], 403);
        }
        
        try {
            $class = Classes::with(['teachers'])->findOrFail($classId);
            
            $teachers = $class->teachers->map(function($teacher) {
                return [
                    'id' => $teacher->id,
                    'name' => $teacher->first_name . ' ' . $teacher->last_name,
                    'email' => $teacher->email,
                    'subjects' => $teacher->subjects->pluck('name')
                ];
            });
            
            return response()->json([
                'success' => true,
                'teachers' => $teachers
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting teachers by class: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve teachers for this class',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
