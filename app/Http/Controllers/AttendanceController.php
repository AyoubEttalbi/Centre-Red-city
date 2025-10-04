<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Attendance;
use App\Models\Classes;
use App\Models\Level;
use App\Models\Assistant;
use Illuminate\Support\Facades\Log;
use App\Models\Student;
use App\Models\School;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Spatie\Activitylog\Models\Activity;
use Carbon\Carbon;
use WasenderApi\Facades\WasenderApi;
use App\Jobs\SendWhatsAppNotification;

class AttendanceController extends Controller
{
    public function index(Request $request)
        
    {
        // Get parameters from request
        $date = $request->input('date', now()->format('Y-m-d'));
        $classId = $request->input('class_id');
        $teacherId = $request->input('teacher_id');
        $search = $request->input('search');
        
        // Get the selected school from session
        $selectedSchoolId = session('school_id');
        
        // Get teachers with classes (filtered by school if applicable)
        $teachersQuery = Teacher::with('classes');
        
        if ($selectedSchoolId) {
            $teachersQuery->whereHas('schools', function($query) use ($selectedSchoolId) {
                $query->where('schools.id', $selectedSchoolId);
            });
            
            // Log the filtering
            Log::info('Attendance filtered by school', [
                'school_id' => $selectedSchoolId,
                'user_role' => $request->user()->role
            ]);
        }
        
        // If user is a teacher, only show their own record
        if ($request->user()->role === 'teacher') {
            $teachersQuery->where('email', $request->user()->email);
        }
        
        $teachers = $teachersQuery->get();

        // Get classes for selected teacher (filtered by school if applicable)
        $classesQuery = Classes::query();
        
        if ($selectedSchoolId) {
            $classesQuery->where('school_id', $selectedSchoolId);
        }
        
        // For teachers, show only their classes
        if ($request->user()->role === 'teacher') {
            $teacher = Teacher::where('email', $request->user()->email)->first();
            if ($teacher) {
                $classesQuery->whereHas('teachers', fn($q) => $q->where('teacher_id', $teacher->id));
            }
        } elseif ($teacherId) {
            // For admins/assistants, use the teacher_id from request
            $classesQuery->whereHas('teachers', fn($q) => $q->where('teacher_id', $teacherId));
        }
        
        $classes = $classesQuery->get();

        // Get students for selected class (with search filter)
        $studentsQuery = Student::with('class')->where('status', 'active');
        
        if ($selectedSchoolId) {
            $studentsQuery->where('schoolId', $selectedSchoolId);
            Log::debug('Filtering students by school ID', ['schoolId' => $selectedSchoolId]);
        }
        
        if ($classId) {
            $studentsQuery->where('classId', $classId);
            Log::debug('Filtering students by class ID', ['classId' => $classId]);
            
            if ($search) {
                $studentsQuery->where(function ($query) use ($search) {
                    $query->where('firstName', 'like', "%{$search}%")
                        ->orWhere('lastName', 'like', "%{$search}%");
                });
                Log::debug('Filtering students by search', ['search' => $search]);
            }
            
            $students = $studentsQuery->get();
            Log::debug('Students found', ['count' => $students->count()]);
        } else {
            $students = collect();
            Log::debug('No class ID provided, returning empty student collection');
        }

        // Merge students with attendance status and class info
        $currentTeacherId = null;
        if ($request->user()->role === 'teacher') {
            // For teachers, get their ID from the teacher record
            $teacher = Teacher::where('email', $request->user()->email)->first();
            $currentTeacherId = $teacher ? $teacher->id : null;
            
            // Verify that the teacher_id from request matches the logged-in teacher
            $requestedTeacherId = $request->input('teacher_id');
            if ($requestedTeacherId && $requestedTeacherId != $currentTeacherId) {
                Log::warning('Teacher ID mismatch', [
                    'logged_in_teacher_id' => $currentTeacherId,
                    'requested_teacher_id' => $requestedTeacherId,
                    'user_email' => $request->user()->email
                ]);
                // Use the logged-in teacher's ID for security
                $currentTeacherId = $teacher ? $teacher->id : null;
            }
            
            Log::info('Teacher login attendance access', [
                'user_email' => $request->user()->email,
                'teacher_found' => (bool)$teacher,
                'teacher_id' => $currentTeacherId,
                'requested_teacher_id' => $requestedTeacherId,
                'class_id' => $classId
            ]);
        } else {
            // For admins/assistants, use the teacher_id from request
            $currentTeacherId = $request->input('teacher_id');
        }

        // Get existing attendance for selected date and class
        $existingAttendances = $classId
            ? Attendance::with('class')
                ->where('classId', $classId)
                ->whereDate('date', $date)
                ->when($currentTeacherId, function($query) use ($currentTeacherId) {
                    return $query->where('teacher_id', $currentTeacherId);
                })
                ->get()
                ->groupBy(function($att) {
                    return $att->student_id . '|' . $att->teacher_id . '|' . $att->subject;
                })
            : collect();

        $selectedSubject = $request->input('subject');

        // Debug: Log all attendance keys available for this request (after $existingAttendances is defined)
        if (config('app.debug')) {
            $attendanceKeys = $existingAttendances->keys();
            Log::info('Attendance lookup debug', [
                'teacher_id' => $currentTeacherId,
                'subject' => $selectedSubject,
                'attendance_keys' => $attendanceKeys,
            ]);
        }

        // Filter students to only include those taught by the current teacher
        $filteredStudents = $students->filter(function ($student) use ($currentTeacherId) {
            if (!$currentTeacherId) {
                Log::debug('No current teacher ID, skipping student', [
                    'student_id' => $student->id,
                    'student_name' => $student->firstName . ' ' . $student->lastName
                ]);
                return false;
            }
            
            // Include all memberships regardless of membership active status; rely on student status instead
            $memberships = $student->memberships()->get();
            Log::debug('Checking student memberships', [
                'student_id' => $student->id,
                'student_name' => $student->firstName . ' ' . $student->lastName,
                'memberships_count' => $memberships->count(),
                'teacher_id' => $currentTeacherId
            ]);
            
            foreach ($memberships as $membership) {
                $teacherArr = is_array($membership->teachers)
                    ? $membership->teachers
                    : json_decode($membership->teachers, true);
                if (is_array($teacherArr)) {
                    foreach ($teacherArr as $t) {
                        if ((string)($t['teacherId'] ?? null) === (string)$currentTeacherId) {
                            Log::debug('Student is taught by teacher', [
                                'student_id' => $student->id,
                                'student_name' => $student->firstName . ' ' . $student->lastName,
                                'teacher_id' => $currentTeacherId,
                                'membership_id' => $membership->id,
                                'teacher_data' => $t
                            ]);
                            return true; // Student is taught by this teacher
                        }
                    }
                }
            }
            Log::debug('Student is NOT taught by teacher', [
                'student_id' => $student->id,
                'student_name' => $student->firstName . ' ' . $student->lastName,
                'teacher_id' => $currentTeacherId,
                'memberships_data' => $memberships->map(function($m) {
                    return [
                        'id' => $m->id,
                        'teachers' => $m->teachers
                    ];
                })
            ]);
            return false; // Student is not taught by this teacher
        });

        Log::info('Student filtering results', [
            'total_students_in_class' => $students->count(),
            'filtered_students_by_teacher' => $filteredStudents->count(),
            'teacher_id' => $currentTeacherId,
            'class_id' => $classId,
            'user_role' => $request->user()->role,
            'user_email' => $request->user()->email
        ]);

        $studentsWithAttendance = $filteredStudents->map(function ($student) use ($existingAttendances, $date, $currentTeacherId, $selectedSubject) {
            // Debug: Log the attendance key being looked up for each student
            $attendanceKey = $student->id . '|' . $currentTeacherId . '|' . $selectedSubject;
            if (config('app.debug')) {
                Log::info('Attendance lookup for student', [
                    'student_id' => $student->id,
                    'attendance_key' => $attendanceKey,
                    'selected_subject' => $selectedSubject,
                ]);
            }
            
            // Try to find attendance for this specific teacher and subject
            $attendance = null;
            if ($selectedSubject) {
                $attendanceList = $existingAttendances[$attendanceKey] ?? collect();
                $attendance = $attendanceList->first();
            } else {
                // If no subject selected, find any attendance for this student/teacher combination
                $attendance = $existingAttendances->filter(function($attendanceList) use ($student, $currentTeacherId) {
                    return $attendanceList->first() && 
                           $attendanceList->first()->student_id == $student->id && 
                           $attendanceList->first()->teacher_id == $currentTeacherId;
                })->first()?->first();
            }
            $recordedByName = null;
            if ($attendance && $attendance->recorded_by) {
                $user = \App\Models\User::find($attendance->recorded_by);
                $recordedByName = $user ? $user->name : null;
            }
            // Get all subjects for this student/teacher
            $memberships = $student->memberships()->get();
            $subjects = collect();
            foreach ($memberships as $membership) {
                $teacherArr = is_array($membership->teachers)
                    ? $membership->teachers
                    : json_decode($membership->teachers, true);
                if (is_array($teacherArr)) {
                    foreach ($teacherArr as $t) {
                        if ((string)($t['teacherId'] ?? null) === (string)$currentTeacherId && !empty($t['subject'])) {
                            $subjects->push($t['subject']);
                        }
                    }
                }
            }
            $subjects = $subjects->unique()->values()->all();
            
            // Debug logging for attendance status
            if (config('app.debug')) {
                Log::info('Student attendance data', [
                    'student_id' => $student->id,
                    'student_name' => $student->firstName . ' ' . $student->lastName,
                    'attendance_found' => (bool)$attendance,
                    'attendance_status' => $attendance ? $attendance->status : 'none',
                    'attendance_reason' => $attendance?->reason,
                    'final_status' => $attendance ? $attendance->status : 'present',
                ]);
            }
            
            return [
                'id' => $attendance ? $attendance->id : null,
                'student_id' => $student->id,
                'firstName' => $student->firstName,
                'lastName' => $student->lastName,
                'status' => $attendance ? $attendance->status : 'present',
                'reason' => $attendance?->reason,
                'date' => $date,
                'classId' => $student->classId,
                'class' => $student->class,
                'exists_in_db' => (bool)$attendance,
                'recorded_by_name' => $recordedByName,
                'subjects' => $subjects,
                'teacher_id' => $currentTeacherId, // Add teacher_id to student data
            ];
        })->values();

        // Fetch assistants and levels data
        $assistants = Assistant::with('schools')->get();
        $levels = Level::all();

        // Collect all subjects for the selected class and teacher, regardless of filter
        $allSubjects = collect();
        if ($classId && $teacherId) {
            $classStudents = Student::where('classId', $classId)->where('status', 'active')->get();
            foreach ($classStudents as $student) {
                $memberships = $student->memberships()->get();
                foreach ($memberships as $membership) {
                    $teacherArr = is_array($membership->teachers)
                        ? $membership->teachers
                        : json_decode($membership->teachers, true);
                    if (is_array($teacherArr)) {
                        foreach ($teacherArr as $t) {
                            if ((string)($t['teacherId'] ?? null) === (string)$teacherId && !empty($t['subject'])) {
                                $allSubjects->push($t['subject']);
                            }
                        }
                    }
                }
            }
            $allSubjects = $allSubjects->unique()->values()->all();
        }

        return Inertia::render('Menu/AttendancePage', [
            'teachers' => $teachers->map(fn($teacher) => [
                'id' => $teacher->id, 
                'name' => $teacher->first_name . ' ' . $teacher->last_name,
                'first_name' => $teacher->first_name,
                'last_name' => $teacher->last_name,
                'email' => $teacher->email,
                'schools' => $teacher->schools,
                'classes' => $teacher->classes
            ]),
            'classes' => $classes->map(fn($class) => [
                'id' => $class->id, 
                'name' => $class->name,
                'level_id' => $class->level_id,
                'school_id' => $class->school_id
            ]),
            'students' => $studentsWithAttendance,
            'allSubjects' => $allSubjects,
            'filters' => [
                'date' => $date,
                'teacher_id' => $teacherId,
                'class_id' => $classId,
                'search' => $search,
                'subject' => $selectedSubject,
            ],
            'selectedSchool' => $selectedSchoolId ? [
                'id' => $selectedSchoolId,
                'name' => session('school_name')
            ] : null,
            'assistants' => $assistants->map(fn($assistant) => [
                'id' => $assistant->id,
                'first_name' => $assistant->first_name,
                'last_name' => $assistant->last_name,
                'email' => $assistant->email,
                'schools' => $assistant->schools
            ]),
            'levels' => $levels,
            'schools' => School::all()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'attendances' => 'required|array|min:1',
            'attendances.*.student_id' => 'required|exists:students,id',
            'attendances.*.status' => 'required|in:present,absent,late',
            'attendances.*.reason' => 'nullable|string|max:255',
            'attendances.*.subject' => 'required|string|max:255',
            'date' => 'required|date',
            'class_id' => 'required|exists:classes,id',
            'teacher_id' => 'required|exists:teachers,id',
        ]);

        try {
            DB::beginTransaction();

            // Process ALL attendance records, including present ones
            $processedStudentIds = [];

            // Always get teacher_id from validated or request
            $teacherId = $validated['teacher_id'] ?? $request->input('teacher_id');

            foreach ($validated['attendances'] as $attendance) {
                $studentId = $attendance['student_id'];
                $processedStudentIds[] = $studentId;

                $subjectName = $attendance['subject'] ?? null;
                $teacherIdForRecord = $attendance['teacher_id'] ?? $teacherId;

                // If subject is missing, try to get the only available subject for this student/teacher/class
                if (empty($subjectName)) {
                    $student = \App\Models\Student::find($studentId);
                    $memberships = $student ? $student->memberships()->where('is_active', 1)->get() : collect();
                    $subjects = collect();
                    foreach ($memberships as $membership) {
                        $teacherArr = is_array($membership->teachers)
                            ? $membership->teachers
                            : json_decode($membership->teachers, true);
                        if (is_array($teacherArr)) {
                            foreach ($teacherArr as $t) {
                                if ((string)($t['teacherId'] ?? null) === (string)$teacherIdForRecord && !empty($t['subject'])) {
                                    $subjects->push($t['subject']);
                                }
                            }
                        }
                    }
                    $subjects = $subjects->unique()->values();
                    if ($subjects->count() === 1) {
                        $subjectName = $subjects->first();
                    }
                }

                // Fetch attendance for this student, teacher, subject, class, and date
                $attendanceModel = Attendance::where('student_id', $studentId)
                    ->where('date', $validated['date'])
                    ->where('classId', $validated['class_id'])
                    ->where('teacher_id', $teacherIdForRecord)
                    ->where('subject', $subjectName)
                    ->first();

                if ($attendance['status'] === 'present') {
                    // If status is present and a record exists, delete it
                    if ($attendanceModel) {
                        $attendanceModel->delete();
                        Log::info('Deleted attendance record (marked as present)', [
                            'student_id' => $studentId,
                            'teacher_id' => $teacherIdForRecord,
                            'subject' => $subjectName
                        ]);
                    }
                    // Do not create a record for present
                    continue;
                }

                // Only absent or late are recorded
                if ($attendanceModel) {
                    $attendanceModel->update([
                        'status' => $attendance['status'],
                        'reason' => $attendance['reason'],
                        'recorded_by' => Auth::id(),
                        'teacher_id' => $teacherIdForRecord,
                        'subject' => $subjectName,
                    ]);
                    Log::info('Updated existing attendance record', [
                        'student_id' => $studentId,
                        'status' => $attendance['status'],
                        'teacher_id' => $teacherIdForRecord,
                        'subject' => $subjectName
                    ]);
                } else {
                    Attendance::create([
                        'student_id' => $studentId,
                        'date' => $validated['date'],
                        'classId' => $validated['class_id'],
                        'status' => $attendance['status'],
                        'reason' => $attendance['reason'],
                        'recorded_by' => Auth::id(),
                        'teacher_id' => $teacherIdForRecord,
                        'subject' => $subjectName,
                    ]);
                    Log::info('Created new attendance record', [
                        'student_id' => $studentId,
                        'status' => $attendance['status'],
                        'teacher_id' => $teacherIdForRecord,
                        'subject' => $subjectName
                    ]);
                }

                if ($attendance['status'] === 'absent') {
                    // Queue WhatsApp notifications instead of sending immediately
                    $student = Student::find($studentId);
                    if ($student && !empty($student->guardianNumber)) {
                        $studentName = trim($student->firstName . ' ' . $student->lastName);
                        $subject = $subjectName ?: 'غير محدد';
                        $date = Carbon::parse($validated['date'])->locale('ar')->isoFormat('dddd، D MMMM YYYY');
                        
                        // Get teacher information
                        $teacher = Teacher::find($teacherIdForRecord);
                        $teacherName = $teacher ? $teacher->first_name . ' ' . $teacher->last_name : 'غير محدد';
                        
                        // Get class information
                        $class = Classes::find($validated['class_id']);
                        $className = $class ? $class->name : 'غير محدد';
                        
                        // Get school information
                        $school = $student->school;
                        $schoolName = 'Centre Red city'; // Always use Centre Red city as general name
                        $schoolPhone = $school ? $school->phone_number : '05XX-XXX-XXX';
                        $schoolEmail = $school ? $school->email : 'info@centreredcity.com';
                        
                        // Get attendance statistics for current school year (August to August)
                        $currentYear = now()->year;
                        $schoolYearStart = Carbon::create($currentYear, 8, 1); // August 1st
                        $schoolYearEnd = Carbon::create($currentYear + 1, 7, 31); // July 31st next year
                        
                        // If we're before August, use previous school year
                        if (now()->month < 8) {
                            $schoolYearStart = Carbon::create($currentYear - 1, 8, 1);
                            $schoolYearEnd = Carbon::create($currentYear, 7, 31);
                        }
                        
                        // Count attendance records for the school year
                        $absentCount = $student->attendances()
                            ->whereBetween('date', [$schoolYearStart, $schoolYearEnd])
                            ->where('status', 'absent')
                            ->count();
                        $lateCount = $student->attendances()
                            ->whereBetween('date', [$schoolYearStart, $schoolYearEnd])
                            ->where('status', 'late')
                            ->count();
                        
                        // Calculate total days from school year start to today (or end of school year)
                        $endDate = now() > $schoolYearEnd ? $schoolYearEnd : now();
                        $totalDays = $schoolYearStart->diffInDays($endDate) + 1;
                        
                        // Calculate attendance rate: (total days - absent - late) / total days * 100
                        $presentDays = $totalDays - $absentCount - $lateCount;
                        $attendanceRate = $totalDays > 0 ? round(($presentDays / $totalDays) * 100) : 100;
                        
                        // Ensure attendance rate is not negative
                        $attendanceRate = max(0, $attendanceRate);
                        
                        // Determine gender-based pronouns
                        $genderPronoun = 'ابنكم'; // Default to male
                        $verb = 'تغيب';
                        
                        // You can add logic here to determine gender if you have a gender field
                        // For now, we'll use a simple approach or you can modify based on your needs
                        
                        // NEW ENHANCED PROFESSIONAL MESSAGE WITH IMPROVED UX
                        $message = "🏫 *{$schoolName}* 🌟

السلام عليكم ورحمة الله وبركاته،

📋 *تنبيه غياب الطالب*
نخبركم أن {$genderPronoun} *{$studentName}* قد {$verb} عن حصة *{$subject}* التي جرت يوم *{$date}* بمركز {$schoolName}.

👨‍🏫 *المعلم:* {$teacherName}
📅 *الفصل:* {$className}
📊 *معدل الحضور لهذا العام:* {$attendanceRate}%

📞 *للاستفسار والتواصل:*
📱 {$schoolPhone}
Ig: https://www.instagram.com/centreredcity?igsh=MXg1NjJwam80eTNoMw%3D%3D&utm_source=qr

🕐 
ساعات العمل:*من 10:00 إلى 13:00
ومن 16:30 الى *22:30*

نرجو منكم التفضل بالتواصل معنا لتوضيح سبب الغياب، حتى نتمكن من متابعة مستواه وضمان استفادته الكاملة من الدروس.

شكراً لتعاونكم 🌷
*إدارة {$schoolName}*";
                                                
                        // OLD SIMPLE MESSAGE (COMMENTED FOR EASY ROLLBACK)
                        /*
                        $message = "السلام عليكم ورحمة الله وبركاته،\n\nنخبركم أن {$genderPronoun} {$studentName} قد {$verb} عن حصة {$subject} التي جرت يوم {$date} بمركز Centre Red city.\n\nنرجو منكم التفضل بالتواصل معنا لتوضيح سبب الغياب، حتى نتمكن من متابعة مستواه وضمان استفادته الكاملة من الدروس.\n\nشكراً لتعاونكم 🌷\nإدارة Centre Red city";
                        */
                        
                        // Queue job on dedicated WhatsApp queue
                        $job = (new SendWhatsAppNotification(
                            $student->guardianNumber,
                            $message,
                            $studentId
                        ))->onQueue('whatsapp');
                        dispatch($job);
                        // Optionally, you can log the queueing event
                        Log::info('WhatsApp notification queued', [
                            'student_id' => $studentId,
                            'phone' => $student->guardianNumber,
                            'queued_at' => now()->toDateTimeString()
                        ]);
                    } else {
                        Log::warning('No guardian phone number for student', [
                            'student_id' => $studentId
                        ]);
                    }
                }
            }

            // Remove the problematic line that deletes present records
            // Attendance::where('classId', $validated['class_id'])
            //     ->whereDate('date', $validated['date'])
            //     ->where('status', 'present')
            //     ->delete();

            DB::commit();

            Log::info('Attendance saved', [
                'class_id' => $validated['class_id'],
                'date' => $validated['date'],
                'student_count' => count($validated['attendances']),
                'processed_student_ids' => $processedStudentIds
            ]);

            $studentCount = Student::where('classId', $validated['class_id'])->count();
            Log::info('Found students for this class', [
                'class_id' => $validated['class_id'],
                'student_count' => $studentCount
            ]);

            // Redirect with explicit parameters to ensure data is properly loaded
            return redirect()->route('attendances.index', [
                'date' => $validated['date'],
                'class_id' => $validated['class_id'],
                'teacher_id' => $teacherId,
                '_timestamp' => time()
            ])->with('success', 'Attendance saved successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error saving attendance', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return redirect()->back()->with('error', 'Error saving attendance: ' . $e->getMessage());
        }
    }

    public function show($id)
    {
        try {
            // Fetch the specific attendance record
            $attendance = Attendance::with(['student', 'class', 'recordedBy'])
                ->findOrFail($id);
    
            // Fetch all attendance records for the student
            $studentAttendances = Attendance::with(['class', 'recordedBy'])
                ->where('student_id', $attendance->student_id)
                ->latest()
                ->paginate(10);
    
            // Make sure we're returning the properly structured data
            return Inertia::render('Menu/SingleRecord', [
                'attendance' => [
                    'id' => $attendance->id,
                    'student' => [
                        'id' => $attendance->student->id,
                        'firstName' => $attendance->student->firstName,
                        'lastName' => $attendance->student->lastName,
                    ],
                    'class' => [
                        'id' => $attendance->class->id,
                        'name' => $attendance->class->name,
                    ],
                    'status' => $attendance->status,
                    'reason' => $attendance->reason,
                    'date' => $attendance->date,
                    'recordedBy' => $attendance->recordedBy ? [
                        'id' => $attendance->recordedBy->id,
                        'name' => $attendance->recordedBy->name,
                        'role' => $attendance->recordedBy->role,
                    ] : null,
                ],
                'studentAttendances' => $studentAttendances,
            ]);
        } catch (\Exception $e) {
            // Log the error
            Log::error('Error showing attendance record', [
                'id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // Redirect with error message
            return redirect()->route('attendances.index')->with('error', 'Error viewing attendance record: ' . $e->getMessage());
        }
    }


    public function update(Request $request, $id)
    {
        // Validate the request data
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'status' => 'required|in:present,absent,late',
            'reason' => 'nullable|string|max:255',
            'date' => 'required|date',
            'class_id' => 'required|exists:classes,id',
            'teacher_id' => 'nullable|exists:teachers,id',
            'subject' => 'nullable|string|max:255',
        ]);
    
        try {
            // Find the attendance record
            $attendance = Attendance::findOrFail($id);
    
            // Capture old data before update
            $oldData = $attendance->toArray();
    
            // If status is "present", delete the record
            if ($validated['status'] === 'present') {
                $attendance->delete();
                $this->logActivity('deleted', $attendance, $oldData, null);
                return redirect()->back()->with('success', 'Attendance record removed (marked as present)');
            }
    
            // Update the record for "absent" or "late"
            $attendance->update([
                'student_id' => $validated['student_id'],
                'classId' => $validated['class_id'],
                'status' => $validated['status'],
                'reason' => $validated['status'] !== 'present' ? $validated['reason'] : null,
                'date' => $validated['date'],
                'recorded_by' => Auth::id(),
                'teacher_id' => $validated['teacher_id'] ?? $attendance->teacher_id,
                'subject' => $validated['subject'] ?? $attendance->subject,
            ]);
    
            // Log the activity for the updated record
            $this->logActivity('updated', $attendance, $oldData, $attendance->toArray());
    
            return redirect()->back()->with('success', 'Attendance record updated successfully');
        } catch (\Exception $e) {
            // Log the error for debugging
            Log::error('Error updating attendance record:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
    
            return redirect()->back()->with('error', 'Failed to update attendance record: ' . $e->getMessage());
        }
    }

    public function destroy($id)
    {
        try {
            // Find the attendance record
            $attendance = Attendance::findOrFail($id);

            // Log the activity before deletion
            $this->logActivity('deleted', $attendance, $attendance->toArray(), null);

            // Delete the record
            $attendance->delete();

            return redirect()->back()->with('success', 'Attendance record deleted successfully');
        } catch (\Exception $e) {
            // Log the error for debugging
            Log::error('Error deleting attendance record:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return redirect()->back()->with('error', 'Failed to delete attendance record: ' . $e->getMessage());
        }
    }

    /**
     * Log activity for a model.
     */
    protected function logActivity($action, $model, $oldData = null, $newData = null)
{
    $description = ucfirst($action) . ' ' . class_basename($model) . ' (' . $model->id . ')';
    $tableName = $model->getTable();

    $properties = [
        'TargetName' => $model->student->firstName . ' ' . $model->student->lastName,
        'action' => $action,
        'table' => $tableName,
        'user' => Auth::user()->name,
    ];

    if ($action === 'updated' && $oldData && $newData) {
        $changedFields = [];
        foreach ($newData as $key => $value) {
            if ($oldData[$key] !== $value) {
                $changedFields[$key] = [
                    'old' => $oldData[$key],
                    'new' => $value,
                ];
            }
        }
        $properties['changed_fields'] = $changedFields;
    }

    if ($action === 'deleted') {
        $properties['deleted_data'] = [
            'student_id' => $oldData['student_id'],
            'classId' => $oldData['classId'],
            'status' => $oldData['status'],
            'date' => $oldData['date'],
        ];
    }

    activity()
        ->causedBy(Auth::user())
        ->performedOn($model)
        ->withProperties($properties)
        ->log($description);
}

    public function getStats(Request $request)
    {
        // Default to last 7 days instead of last month
        $endDate = $request->input('end_date') ?? now()->toDateString();
        $startDate = $request->input('start_date') ?? now()->subDays(6)->toDateString();
        $schoolId = $request->input('school_id');

        // Ensure we get exactly 7 days of data
        $start = Carbon::parse($startDate);
        $end = Carbon::parse($endDate);
        
        // If no specific dates provided, default to last 7 days
        if (!$request->has('start_date') && !$request->has('end_date')) {
            $end = Carbon::now();
            $start = $end->copy()->subDays(6);
        }

        // Query attendance, join classes for school filter
        $query = DB::table('attendances')
            ->join('classes', 'attendances.classId', '=', 'classes.id')
            ->select(
                DB::raw('DATE(attendances.date) as date'),
                'attendances.status',
                DB::raw('COUNT(*) as count')
            )
            ->whereBetween('attendances.date', [$start, $end]);
        if ($schoolId && $schoolId !== 'all') {
            $query->where('classes.school_id', $schoolId);
        }
        $rows = $query->groupBy('date', 'attendances.status')->orderBy('date')->get();

        // Generate all dates in the range (last 7 days)
        $dates = collect();
        $currentDate = $start->copy();
        while ($currentDate <= $end) {
            $dates->push($currentDate->format('Y-m-d'));
            $currentDate->addDay();
        }

        // Pivot to chart-friendly format with all dates included
        $result = $dates->map(function($date) use ($rows) {
            $statuses = ['present' => 0, 'absent' => 0, 'late' => 0];
            foreach ($rows->where('date', $date) as $row) {
                $statuses[$row->status] = $row->count;
            }
            return array_merge(['date' => $date], $statuses);
        });

        return response()->json($result);
    }

    /**
     * Show the Absence Log page (admin/assistant only)
     */
    public function absenceLogPage(Request $request)
    {
        $user = $request->user();
        if (!in_array($user->role, ['admin', 'assistant'])) {
            abort(403);
        }
        return Inertia::render('Menu/AbsenceLog');
    }

    /**
     * Return paginated absences/lates, filterable by date/range (admin/assistant only)
     */
    public function absenceLogData(Request $request)
    {
        $user = $request->user();
        if (!in_array($user->role, ['admin', 'assistant'])) {
            return response()->json(['error' => 'Forbidden'], 403);
        }
        $query = Attendance::with(['student', 'class', 'recordedBy', 'teacher'])
            ->whereIn('status', ['absent', 'late']);

        // Date filtering: always filter by date, default to today if not provided
        $date = $request->input('date', now()->toDateString());
        $query->whereDate('date', $date);

        // Optional: class or student filter
        if ($request->filled('class_id')) {
            $query->where('classId', $request->input('class_id'));
        }
        if ($request->filled('student_id')) {
            $query->where('student_id', $request->input('student_id'));
        }

        $perPage = $request->input('per_page', 20);
        $absences = $query->orderByDesc('date')->paginate($perPage);

        // Format for frontend
        $data = $absences->through(function($attendance) {
            return [
                'id' => $attendance->id,
                'student_id' => $attendance->student ? $attendance->student->id : $attendance->student_id,
                'student_name' => $attendance->student ? $attendance->student->firstName . ' ' . $attendance->student->lastName : 'Unknown',
                'class_id' => $attendance->class ? $attendance->class->id : null,
                'class_name' => $attendance->class ? $attendance->class->name : 'Unknown',
                'teacher_id' => $attendance->teacher ? $attendance->teacher->id : null,
                'teacher_name' => $attendance->teacher ? $attendance->teacher->first_name . ' ' . $attendance->teacher->last_name : '-',
                'subject' => $attendance->subject ?: '-',
                'date' => $attendance->date,
                'status' => $attendance->status,
                'reason' => $attendance->reason,
                'recorded_by_name' => $attendance->recordedBy ? $attendance->recordedBy->name : '-',
            ];
        });



        return response()->json([
            'data' => $data,
            'current_page' => $absences->currentPage(),
            'last_page' => $absences->lastPage(),
            'per_page' => $absences->perPage(),
            'total' => $absences->total(),
        ]);
    }

    public function notifyParent($studentId, Request $request = null)
    {
        $student = Student::findOrFail($studentId);
        // Use guardianNumber as the parent's phone number
        $fatherPhone = $student->guardianNumber;
        if (empty($fatherPhone)) {
            return back()->with('error', "Le numéro de téléphone du tuteur n'est pas renseigné.");
        }
        $studentName = trim($student->firstName . ' ' . $student->lastName);
        $date = now()->locale('ar')->isoFormat('dddd، D MMMM YYYY');
        
        // Get subject from request or try to find it from today's attendance
        $subject = 'غير محدد'; // Default subject
        $teacherName = 'غير محدد';
        $className = 'غير محدد';
        
        if ($request && $request->has('subject')) {
            $subject = $request->input('subject');
        } else {
            // Try to find the subject from today's attendance record
            $todayAttendance = Attendance::where('student_id', $studentId)
                ->whereDate('date', now()->toDateString())
                ->where('status', 'absent')
                ->with(['teacher', 'class'])
                ->first();
            
            if ($todayAttendance) {
                if (!empty($todayAttendance->subject)) {
                    $subject = $todayAttendance->subject;
                }
                if ($todayAttendance->teacher) {
                    $teacherName = $todayAttendance->teacher->first_name . ' ' . $todayAttendance->teacher->last_name;
                }
                if ($todayAttendance->class) {
                    $className = $todayAttendance->class->name;
                }
            }
        }
        
        // Get school information
        $school = $student->school;
    $schoolName = 'Centre Red city'; // Always use Centre Red city as general name
        $schoolPhone = $school ? $school->phone_number : '05XX-XXX-XXX';
    $schoolEmail = $school ? $school->email : 'info@centreredcity.com';
        
        // Get attendance statistics for current school year (August to August)
        $currentYear = now()->year;
        $schoolYearStart = Carbon::create($currentYear, 8, 1); // August 1st
        $schoolYearEnd = Carbon::create($currentYear + 1, 7, 31); // July 31st next year
        
        // If we're before August, use previous school year
        if (now()->month < 8) {
            $schoolYearStart = Carbon::create($currentYear - 1, 8, 1);
            $schoolYearEnd = Carbon::create($currentYear, 7, 31);
        }
        
        // Count attendance records for the school year
        $absentCount = $student->attendances()
            ->whereBetween('date', [$schoolYearStart, $schoolYearEnd])
            ->where('status', 'absent')
            ->count();
        $lateCount = $student->attendances()
            ->whereBetween('date', [$schoolYearStart, $schoolYearEnd])
            ->where('status', 'late')
            ->count();
        
        // Calculate total days from school year start to today (or end of school year)
        $endDate = now() > $schoolYearEnd ? $schoolYearEnd : now();
        $totalDays = $schoolYearStart->diffInDays($endDate) + 1;
        
        // Calculate attendance rate: (total days - absent - late) / total days * 100
        $presentDays = $totalDays - $absentCount - $lateCount;
        $attendanceRate = $totalDays > 0 ? round(($presentDays / $totalDays) * 100) : 100;
        
        // Ensure attendance rate is not negative
        $attendanceRate = max(0, $attendanceRate);
        
        // Determine gender-based pronouns
        $genderPronoun = 'ابنكم'; // Default to male
        $verb = 'تغيب';
        
        // You can add logic here to determine gender if you have a gender field
        // For now, we'll use a simple approach or you can modify based on your needs
        
        // NEW ENHANCED PROFESSIONAL MESSAGE WITH IMPROVED UX
        $message = "🏫 *{$schoolName}* 🌟

السلام عليكم ورحمة الله وبركاته،

📋 *تنبيه غياب الطالب*
نخبركم أن {$genderPronoun} *{$studentName}* قد {$verb} عن حصة *{$subject}* التي جرت يوم *{$date}* بمركز {$schoolName}.

👨‍🏫 *المعلم:* {$teacherName}
📅 *الفصل:* {$className}
📊 *معدل الحضور لهذا العام:* {$attendanceRate}%

📞 *للاستفسار والتواصل:*
📱 {$schoolPhone}
Ig: https://www.instagram.com/centreredcity?igsh=MXg1NjJwam80eTNoMw%3D%3D&utm_source=qr

🕐 
ساعات العمل:*من 10:00 إلى 13:00
ومن 16:30 الى *22:30*

نرجو منكم التفضل بالتواصل معنا لتوضيح سبب الغياب، حتى نتمكن من متابعة مستواه وضمان استفادته الكاملة من الدروس.

شكراً لتعاونكم 🌷
*إدارة {$schoolName}*";
        
        // OLD SIMPLE MESSAGE (COMMENTED FOR EASY ROLLBACK)
        /*
    $message = "السلام عليكم ورحمة الله وبركاته،\n\nنخبركم أن {$genderPronoun} {$studentName} قد {$verb} عن حصة {$subject} التي جرت يوم {$date} بمركز Centre Red city.\n\nنرجو منكم التفضل بالتواصل معنا لتوضيح سبب الغياب، حتى نتمكن من متابعة مستواه وضمان استفادته الكاملة من الدروس.\n\nشكراً لتعاونكم 🌷\nإدارة Centre Red city";
        */
        
        WasenderApi::sendText($fatherPhone, $message);
        return back()->with('success', 'WhatsApp message envoyé au parent.');
    }

    /**
     * Télécharger la liste de présence PDF pour une classe et un enseignant
     */
    public function downloadAbsenceList(Request $request)
    {
        $request->validate([
            'teacher_id' => 'required|exists:teachers,id',
            'class_id' => 'required|exists:classes,id',
            'date' => 'nullable|date',
        ]);
        $teacher = \App\Models\Teacher::findOrFail($request->teacher_id);
        $class = \App\Models\Classes::with('level')->findOrFail($request->class_id);
        
        // Get all students in the class first, filtering by active status
        $allStudents = $class->students()->where('status', 'active')->orderBy('lastName')->get();
        
        // Filter students to only include those taught by the selected teacher through memberships
        $students = $allStudents->filter(function ($student) use ($teacher) {
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

        
        $date = $request->input('date', now()->format('Y-m-d'));

        // Parse year and month
        $year = date('Y');
        $month = 1;
        if (!empty($date)) {
            $parts = explode('-', substr($date, 0, 10));
            if (count($parts) >= 2) {
                $year = (int)$parts[0];
                $month = (int)$parts[1];
            }
        }
        $daysInMonth = cal_days_in_month(CAL_GREGORIAN, $month, $year);

        // Fetch all absences for this class and month
        $absences = \App\Models\Attendance::where('classId', $class->id)
            ->where('status', 'absent')
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->get();

        // Build a map: [student_id][day] = true if absent
        $studentAbsences = [];
        foreach ($absences as $absence) {
            $day = (int)date('j', strtotime($absence->date));
            $studentAbsences[$absence->student_id][$day] = true;
        }

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('absence_list_pdf', [
            'teacher' => $teacher,
            'class' => $class,
            'students' => $students,
            'date' => $date,
            'studentAbsences' => $studentAbsences,
            'daysInMonth' => $daysInMonth,
        ])->setPaper('A4', 'landscape');
        $filename = 'Liste-absence-' . $class->name . '-' . $teacher->last_name . '-' . now()->format('Ymd_His') . '.pdf';
        return $pdf->download($filename);
    }

    /**
     * Page de sélection pour la liste de présence (frontend)
     */
    public function absenceListPage()
{
    $teachers = \App\Models\Teacher::with(['schools:id,name'])
        ->select('id', 'first_name', 'last_name')
        ->get()
        ->map(function ($teacher) {
            return [
                'id' => $teacher->id,
                'first_name' => $teacher->first_name,
                'last_name' => $teacher->last_name,
                'schools' => $teacher->schools->map(function ($school) {
                    return [
                        'id' => $school->id,
                        'name' => $school->name,
                    ];
                })->toArray(),
            ];
        });

    $classes = \App\Models\Classes::with(['teachers:id,first_name,last_name'])->get()->map(function ($class) {
        return [
            'id' => $class->id,
            'name' => $class->name,
            'teachers' => $class->teachers->map(function ($t) {
                return [
                    'id' => $t->id,
                    'first_name' => $t->first_name,
                    'last_name' => $t->last_name,
                ];
            })->toArray(),
        ];
    });

    // ✅ distinct schools list
    $schools = \App\Models\School::select('id', 'name')->get();

    return \Inertia\Inertia::render('Menu/AbsenceListPage', [
        'teachers' => $teachers,
        'classes' => $classes,
        'schools' => $schools,
    ]);
}

}