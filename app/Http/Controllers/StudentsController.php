<?php
namespace App\Http\Controllers;

use App\Models\Student;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Storage;
use App\Models\Level;
use App\Models\Classes;
use App\Models\School;
use App\Models\Subject;
use App\Models\Offer;
use App\Models\Teacher;
use App\Models\Membership;
use App\Models\Invoice;
use App\Models\Attendance;
use App\Models\Result;
use App\Models\StudentMovement;
use Cloudinary\Cloudinary;
use Cloudinary\Configuration\Configuration;
use Cloudinary\Api\Upload\UploadApi;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Log;

class StudentsController extends Controller
{
    /**
     * Download a student's information as a PDF.
     */
    public function downloadPdf($id)
    {
        $student = Student::with(['level', 'class', 'school', 'memberships.offer'])
            ->findOrFail($id);
        
        $pdf = Pdf::loadView('students_pdf', [
            'student' => $student
        ]);
        $fileName = 'student_' . $student->id . '_' . now()->format('Ymd_His') . '.pdf';
        return $pdf->download($fileName);
    }
    // Helper function to get Cloudinary
    private function getCloudinary()
    {
        return new Cloudinary(
            Configuration::instance([
                'cloud' => [
                    'cloud_name' => env('CLOUDINARY_CLOUD_NAME'),
                    'api_key' => env('CLOUDINARY_API_KEY'),
                    'api_secret' => env('CLOUDINARY_API_SECRET'),
                ],
                'url' => [
                    'secure' => true
                ]
            ])
        );
    }

    /**
    * @param \Illuminate\Http\UploadedFile $file
    * @param string $folder
    * @param int $width
    * @param int $height
    * @return array
    */
    private function uploadToCloudinary($file, $folder = 'students', $width = 300, $height = 300)
    {
        $cloudinary = $this->getCloudinary();
        $uploadApi = $cloudinary->uploadApi();
        
        // Get file info
        $fileSize = $file->getSize();
        $fileExtension = $file->extension();
        
        // Set quality based on file size
        $quality = 'auto';
        if ($fileSize > 1000000) {
            $quality = 'auto:low';
        }
        
        // Upload parameters
        $options = [
            'folder' => $folder,
            'transformation' => [
                [
                    'width' => $width, 
                    'height' => $height, 
                    'crop' => 'fill',
                    'gravity' => 'auto',
                ],
                [
                    'quality' => $quality,
                    'fetch_format' => 'auto',
                ],
            ],
            'public_id' => 'student_' . time() . '_' . random_int(1000, 9999),
            'resource_type' => 'image',
            'flags' => 'lossy',
            'context' => 'source=laravel-app|user=student',
        ];
        
        // Upload to Cloudinary
        $result = $uploadApi->upload($file->getRealPath(), $options);
        
        return [
            'secure_url' => $result['secure_url'],
            'public_id' => $result['public_id'],
            'format' => $result['format'],
            'width' => $result['width'],
            'height' => $result['height'],
            'bytes' => $result['bytes'],
            'resource_type' => $result['resource_type'],
            'created_at' => $result['created_at'],
        ];
    }
    /**
     * Display a listing of the resource.
     */
 
     public function index(Request $request)
     {
         // Initialize the query with eager loading for relationships
         $query = Student::with(['class', 'school', 'level', 'memberships']);
         
         // Get the current user and their role
         $user = $request->user();
         $userRole = $user ? $user->role : null;
         
         // If user is a teacher, only show students they teach
         if ($userRole === 'teacher') {
             $teacher = \App\Models\Teacher::where('email', $user->email)->first();
             if ($teacher) {
                 // Debug: Check what memberships exist for this teacher
                 $debugMemberships = \App\Models\Membership::where(function($q) use ($teacher) {
                     $q->whereRaw("JSON_CONTAINS(teachers, JSON_OBJECT('teacherId', ?))", [$teacher->id])
                       ->orWhereRaw("JSON_CONTAINS(teachers, JSON_OBJECT('teacherId', ?))", [(string)$teacher->id]);
                 })->get();
                 Log::info('Debug: Memberships found for teacher', [
                     'teacher_id' => $teacher->id,
                     'teacher_email' => $user->email,
                     'memberships_count' => $debugMemberships->count(),
                     'memberships_data' => $debugMemberships->map(function($m) {
                         return [
                             'id' => $m->id,
                             'student_id' => $m->student_id,
                             'teachers' => $m->teachers
                         ];
                     })
                 ]);
                 
                 $query->whereHas('memberships', function($membershipQuery) use ($teacher) {
                     // Try both string and integer versions of teacher ID
                     $membershipQuery->where(function($q) use ($teacher) {
                         $q->whereRaw("JSON_CONTAINS(teachers, JSON_OBJECT('teacherId', ?))", [$teacher->id])
                           ->orWhereRaw("JSON_CONTAINS(teachers, JSON_OBJECT('teacherId', ?))", [(string)$teacher->id]);
                     });
                 });
                 Log::info('Filtering students for teacher', [
                     'teacher_id' => $teacher->id,
                     'teacher_email' => $user->email
                 ]);
             }
         }
         
         // Get the selected school from session and apply filter
         $selectedSchoolId = session('school_id');
         if ($selectedSchoolId) {
             // Show students for the selected school OR students with no school assigned
             $query->where(function($q) use ($selectedSchoolId) {
                 $q->where('schoolId', $selectedSchoolId)
                   ->orWhereNull('schoolId');
             });
         }
     
         // Apply search filter if search term is provided
         if ($request->has('search') && !empty($request->search)) {
             $this->applySearchFilter($query, $request->search);
         }
     
         // Apply additional filters (e.g., school, class, level)
         $this->applyFilters($query, $request->only(['school', 'class', 'level']));
     
         // Membership status filter
         $membershipStatus = $request->input('membership_status');
         $studentsCollection = $query->orderBy('created_at', 'desc')->get();
         
         // Debug: Log how many students were found
         Log::info('Debug: Students found after query', [
             'user_role' => $userRole,
             'teacher_id' => $userRole === 'teacher' ? ($teacher ? $teacher->id : null) : null,
             'students_count' => $studentsCollection->count(),
             'query_sql' => $query->toSql(),
             'query_bindings' => $query->getBindings()
         ]);
         if ($membershipStatus && $membershipStatus !== 'all') {
             $studentsCollection = $studentsCollection->filter(function ($student) use ($membershipStatus) {
                 $allMemberships = $student->memberships;
                 if ($allMemberships->isEmpty()) {
                     // If no memberships, only show for unpaid/rest
                     return $membershipStatus === 'unpaid' || $membershipStatus === 'rest';
                 }
                 $paidCount = $allMemberships->where('payment_status', 'paid')->count();
                 $totalCount = $allMemberships->count();
                 if ($membershipStatus === 'paid') {
                     return $paidCount === $totalCount;
                 }
                 if ($membershipStatus === 'unpaid') {
                     return $paidCount === 0;
                 }
                 if ($membershipStatus === 'rest') {
                     return $paidCount > 0 && $paidCount < $totalCount;
                 }
                 return false;
             });
         }
         // Paginate the filtered collection manually
         $perPage = 10;
         $currentPage = $request->input('page', 1);
         $students = new \Illuminate\Pagination\LengthAwarePaginator(
             $studentsCollection->slice(($currentPage - 1) * $perPage, $perPage)->values(),
             $studentsCollection->count(),
             $perPage,
             $currentPage,
             ['path' => $request->url(), 'query' => $request->query()]
         );
         // Transform for frontend
         $students = $students->through(function ($student) {
            return $this->transformStudentData($student);
        });
         
         // Get all classes for filters, but filter them by selected school if applicable
         $classesQuery = Classes::query();
         if ($selectedSchoolId) {
             $classesQuery->where('school_id', $selectedSchoolId);
         }
         $classes = $classesQuery->get();
     
         return Inertia::render('Menu/StudentListPage', [
             'students' => $students,
             'Alllevels' => Level::all(),
             'Allclasses' => $classes,
             'Allschools' => School::all(),
             'search' => $request->search,
             'filters' => $request->only(['school', 'class', 'level', 'membership_status']),
             'Allmemberships' => Membership::whereNull('deleted_at')->get(),
             'selectedSchool' => $selectedSchoolId ? [
                 'id' => $selectedSchoolId,
                 'name' => session('school_name')
             ] : null
         ]);
     }

/**
 * Apply search filter to the query.
 */
protected function applySearchFilter($query, $searchTerm)
{
    $query->where(function ($q) use ($searchTerm) {
        // Search by student fields, including parent phone and parent name
        $q->where('firstName', 'LIKE', "%{$searchTerm}%")
          ->orWhere('lastName', 'LIKE', "%{$searchTerm}%")
          ->orWhere('massarCode', 'LIKE', "%{$searchTerm}%")
          ->orWhere('phoneNumber', 'LIKE', "%{$searchTerm}%")
          ->orWhere('email', 'LIKE', "%{$searchTerm}%")
          ->orWhere('address', 'LIKE', "%{$searchTerm}%")
          ->orWhere('guardianNumber', 'LIKE', "%{$searchTerm}%")
          ->orWhere('guardianName', 'LIKE', "%{$searchTerm}%")
          // Search by full name (firstName + lastName combined)
          ->orWhereRaw("CONCAT(firstName, ' ', lastName) LIKE ?", ["%{$searchTerm}%"])
          // Search by full name in reverse order (lastName + firstName)
          ->orWhereRaw("CONCAT(lastName, ' ', firstName) LIKE ?", ["%{$searchTerm}%"]);

        // Search by class, school, and level names
        $this->applyRelationshipSearch($q, $searchTerm);
    });
}

/**
 * Apply search filter to relationships (class, school, level).
 */
protected function applyRelationshipSearch($query, $searchTerm)
{
    $query->orWhereHas('class', function ($classQuery) use ($searchTerm) {
        $classQuery->where('name', 'LIKE', "%{$searchTerm}%");
    })
    ->orWhereHas('school', function ($schoolQuery) use ($searchTerm) {
        $schoolQuery->where('name', 'LIKE', "%{$searchTerm}%");
    })
    ->orWhereHas('level', function ($levelQuery) use ($searchTerm) {
        $levelQuery->where('name', 'LIKE', "%{$searchTerm}%");
    });
}

/**
 * Apply additional filters (school, class, level).
 */
protected function applyFilters($query, $filters)
{
    if (!empty($filters['school'])) {
        $query->where('schoolId', $filters['school']);
    }

    if (!empty($filters['class'])) {
        $query->where('classId', $filters['class']);
    }

    if (!empty($filters['level'])) {
        $query->where('levelId', $filters['level']);
    }
}

/**
 * Transform student data for the frontend.
 */
protected function transformStudentData($student)
{
    return [
        'id' => $student->id,
        'name' => $student->firstName . ' ' . $student->lastName,
        'studentId' => $student->massarCode,
        'phone' => $student->phoneNumber,
        'address' => $student->address,
        'classId' => $student->classId,
        'schoolId' => $student->schoolId,
        'firstName' => $student->firstName,
        'lastName' => $student->lastName,
        'dateOfBirth' => $student->dateOfBirth,
        'billingDate' => $student->billingDate,
        'CIN' => $student->CIN,
        'email' => $student->email,
        'massarCode' => $student->massarCode,
        'levelId' => $student->levelId,
        'status' => $student->status,
        'assurance' => $student->assurance,
        'assuranceAmount' => $student->assuranceAmount,
        'guardianNumber' => $student->guardianNumber,
        'guardianName' => $student->guardianName,
        'profile_image' => $student->profile_image ?? null,
        'phoneNumber' => $student->phoneNumber,
        'hasDisease' => $student->hasDisease,
        'diseaseName' => $student->diseaseName,
        'medication' => $student->medication,
    ];
}

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Students/Create');
    }

    public function store(Request $request)
    {
        try {
            // Validate the incoming request data
            $validatedData = $request->validate([
                'firstName' => 'required|string|max:100',
                'lastName' => 'required|string|max:100',
                'dateOfBirth' => 'required|date',
                'billingDate' => 'required|date',
                'address' => 'nullable|string',
                'guardianNumber' => 'nullable|string|max:255',
                'guardianName' => 'nullable|string|max:255',
                'CIN' => 'nullable|string|max:50|unique:students,CIN',
                'phoneNumber' => 'nullable|string|max:20',
                'email' => 'nullable|string|email|max:255|unique:students,email',
                'massarCode' => 'nullable|string|max:50|unique:students,massarCode',
                'levelId' => 'required|exists:levels,id',
                'classId' => 'required|exists:classes,id',
                'schoolId' => 'required|exists:schools,id',
                'status' => 'required|in:active,inactive',
                'hasDisease' => 'sometimes',
                'diseaseName' => 'nullable|required_if:hasDisease,1,true',
                'medication' => 'nullable',
                'assurance' => 'required',
                'assuranceAmount' => 'nullable|numeric|min:0',
                'profile_image' => 'nullable|image|mimes:jpg,jpeg,png|max:5120', // Added for image upload
            ]);

            // Process hasDisease field - use simple integer conversion
            if (isset($validatedData['hasDisease'])) {
                // Convert to integer 1 or 0 explicitly, avoiding boolean conversion that might cause issues
                $hasDiseaseValue = (is_string($validatedData['hasDisease']) && strtolower($validatedData['hasDisease']) === 'true') || 
                                   $validatedData['hasDisease'] === 1 || 
                                   $validatedData['hasDisease'] === '1' ? 1 : 0;
                                   
                // Update the validated data with the integer value
                $validatedData['hasDisease'] = $hasDiseaseValue;
            } else {
                $validatedData['hasDisease'] = 0;
            }
            
            // Process assurance field in the same way
            if (isset($validatedData['assurance'])) {
                $assuranceValue = (is_string($validatedData['assurance']) && strtolower($validatedData['assurance']) === 'true') || 
                                  $validatedData['assurance'] === 1 || 
                                  $validatedData['assurance'] === '1' ? 1 : 0;
                                  
                $validatedData['assurance'] = $assuranceValue;
            } else {
                $validatedData['assurance'] = 0;
            }

            // Handle profile image upload to Cloudinary
            if ($request->hasFile('profile_image')) {
                $uploadedFile = $request->file('profile_image');
                $uploadResult = $this->uploadToCloudinary($uploadedFile);
                $validatedData['profile_image'] = $uploadResult['secure_url'];
            }

            // If hasDisease is false (0), set diseaseName and medication to NULL
            if ($validatedData['hasDisease'] === 0) {
                $validatedData['diseaseName'] = null;
                $validatedData['medication'] = null;
            }

            // Create and save the new student
            $student = Student::create($validatedData);

            // Update class student count if assigned to a class
            if (!empty($validatedData['classId'])) {
                $class = Classes::find($validatedData['classId']);
                if ($class) {
                    $class->updateStudentCount();
                    
                    // Log the updated class count
                }
            }

            // Log the activity
            $this->logActivity('created', $student);

            // Insert assurance invoice if needed
            if ($validatedData['assurance'] == 1 && $request->filled('assuranceAmount') && floatval($request->input('assuranceAmount')) > 0) {
                Invoice::create([
                    'type' => 'assurance',
                    'assurance_amount' => $request->input('assuranceAmount'),
                    'membership_id' => null,
                    'offer_id' => null,
                    'student_id' => $student->id,
                    'amountPaid' => $request->input('assuranceAmount'),
                    'totalAmount' => $request->input('assuranceAmount'),
                    'rest' => 0,
                    'billDate' => $validatedData['billingDate'],
                    'creationDate' => now(),
                    'created_by' => auth()->id(),
                    'months' => 1,
                ]);
            }

            return redirect()->route('students.show', $student->id)->with('success', 'Student created successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to create student. Please try again.');
        }
    }
    /**
     * Display the specified resource.
     */
   /**
 * Display the specified resource.
 */
    public function show($id)
    {
        // Block teachers from accessing student profiles
        if (auth()->user() && auth()->user()->role === 'teacher') {
            abort(403, 'Access denied. Teachers are not allowed to view student profiles.');
        }
        // Fetch the student from the database
        $student = Student::find($id);

        // If the student doesn't exist, return a 404 error
        if (!$student) {
            abort(404);
        }

        // Fetch all levels, and teachers with their subjects
        $levels = Level::all();
        // Fetch offers based on student's level
        $offers = Offer::where('levelId', $student->levelId)->get();
        $teachers = Teacher::with('subjects')->get(); // Eager load subjects for each teacher

        // Fetch memberships for the student (including soft-deleted ones)
        $memberships = Membership::withTrashed()
            ->where('student_id', $student->id)
            ->with(['offer', 'invoices'])
            ->get()
            ->map(function ($membership) {
                // Process invoices for this membership
                $membershipInvoices = $membership->invoices->map(function ($invoice) {
                    // Always send selectedMonths as array if present
                    $selectedMonths = [];
                    if (isset($invoice->selected_months)) {
                        if (is_string($invoice->selected_months)) {
                            $decoded = json_decode($invoice->selected_months, true);
                            if (is_array($decoded)) {
                                $selectedMonths = $decoded;
                            }
                        } elseif (is_array($invoice->selected_months)) {
                            $selectedMonths = $invoice->selected_months;
                        }
                    }
                    
                    return [
                        'id' => $invoice->id,
                        'membership_id' => $invoice->membership_id,
                        'months' => $invoice->months,
                        'billDate' => $invoice->billDate,
                        'creationDate' => $invoice->creationDate,
                        'totalAmount' => (float) $invoice->totalAmount,
                        'amountPaid' => (float) $invoice->amountPaid,
                        'rest' => (float) $invoice->rest,
                        'endDate' => $invoice->endDate,
                        'includePartialMonth' => $invoice->includePartialMonth,
                        'partialMonthAmount' => (float) $invoice->partialMonthAmount,
                        'last_payment' => $invoice->updated_at,
                        'created_at' => $invoice->created_at,
                        'selectedMonths' => $selectedMonths,
                        'type' => $invoice->type,
                        'assurance_amount' => (float) $invoice->assurance_amount,
                    ];
                });

                return [
                    'id' => $membership->id,
                    'offer_name' => optional($membership->offer)->offer_name,
                    'offer_id' => optional($membership->offer)->id,
                    'price' => optional($membership->offer)->price,
                    'teachers' => $membership->teachers,
                    'created_at' => $membership->created_at,
                    'payment_status' => $membership->payment_status,
                    'is_active' => $membership->is_active,
                    'start_date' => $membership->start_date,
                    'end_date' => $membership->end_date,
                    'deleted_at' => $membership->deleted_at, // Include deletion status
                    'invoices' => $membershipInvoices, // Include invoices for this membership
                ];
            });

        // Fetch invoices for all student
        $invoices = Invoice::where('student_id', $student->id)
            ->with(['offer'])
            ->get()
            ->map(function ($invoice) {
                // Always send selectedMonths as array if present
                $selectedMonths = [];
                if (isset($invoice->selected_months)) {
                    if (is_string($invoice->selected_months)) {
                        $decoded = json_decode($invoice->selected_months, true);
                        if (is_array($decoded)) {
                            $selectedMonths = $decoded;
                        }
                    } elseif (is_array($invoice->selected_months)) {
                        $selectedMonths = $invoice->selected_months;
                    }
                }
                return [
                    'id' => $invoice->id,
                    'membership_id' => $invoice->membership_id,
                    'months' => $invoice->months,
                    'billDate' => $invoice->billDate,
                    'creationDate' => $invoice->creationDate,
                    'totalAmount' => (float) $invoice->totalAmount,
                    'amountPaid' => (float) $invoice->amountPaid,
                    'rest' => (float) $invoice->rest,
                    'endDate' => $invoice->endDate,
                    'includePartialMonth' => $invoice->includePartialMonth,
                    'partialMonthAmount' => (float) $invoice->partialMonthAmount,
                    'last_payment' => $invoice->updated_at,
                    'created_at' => $invoice->created_at,
                    'selectedMonths' => $selectedMonths,
                    'type' => $invoice->type,
                    'assurance_amount' => (float) $invoice->assurance_amount,
                ];
            });

        // Fetch latest assurance invoice for the student
        $assuranceInvoice = Invoice::where('student_id', $student->id)
            ->where('type', 'assurance')
            ->orderByDesc('created_at')
            ->first();

        // Fetch attendance records for the student
        $attendances = Attendance::with(['class', 'recordedBy'])
            ->where('student_id', $student->id)
            ->latest()
            ->get()
            ->map(function ($attendance) {
                return [
                    'id' => $attendance->id,
                    'date' => $attendance->date,
                    'status' => $attendance->status,
                    'class' => $attendance->class ? $attendance->class->name : null,
                    'recordedBy' => $attendance->recordedBy ? $attendance->recordedBy->name : null,
                    'created_at' => $attendance->created_at,
                    'reason' => $attendance->reason
                ];
            });
            
        // Fetch results/grades for the student
        $results = Result::with(['subject', 'class.level'])
            ->where('student_id', $student->id)
            ->get()
            ->map(function ($result) {
                return [
                    'id' => $result->id,
                    'subject' => $result->subject ? $result->subject->name : 'Unknown Subject',
                    'level' => $result->class && $result->class->level ? $result->class->level->name : 'Unknown Level',
                    'teacher' => $result->class ? ($result->class->teacher_name ?? 'Unknown Teacher') : 'Unknown Teacher',
                    'grade1' => $result->grade1,
                    'grade2' => $result->grade2,
                    'grade3' => $result->grade3,
                    'final_grade' => $result->final_grade,
                    'notes' => $result->notes,
                    'exam_date' => $result->exam_date,
                ];
            });
            
        // Fetch promotion status for the student
        $promotion = $student->getCurrentPromotion();
        $promotionData = $promotion ? [
            'id' => $promotion->id,
            'student_id' => $promotion->student_id,
            'is_promoted' => $promotion->is_promoted,
            'notes' => $promotion->notes,
            'school_year' => $promotion->school_year,
            'created_at' => $promotion->created_at,
            'updated_at' => $promotion->updated_at,
        ] : null;

        // Format the student data with new disease fields
        $studentData = [
            'id' => $student->id,
            'name' => $student->firstName . ' ' . $student->lastName,
            'studentId' => $student->massarCode,
            'phone' => $student->phoneNumber,
            'phoneNumber' => $student->phoneNumber,
            'address' => $student->address,
            'classId' => $student->classId,
            'schoolId' => $student->schoolId,
            'firstName' => $student->firstName,
            'lastName' => $student->lastName,
            'dateOfBirth' => $student->dateOfBirth,
            'billingDate' => $student->billingDate,
            'CIN' => $student->CIN,
            'email' => $student->email,
            'massarCode' => $student->massarCode,
            'levelId' => $student->levelId,
            'status' => $student->status,
            'assurance' => $student->assurance,
            'assuranceAmount' => $student->assuranceAmount,
            'guardianNumber' => $student->guardianNumber,
            'guardianName' => $student->guardianName,
            'profile_image' => $student->profile_image ?? null,
            'hasDisease' => $student->hasDisease,
            'diseaseName' => $student->diseaseName,
            'medication' => $student->medication,
            'created_at' => $student->created_at,
            'memberships' => $memberships,
            'invoices' => $invoices,
            'attendances' => $attendances,
            'results' => $results,
            'promotion' => $promotionData,
            'assurance_paid' => $assuranceInvoice ? true : false,
            'assurance_invoice' => $assuranceInvoice ? [
                'amount' => $assuranceInvoice->assurance_amount,
                'date' => $assuranceInvoice->created_at,
                'invoice_id' => $assuranceInvoice->id,
            ] : null,
        ];

        // Fetch schools and classes
        $schools = School::all();
        $classes = Classes::all();

        // Get student movement history
        $movements = StudentMovement::where('student_id', $student->id)
            ->with(['recordedBy'])
            ->orderBy('movement_date', 'desc')
            ->get()
            ->map(function ($movement) {
                return [
                    'id' => $movement->id,
                    'movement_type' => $movement->movement_type,
                    'movement_date' => $movement->movement_date,
                    'month_year' => $movement->month_year,
                    'reason' => $movement->reason,
                    'previous_status' => $movement->previous_status,
                    'new_status' => $movement->new_status,
                    'billing_date' => $movement->billing_date,
                    'assurance_amount' => $movement->assurance_amount,
                    'has_assurance' => $movement->has_assurance,
                    'recorded_by' => $movement->recordedBy ? $movement->recordedBy->name : null,
                    'notes' => $movement->notes,
                    'created_at' => $movement->created_at,
                ];
            });

        return Inertia::render('Menu/SingleStudentPage', [
            'student' => $studentData,
            'movements' => $movements,
            'Alllevels' => $levels,
            'Allclasses' => $classes,
            'Allschools' => $schools,
            'Alloffers' => $offers,
            'Allteachers' => $teachers->map(function ($teacher) {
                return [
                    'id' => $teacher->id,
                    'first_name' => $teacher->first_name,
                    'last_name' => $teacher->last_name,
                    'subjects' => $teacher->subjects->pluck('name'),
                ];
            }),
        ]);
    }
    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Student $student)
    {
        return Inertia::render('Students/Edit', [
            'student' => $student,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Student $student)
    {
        try {
            $oldData = $student->toArray();
            $oldClassId = $student->classId;
            
            // Log the raw request data for debugging
            $validatedData = $request->validate([
                'firstName' => 'required|string|max:100',
                'lastName' => 'required|string|max:100',
                'dateOfBirth' => 'required|date',
                'billingDate' => 'required|date',
                'address' => 'nullable|string',
                'guardianNumber' => 'nullable|string|max:255',
                'guardianName' => 'nullable|string|max:255',
                'CIN' => 'nullable|string|max:50|unique:students,CIN,' . $student->id,
                'phoneNumber' => 'nullable|string|max:20',
                'email' => 'nullable|string|email|max:255|unique:students,email,' . $student->id,
                'massarCode' => 'nullable|string|max:50|unique:students,massarCode,' . $student->id,
                'levelId' => 'nullable',
                'classId' => 'nullable',
                'schoolId' => 'nullable',
                'status' => 'required|in:active,inactive',
                'assurance' => 'required',
                'assuranceAmount' => 'nullable|numeric|min:0',
                'hasDisease' => 'sometimes',
                'diseaseName' => 'nullable|string|max:255',
                'medication' => 'nullable|string',
                'profile_image' => 'nullable|image|mimes:jpg,jpeg,png|max:5120',
            ]);
            
            // Process hasDisease field - ensure it's always an integer 0 or 1
            $hasDiseaseValue = 0; // Default to 0
            if (isset($validatedData['hasDisease'])) {
                // Convert various truthy values to 1
                if (in_array($validatedData['hasDisease'], [1, '1', true, 'true', 'yes', 'Yes', 'YES'], true)) {
                    $hasDiseaseValue = 1;
                }
            }
            $validatedData['hasDisease'] = $hasDiseaseValue;
            
            // Process assurance field
            $assuranceValue = 0; // Default to 0
            if (isset($validatedData['assurance'])) {
                // Convert various truthy values to 1
                if (in_array($validatedData['assurance'], [1, '1', true, 'true', 'yes', 'Yes', 'YES'], true)) {
                    $assuranceValue = 1;
                }
            }
            $validatedData['assurance'] = $assuranceValue;
            
            // Handle disease fields based on hasDisease value
            if ($hasDiseaseValue === 0) {
                // When hasDisease is false, always set diseaseName and medication to NULL
                $validatedData['diseaseName'] = null;
                $validatedData['medication'] = null;
            } else {
                // When hasDisease is true, validate that diseaseName is provided
                if (empty($validatedData['diseaseName'])) {
                    return redirect()->back()->withErrors(['diseaseName' => 'The disease name field is required when has disease is true.'])->withInput();
                }
                
                // Convert empty strings to null
                if ($validatedData['diseaseName'] === '') {
                    $validatedData['diseaseName'] = null;
                }
                if (isset($validatedData['medication']) && $validatedData['medication'] === '') {
                    $validatedData['medication'] = null;
                }
            }
            
            // Convert other empty strings to null for nullable fields
            foreach (['CIN', 'phoneNumber', 'email', 'massarCode'] as $field) {
                if (isset($validatedData[$field]) && $validatedData[$field] === '') {
                    $validatedData[$field] = null;
                }
            }
            
            // Handle profile image upload to Cloudinary
            if ($request->hasFile('profile_image')) {
                $uploadedFile = $request->file('profile_image');
                $uploadResult = $this->uploadToCloudinary($uploadedFile);
                $validatedData['profile_image'] = $uploadResult['secure_url'];
                
                // Delete old image if it exists
                if ($student->profile_image) {
                    $publicId = $student->profile_image_public_id ?? null;
                    if ($publicId) {
                        $cloudinary = $this->getCloudinary();
                        $cloudinary->uploadApi()->destroy($publicId);
                    }
                }
            }

            // Update the student using Eloquent to trigger events
            $student->update($validatedData);

            // Check if the class has changed
            $newClassId = $student->classId;
            if ($oldClassId != $newClassId) {
                // Update old class count if there was an old class
                if ($oldClassId) {
                    $oldClass = Classes::find($oldClassId);
                    if ($oldClass) {
                        $oldClass->updateStudentCount();
                    }
                }
                
                // Update new class count if there is a new class
                if ($newClassId) {
                    $newClass = Classes::find($newClassId);
                    if ($newClass) {
                        $newClass->updateStudentCount();
                    }
                }
            }

            // Log the activity with old and new data
            $this->logActivity('updated', $student, $oldData, $student->toArray());

            // Insert or update assurance invoice if needed (on update)
            if ($validatedData['assurance'] == 1) {
                // Find the latest assurance invoice for this student
                $assuranceInvoice = Invoice::where('student_id', $student->id)
                    ->where('type', 'assurance')
                    ->orderByDesc('created_at')
                    ->first();
                $amount = $request->input('assuranceAmount', 0);
                if ($assuranceInvoice) {
                    // Update the existing invoice
                    $assuranceInvoice->update([
                        'assurance_amount' => $amount,
                        'amountPaid' => $amount,
                        'totalAmount' => $amount,
                        'rest' => 0,
                        'billDate' => $validatedData['billingDate'],
                        'creationDate' => now(),
                        'created_by' => auth()->id(),
                        'months' => 1,
                    ]);
                } else {
                    // Create a new invoice
                    Invoice::create([
                        'type' => 'assurance',
                        'assurance_amount' => $amount,
                        'membership_id' => null,
                        'offer_id' => null,
                        'student_id' => $student->id,
                        'amountPaid' => $amount,
                        'totalAmount' => $amount,
                        'rest' => 0,
                        'billDate' => $validatedData['billingDate'],
                        'creationDate' => now(),
                        'created_by' => auth()->id(),
                        'months' => 1,
                    ]);
                }
            }

            return redirect()->route('students.show', $student->id)->with('success', 'Student updated successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to update student: ' . $e->getMessage());
        }
    }

     /**
     * Remove the specified resource from storage.
     */
    public function destroy(Student $student)
    {
        try {
            // Save class ID before deleting student
            $classId = $student->classId;
            
            // Delete the profile image from Cloudinary if it exists
            if ($student->profile_image) {
                $publicId = $student->profile_image_public_id ?? null;
                if ($publicId) {
                    $cloudinary = $this->getCloudinary();
                    $cloudinary->uploadApi()->destroy($publicId);
                }
            }

            // Delete the student
            $student->delete();

            // Update class student count if student was assigned to a class
            if ($classId) {
                $class = Classes::find($classId);
                if ($class) {
                    $class->updateStudentCount();
                    
                    // Log the updated class count
                }
            }

            return redirect()->route('students.index')->with('success', 'Student deleted successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to delete student. Please try again.');
        }
    }
    protected function logActivity($action, $model, $oldData = null, $newData = null)
{
    $description = ucfirst($action) . ' ' . class_basename($model) . ' (' . $model->id . ')';
    $tableName = $model->getTable();

    // Define the properties to log
    $properties = [
        'TargetName' => $model->firstName . ' ' . $model->lastName, // Name of the target entity
        'action' => $action, // Type of action (created, updated, deleted)
        'table' => $tableName, // Table where the action occurred
        'user' => auth()->user()->name, // User who performed the action
    ];

    // For updates, show only the changed fields
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

    // For creations, show only the 4 most important columns
    if ($action === 'created') {
        $properties['new_data'] = [
            'firstName' => $model->firstName,
            'lastName' => $model->lastName,
            'email' => $model->email,
            'phoneNumber' => $model->phoneNumber,
        ];
    }

    // For deletions, show the key fields of the deleted entity
    if ($action === 'deleted') {
        $properties['deleted_data'] = [
            'firstName' => $oldData['firstName'],
            'lastName' => $oldData['lastName'],
            'email' => $oldData['email'],
            'phoneNumber' => $oldData['phoneNumber'],
        ];
    }

    // Log the activity
    activity()
        ->causedBy(auth()->user())
        ->performedOn($model)
        ->withProperties($properties)
        ->log($description);
}

}