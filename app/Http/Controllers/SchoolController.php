<?php

namespace App\Http\Controllers;

use App\Models\School;
use App\Models\Teacher;
use App\Models\Classes;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Attendance;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SchoolController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $schools = School::all();
        
        return Inertia::render('Menu/Othersettings', [
            'schools' => $schools
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Menu/CreateSchoolPage');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'phone_number' => 'required|string|max:20',
            'email' => 'required|email|unique:schools,email',
        ]);

        $school = School::create($validated);

        Log::info('School created', [
            'school_id' => $school->id,
            'school_name' => $school->name,
            'user_id' => auth()->id(),
        ]);

        return redirect()->back()->with('success', 'School created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(School $school)
    {
        // Get statistics for the school
        $statistics = $this->getSchoolStatistics($school);
        
        return Inertia::render('Menu/SingleSchoolPage', [
            'school' => $school,
            'statistics' => $statistics
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(School $school)
    {
        return Inertia::render('Menu/EditSchoolPage', [
            'school' => $school
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, School $school)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'phone_number' => 'required|string|max:20',
            'email' => 'required|email|unique:schools,email,' . $school->id,
        ]);

        $oldData = $school->toArray();
        $school->update($validated);

        // Log changes
        $changes = [];
        foreach ($validated as $key => $value) {
            if ($oldData[$key] !== $value) {
                $changes[$key] = [
                    'old' => $oldData[$key],
                    'new' => $value
                ];
            }
        }

        if (!empty($changes)) {
            Log::info('School updated', [
                'school_id' => $school->id,
                'changes' => $changes,
                'user_id' => auth()->id(),
            ]);
        }

        return redirect()->back()->with('success', 'School updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(School $school)
    {
        $schoolId = $school->id;
        $schoolName = $school->name;
        
        $school->delete();

        Log::info('School deleted', [
            'school_id' => $schoolId,
            'school_name' => $schoolName,
            'user_id' => auth()->id(),
        ]);

        return redirect()->back()->with('success', 'School deleted successfully.');
    }

    /**
     * Return all schools as JSON (for filters, etc.)
     */
    public function listJson()
    {
        return response()->json(School::all());
    }

    /**
     * Get statistics for a school
     */
    private function getSchoolStatistics(School $school)
    {
        // Get total counts
        $totalStudents = Student::where(DB::raw('"schoolId"'), $school->id)->count();
        
        // Use the many-to-many relationship instead of direct column query
        $totalTeachers = $school->teachers()->count();
        
        // Get assistants count
        $totalAssistants = $school->assistants()->count();
        
        // Get classes through teachers
        $teacherIds = $school->teachers()->pluck('id');
        $totalClasses = Classes::whereHas('teachers', function($query) use ($teacherIds) {
            $query->whereIn('teachers.id', $teacherIds);
        })->count();
        
        // Get subjects through teachers
        $activeCourses = Subject::whereHas('teachers', function($query) use ($teacherIds) {
            $query->whereIn('teachers.id', $teacherIds);
        })->count();

        // Get enrollment trend (last 6 months)
        $enrollmentTrend = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $count = Student::where(DB::raw('"schoolId"'), $school->id)
                ->whereRaw('MONTH(created_at) = ?', [$date->month])
                ->whereRaw('YEAR(created_at) = ?', [$date->year])
                ->count();
            
            $enrollmentTrend[] = [
                'month' => $date->format('M Y'),
                'count' => $count
            ];
        }

        // Get teacher distribution by subject
        $teacherDistribution = DB::table('teachers')
            ->join('subject_teacher', 'teachers.id', '=', 'subject_teacher.teacher_id')
            ->join('subjects', 'subject_teacher.subject_id', '=', 'subjects.id')
            ->join('school_teacher', 'teachers.id', '=', 'school_teacher.teacher_id')
            ->where('school_teacher.school_id', $school->id)
            ->select('subjects.name as subject', DB::raw('count(*) as count'))
            ->groupBy('subjects.name')
            ->get()
            ->map(function ($item) {
                return [
                    'subject' => $item->subject,
                    'count' => $item->count
                ];
            })
            ->toArray();

        // Get class size distribution
        $classSizeDistribution = DB::table('classes')
            ->join('classes_teacher', 'classes.id', '=', 'classes_teacher.classes_id')
            ->join('teachers', 'classes_teacher.teacher_id', '=', 'teachers.id')
            ->join('school_teacher', 'teachers.id', '=', 'school_teacher.teacher_id')
            ->where('school_teacher.school_id', $school->id)
            ->select('classes.id', DB::raw('classes.number_of_students as student_count'))
            ->get()
            ->map(function ($item) {
                $size = $item->student_count <= 10 ? 'Small (≤10)' : 
                       ($item->student_count <= 20 ? 'Medium (11-20)' : 'Large (>20)');
                return $size;
            })
            ->countBy()
            ->map(function ($count, $size) {
                return [
                    'size' => $size,
                    'count' => $count
                ];
            })
            ->values()
            ->toArray();

        // Get teachers list
        $teachers = $school->teachers()
            ->with(['subjects', 'classes'])
            ->get()
            ->map(function ($teacher) {
                return [
                    'id' => $teacher->id,
                    'name' => $teacher->first_name . ' ' . $teacher->last_name,
                    'subjects' => $teacher->subjects->pluck('name')->toArray(),
                    'classes' => $teacher->classes->count(),
                    'students' => $teacher->classes->sum(function ($class) {
                        return $class->students->count();
                    })
                ];
            })
            ->toArray();

        // Get classes list
        $classes = Classes::whereHas('teachers', function($query) use ($teacherIds) {
                $query->whereIn('teachers.id', $teacherIds);
            })
            ->with(['teachers', 'students', 'level'])
            ->get()
            ->map(function ($class) {
                return [
                    'id' => $class->id,
                    'name' => $class->name,
                    'level' => $class->level ? $class->level->name : 'N/A',
                    'teacher' => $class->teachers->first() ? $class->teachers->first()->first_name . ' ' . $class->teachers->first()->last_name : 'N/A',
                    'students' => $class->students->count(),
                    'schedule' => $class->schedule ?? 'N/A'
                ];
            })
            ->toArray();

        // Get students list with attendance and performance
        $students = Student::where(DB::raw('"schoolId"'), $school->id)
            ->with(['class', 'attendances'])
            ->get()
            ->map(function ($student) {
                // Calculate attendance percentage
                $totalAttendance = $student->attendances->count();
                $presentAttendance = $student->attendances->where('status', 'present')->count();
                $attendancePercentage = $totalAttendance > 0 ? round(($presentAttendance / $totalAttendance) * 100) : 0;

                // Mock performance data (in a real app, this would come from grades or assessments)
                $performancePercentage = rand(60, 100);

                return [
                    'id' => $student->id,
                    'name' => $student->firstName . ' ' . $student->lastName,
                    'class' => $student->class ? $student->class->name : 'N/A',
                    'attendance' => $attendancePercentage,
                    'performance' => $performancePercentage
                ];
            })
            ->toArray();

        // Get assistants list
        $assistants = $school->assistants()
            ->get()
            ->map(function ($assistant) {
                return [
                    'id' => $assistant->id,
                    'first_name' => $assistant->first_name,
                    'last_name' => $assistant->last_name,
                    'email' => $assistant->email,
                    'phone_number' => $assistant->phone_number,
                    'status' => $assistant->status ?? 'active'
                ];
            })
            ->toArray();

        return [
            'totalStudents' => $totalStudents,
            'totalTeachers' => $totalTeachers,
            'totalAssistants' => $totalAssistants,
            'totalClasses' => $totalClasses,
            'activeCourses' => $activeCourses,
            'enrollmentTrend' => $enrollmentTrend,
            'teacherDistribution' => $teacherDistribution,
            'classSizeDistribution' => $classSizeDistribution,
            'teachers' => $teachers,
            'classes' => $classes,
            'students' => $students,
            'assistants' => $assistants
        ];
    }
}
