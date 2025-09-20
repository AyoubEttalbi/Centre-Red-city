<?php

namespace App\Http\Controllers;

use App\Events\CheckEmailUnique;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use App\Models\Subject;
use App\Models\School;
use App\Models\Classes;
use App\Models\Membership;
use App\Models\Announcement;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Cloudinary\Cloudinary;
use Cloudinary\Configuration\Configuration;
use Cloudinary\Api\Upload\UploadApi;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;

class TeacherController extends Controller
{
    
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
    * Upload file to Cloudinary
    */
    private function uploadToCloudinary($file, $folder = 'teachers', $width = 300, $height = 300)
    {
        $cloudinary = $this->getCloudinary();
        $uploadApi = $cloudinary->uploadApi();
        
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
                    'quality' => 'auto',
                    'fetch_format' => 'auto',
                ],
            ],
            'public_id' => 'teacher_' . time() . '_' . random_int(1000, 9999),
            'resource_type' => 'image',
        ];
        
        $result = $uploadApi->upload($file->getRealPath(), $options);
        
        return [
            'secure_url' => $result['secure_url'],
            'public_id' => $result['public_id'],
        ];
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $selectedSchoolId = session('school_id');

        // Initialize the query with eager loading for relationships
        $query = Teacher::with(['subjects', 'classes', 'schools']);

        // Filter by selected school if one is in session
        if ($selectedSchoolId) {
            $query->whereHas('schools', function ($schoolQuery) use ($selectedSchoolId) {
                $schoolQuery->where('schools.id', $selectedSchoolId);
            });
        }

        // Apply search filter if search term is provided
        if ($request->has('search') && !empty($request->search)) {
            $this->applySearchFilter($query, $request->search);
        }

        // Apply additional filters (subject, class, school, status)
        // Note: The individual school filter might become redundant if session school is always applied, 
        // but keep it for explicit filtering capabilities.
        $this->applyFilters($query, $request->only(['subject', 'class', 'school', 'status']));

        // Fetch paginated and filtered teachers, newest first
        $teachers = $query->orderBy('created_at', 'desc')->paginate(10)->withQueryString()->through(function ($teacher) {
            return $this->transformTeacherData($teacher);
        });

        // Fetch schools for the filter dropdown - consider fetching only relevant ones if needed
        $schoolsForFilter = School::all(); 
        // Fetch subjects and classes for filters
        $subjects = Subject::all();
        $classes = Classes::all();

        return Inertia::render('Menu/TeacherListPage', [
            'teachers' => $teachers,
            'schools' => $schoolsForFilter, // Pass schools for the filter dropdown
            'subjects' => $subjects,
            'classes' => $classes,
            'search' => $request->search,
            'filters' => $request->only(['subject', 'class', 'school', 'status']), // Pass current filters
            // activeSchool is already shared via HandleInertiaRequests
        ]);
    }

    /**
     * Apply search filter to the query.
     */
    protected function applySearchFilter($query, $searchTerm)
    {
        $query->where(function ($q) use ($searchTerm) {
            // Search by teacher fields
            $q->where('first_name', 'LIKE', "%{$searchTerm}%")
              ->orWhere('last_name', 'LIKE', "%{$searchTerm}%")
              ->orWhere('phone_number', 'LIKE', "%{$searchTerm}%")
              ->orWhere('email', 'LIKE', "%{$searchTerm}%")
              ->orWhere('address', 'LIKE', "%{$searchTerm}%")
              // Search by full name (first_name + last_name combined)
              ->orWhereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$searchTerm}%"])
              // Search by full name in reverse order (last_name + first_name)
              ->orWhereRaw("CONCAT(last_name, ' ', first_name) LIKE ?", ["%{$searchTerm}%"]);

            // Search by related models through pivot tables
            $this->applyRelationshipSearch($q, $searchTerm);
        });
    }

    /**
     * Apply search filter to relationships (subjects, classes, schools).
     */
    protected function applyRelationshipSearch($query, $searchTerm)
    {
        $query->orWhereHas('subjects', function ($subjectQuery) use ($searchTerm) {
            $subjectQuery->where('name', 'LIKE', "%{$searchTerm}%");
        })
        ->orWhereHas('classes', function ($classQuery) use ($searchTerm) {
            $classQuery->where('name', 'LIKE', "%{$searchTerm}%");
        })
        ->orWhereHas('schools', function ($schoolQuery) use ($searchTerm) {
            $schoolQuery->where('name', 'LIKE', "%{$searchTerm}%");
        });
    }

    /**
     * Apply additional filters (subject, class, school, status).
     */
    protected function applyFilters($query, $filters)
    {
        if (!empty($filters['subject'])) {
            $query->whereHas('subjects', function ($subjectQuery) use ($filters) {
                $subjectQuery->where('subjects.id', $filters['subject']);
            });
        }

        if (!empty($filters['class'])) {
            $query->whereHas('classes', function ($classQuery) use ($filters) {
                $classQuery->where('classes.id', $filters['class']);
            });
        }

        if (!empty($filters['school'])) {
            $query->whereHas('schools', function ($schoolQuery) use ($filters) {
                $schoolQuery->where('schools.id', $filters['school']);
            });
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
    }

    /**
     * Transform teacher data for the frontend.
     */
    protected function transformTeacherData($teacher)
    {
        return [
            'id' => $teacher->id,
            'name' => $teacher->first_name . ' ' . $teacher->last_name,
            'phone_number' => $teacher->phone_number,
            'first_name' => $teacher->first_name,
            'last_name' => $teacher->last_name,
            'phone' => $teacher->phone_number,
            'email' => $teacher->email,
            'address' => $teacher->address,
            'status' => $teacher->status,
            'wallet' => $teacher->wallet,
            'profile_image' => $teacher->profile_image ?? null, 
            'subjects' => $teacher->subjects,
            'classes' => $teacher->classes,
            'schools' => $teacher->schools,
        ];
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $subjects = Subject::all();
        $classes = Classes::all();

        return Inertia::render('Teachers/Create', [
            'subjects' => $subjects,
            'classes' => $classes, 
        ]);
    }

     /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $validatedData = $request->validate([
                'first_name' => 'required|string|max:100',
                'last_name' => 'required|string|max:100',
                'address' => 'nullable|string|max:255',
                'phone_number' => 'nullable|string|max:20',
                'email' => 'required|string|email|max:255|unique:teachers,email',
                'status' => 'required|in:active,inactive',
                'wallet' => 'required|numeric|min:0',
                'profile_image' => 'nullable|image|mimes:jpg,jpeg,png|max:5120',
                'schools' => 'array',
                'schools.*' => 'exists:schools,id',
                'subjects' => 'array',
                'subjects.*' => 'exists:subjects,id',
                'classes' => 'array',
                'classes.*' => 'exists:classes,id',
            ]);

            // Handle profile image upload
            if ($request->hasFile('profile_image')) {
                $uploadResult = $this->uploadToCloudinary($request->file('profile_image'));
                $validatedData['profile_image'] = $uploadResult['secure_url'];
                // If you want to store public_id for future management:
                // $validatedData['profile_image_public_id'] = $uploadResult['public_id'];
            }

            event(new CheckEmailUnique($request->email));
            
            // Create the teacher record
            $teacher = Teacher::create($validatedData);

            // Sync relationships
            $teacher->subjects()->sync($request->subjects ?? []);
            $teacher->classes()->sync($request->classes ?? []);
            $teacher->schools()->sync($request->schools ?? []);

            return redirect()->route('teachers.index')->with('success', 'Teacher created successfully.');
        } catch (\Exception $e) {
            Log::error('Error creating teacher: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to create teacher. Please try again.');
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Teacher $teacher)
    {
        try {
            // Eager load teacher relationships
            $teacher->load(['subjects', 'classes', 'schools']);
            
            // Get filter parameters from request
            $filters = [
                'search' => $request->get('search', ''),
                'class_filter' => $request->get('class_filter', 'all'),
                'offer_filter' => $request->get('offer_filter', 'all'),
                'school_filter' => $request->get('school_filter', 'all'),
                'date_filter' => $request->get('date_filter', ''),
                'membership_status_filter' => $request->get('membership_status_filter', 'all'),
                'payment_status_filter' => $request->get('payment_status_filter', 'all'),
                'page' => $request->get('page', 1),
            ];
            
            
            // Fetch announcements first
            $announcementStatus = $request->query('status', 'all'); // 'all', 'active', 'upcoming', 'expired'
        
            // Base announcement query
            $announcementQuery = Announcement::query();
            
            // Apply date filtering based on status parameter
            $now = Carbon::now();
            
            if ($announcementStatus === 'active') {
                $announcementQuery->where(function($q) use ($now) {
                    $q->where(function($q) use ($now) {
                        $q->whereNull('date_start')
                          ->orWhere('date_start', '<=', $now);
                    })->where(function($q) use ($now) {
                        $q->whereNull('date_end')
                          ->orWhere('date_end', '>=', $now);
                    });
                });
            } elseif ($announcementStatus === 'upcoming') {
                $announcementQuery->where('date_start', '>', $now);
            } elseif ($announcementStatus === 'expired') {
                $announcementQuery->where('date_end', '<', $now);
            }
            
            // Get user role for role-based visibility
            $userRole = Auth::user() ? Auth::user()->role : null;
            
            // Apply role-based visibility filter based on user role
            if ($userRole === 'admin') {
                // Admin sees all announcements (no visibility filter needed)
            } else {
                // Employees only see announcements with visibility 'all' or matching their role
                $announcementQuery->where(function($q) use ($userRole) {
                    $q->where('visibility', 'all')
                      ->orWhere('visibility', $userRole);
                });
            }
            
            // Order announcements by date (most recent first)
            $announcementQuery->orderBy('date_announcement', 'desc');
            
            // Execute announcement query
            $announcements = $announcementQuery->get();

            // Validate teacher email before proceeding
            if (empty($teacher->email) || !filter_var($teacher->email, FILTER_VALIDATE_EMAIL)) {
                Log::error('Teacher has invalid or missing email', [
                    'teacher_id' => $teacher->id,
                    'teacher_email' => $teacher->email
                ]);
                
                // Return error response instead of crashing
                return response()->json([
                    'error' => 'Teacher has invalid or missing email address',
                    'teacher_id' => $teacher->id
                ], 400);
            }
            
            $teacherUser = User::where('email', $teacher->email)->first();
            
            // If teacher doesn't have a user account, create one (fallback mechanism)
            if (!$teacherUser && $teacher->email) {
                try {
                    DB::beginTransaction();
                    
                    // Check if email is already taken by another user
                    $existingUser = User::where('email', $teacher->email)->first();
                    if ($existingUser) {
                        Log::warning('Email already exists in users table but not linked to teacher', [
                            'teacher_id' => $teacher->id,
                            'teacher_email' => $teacher->email,
                            'existing_user_id' => $existingUser->id
                        ]);
                        $teacherUser = $existingUser;
                    } else {
                        // Check if email is valid and not empty
                        if (empty($teacher->email) || !filter_var($teacher->email, FILTER_VALIDATE_EMAIL)) {
                            throw new \Exception('Invalid email address: ' . $teacher->email);
                        }
                        
                        $teacherUser = User::create([
                            'name' => $teacher->first_name . ' ' . $teacher->last_name,
                            'email' => $teacher->email,
                            'password' => bcrypt('temp_password_' . time()), // Temporary password
                            'role' => 'teacher',
                        ]);
                        
                        Log::info('Created missing user account for teacher', [
                            'teacher_id' => $teacher->id,
                            'teacher_email' => $teacher->email,
                            'new_user_id' => $teacherUser->id
                        ]);
                    }
                    
                    DB::commit();
                } catch (\Exception $e) {
                    DB::rollBack();
                    Log::error('Failed to create user account for teacher', [
                        'teacher_id' => $teacher->id,
                        'teacher_email' => $teacher->email,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                    // Continue without user account - the system will handle this gracefully
                }
            }
            
            // Final safety check - if we still don't have a teacherUser, create a minimal one
            if (!$teacherUser) {
                Log::warning('Teacher has no user account and creation failed, using fallback data', [
                    'teacher_id' => $teacher->id,
                    'teacher_email' => $teacher->email
                ]);
                
                // Create a minimal user object for the frontend
                $teacherUser = (object) [
                    'id' => 'temp_' . $teacher->id,
                    'email' => $teacher->email,
                    'name' => $teacher->first_name . ' ' . $teacher->last_name,
                    'role' => 'teacher'
                ];
            }
            
            // Log teacher data for debugging
            Log::info('Teacher data fetched', [
                'teacher_id' => $teacher->id,
                'teacher_email' => $teacher->email,
                'teacher_exists' => $teacher ? true : false,
                'user_found' => $teacherUser ? true : false,
                'user_id' => $teacherUser ? $teacherUser->id : null
            ]);
            
            if (!$teacher) {
                abort(404);
            }
            
            // Calculate total students for this teacher (including deleted memberships)
            $totalStudents = Membership::withTrashed()
                ->whereJsonContains('teachers', [['teacherId' => (string) $teacher->id]])
                ->distinct('student_id')
                ->count('student_id');
            
            // Fetch all memberships where the teacher is involved (including deleted ones)
            $memberships = Membership::withTrashed()
                ->whereIn('payment_status', ['paid', 'pending'])
                ->whereJsonContains('teachers', [['teacherId' => (string) $teacher->id]])
                ->with(['invoices' => function($query) {
                    // Only include non-deleted invoices
                    $query->whereNull('deleted_at');
                }, 'student', 'student.school', 'student.class', 'offer'])
                ->get();
            
            // Debug: Log membership filtering
            Log::info('Membership filtering results', [
                'teacher_id' => $teacher->id,
                'total_memberships_found' => $memberships->count(),
                'memberships_with_invoices' => $memberships->filter(function($m) { return $m->invoices->count() > 0; })->count(),
                'total_invoices_found' => $memberships->sum(function($m) { return $m->invoices->count(); }),
            ]);
            
            // Extract invoices from memberships and calculate the teacher's share by month
            $invoices = $memberships->flatMap(function ($membership) use ($teacher, $filters) {
                // Skip if the student doesn't exist
                if (!$membership->student) {
                    // Debug: Log skipped memberships
                    Log::info('Skipped membership - no student', [
                        'membership_id' => $membership->id,
                        'student_id' => $membership->student_id,
                    ]);
                    return [];
                }
                
                return $membership->invoices->flatMap(function ($invoice) use ($membership, $teacher, $filters) {
                    // Find the teacher's data in the membership
                    $teacherData = collect($membership->teachers)->first(function($item) use ($teacher) {
                        return isset($item['teacherId']) && $item['teacherId'] == (string)$teacher->id;
                    });
                    
                    if (!$teacherData || !isset($teacherData['subject'])) {
                        // Debug: Log skipped invoices due to teacher data
                        Log::info('Skipped invoice - no teacher data', [
                            'invoice_id' => $invoice->id,
                            'student_id' => $membership->student_id,
                            'membership_id' => $membership->id,
                            'teachers_data' => $membership->teachers,
                            'teacher_id_looking_for' => $teacher->id,
                        ]);
                        return [];
                    }
                    
                    // Get selected months for this invoice
                    $selectedMonths = $invoice->selected_months ?? [];
                    if (is_string($selectedMonths)) {
                        $selectedMonths = json_decode($selectedMonths, true) ?? [];
                    }
                    if (empty($selectedMonths)) {
                        // Fallback: if no selected_months, use the billDate month
                        $selectedMonths = [$invoice->billDate ? $invoice->billDate->format('Y-m') : null];
                    }
                    
            // Debug: Log invoice processing (only for first few invoices to avoid spam)
            if ($invoice->id <= 10) {
                Log::info('Processing invoice', [
                    'invoice_id' => $invoice->id,
                    'student_id' => $membership->student_id,
                    'selected_months_raw' => $invoice->selected_months,
                    'selected_months_processed' => $selectedMonths,
                    'billDate' => $invoice->billDate,
                    'payment_status' => $membership->payment_status,
                    'membership_deleted' => !is_null($membership->deleted_at),
                ]);
            }
                    
                    // Get school information
                    $schoolName = 'Unknown';
                    $schoolId = null;
                    
                    if ($membership->student->school) {
                        $schoolName = $membership->student->school->name;
                        $schoolId = $membership->student->school->id;
                    } else {
                        $schoolId = $membership->student->schoolId;
                        $school = School::find($schoolId);
                        if ($school) {
                            $schoolName = $school->name;
                        }
                    }
                    
                    // Get class name safely
                    $className = $membership->student->class ? $membership->student->class->name : 'Unknown';
                    
                    // Calculate teacher earnings per month
                    $offer = $invoice->offer;
                    $teacherSubject = $teacherData['subject'];
                    
                    if (!$offer || !$teacherSubject || !is_array($offer->percentage)) {
                        return [];
                    }
                    
                    // Get teacher percentage from offer
                    $teacherPercentage = $offer->percentage[$teacherSubject] ?? 0;
                    
                    // Calculate total teacher earnings from amountPaid
                    $totalTeacherAmount = $invoice->amountPaid * ($teacherPercentage / 100);
                    
                    // Calculate monthly amount
                    $monthlyAmount = count($selectedMonths) > 0 ? $totalTeacherAmount / count($selectedMonths) : 0;
                    
                    // Create one row per month
                    $monthlyInvoices = [];
                    foreach ($selectedMonths as $month) {
                        if (!$month) {
                            // Debug: Log skipped months
                            Log::info('Skipped month - empty', [
                                'invoice_id' => $invoice->id,
                                'student_id' => $membership->student_id,
                                'selected_months' => $selectedMonths,
                            ]);
                            continue;
                        }
                        
                        // Debug: Log monthly processing (only for first few invoices to avoid spam)
                        if ($invoice->id <= 10) {
                            Log::info('Processing month for invoice', [
                                'invoice_id' => $invoice->id,
                                'student_id' => $membership->student_id,
                                'month' => $month,
                                'date_filter' => $filters['date_filter'] ?? 'none',
                                'month_matches_filter' => $month === ($filters['date_filter'] ?? 'none'),
                            ]);
                        }
                        
                        // Format month for display (MM-YYYY)
                        $monthDisplay = date('m-Y', strtotime($month . '-01'));
                        
                        // Check if this month is paid for this teacher
                        $teacherPayment = \App\Models\TeacherMembershipPayment::where('teacher_id', $teacher->id)
                            ->where('membership_id', $membership->id)
                            ->where('invoice_id', $invoice->id)
                            ->whereJsonContains('selected_months', $month)
                            ->first();
                        
                        $isMonthPaid = false;
                        if ($teacherPayment) {
                            // Check if the month is NOT in the unpaid months list
                            $isMonthPaid = !in_array($month, $teacherPayment->months_rest_not_paid_yet ?? []);
                        }
                        
                        $monthlyInvoices[] = [
                            'id' => $invoice->id . '_' . $month, // Unique ID for each month
                            'invoice_id' => $invoice->id,
                            'membership_id' => $invoice->membership_id,
                            'student_id' => $invoice->student_id,
                            'student_name' => $membership->student->firstName . ' ' . $membership->student->lastName,
                            'student_class' => $className,
                            'student_school' => $schoolName,
                            'schoolId' => $schoolId,
                            'billDate' => $month . '-01', // Use month start date
                            'month_display' => $monthDisplay,
                            'months' => $invoice->months,
                            'creationDate' => $invoice->creationDate,
                            'created_at' => $invoice->created_at, // Add created_at for sorting
                            'totalAmount' => $invoice->totalAmount,
                            'amountPaid' => $invoice->amountPaid,
                            'rest' => $invoice->rest,
                            'offer_id' => $invoice->offer_id,
                            'offer_name' => $invoice->offer ? $invoice->offer->offer_name : null,
                            'endDate' => $invoice->endDate,
                            'includePartialMonth' => $invoice->includePartialMonth,
                            'partialMonthAmount' => $invoice->partialMonthAmount,
                            'teacher_amount' => $monthlyAmount, // Monthly amount instead of total
                            'months_count' => 1, // Always 1 month per row
                            'total_months' => count($selectedMonths), // Total months for reference
                            'membership_deleted' => !is_null($membership->deleted_at), // Add membership deletion status
                            'membership_deleted_at' => $membership->deleted_at, // Add deletion date for reference
                            'is_month_paid' => $isMonthPaid, // Add payment status for this month
                        ];
                    }
                    
                    return $monthlyInvoices;
                });
            });
            
            // Apply filters to invoices
            $invoices = $invoices->filter(function ($invoice) use ($filters) {
                // Search filter
                if (!empty($filters['search'])) {
                    $studentName = $invoice['student_name'] ?? '';
                    if (stripos($studentName, $filters['search']) === false) {
                        return false;
                    }
                }
                
                // Class filter
                if ($filters['class_filter'] !== 'all') {
                    if (($invoice['student_class'] ?? '') !== $filters['class_filter']) {
                        return false;
                    }
                }
                
                // Offer filter
                if ($filters['offer_filter'] !== 'all') {
                    if (($invoice['offer_name'] ?? '') !== $filters['offer_filter']) {
                        return false;
                    }
                }
                
                // School filter
                if ($filters['school_filter'] !== 'all') {
                    if (($invoice['student_school'] ?? '') !== $filters['school_filter']) {
                        return false;
                    }
                }
                
                // Date filter
                if (!empty($filters['date_filter'])) {
                    $invoiceMonths = $invoice['selected_months'] ?? [];
                    if (empty($invoiceMonths)) {
                        // Fallback: if no selected_months, use the billDate month
                        $invoiceMonths = [$invoice['billDate'] ? date('Y-m', strtotime($invoice['billDate'])) : null];
                    }

                    // Check if any of the invoice months match the filter
                    $hasMatchingMonth = false;
                    foreach ($invoiceMonths as $month) {
                        if ($month && strpos($month, $filters['date_filter']) === 0) {
                            $hasMatchingMonth = true;
                            break;
                        }
                    }

                    if (!$hasMatchingMonth) {
                        // Debug: Log filtered out invoices (only for first few to avoid spam)
                        if (($invoice['invoice_id'] ?? 0) <= 10) {
                            Log::info('Invoice filtered out by date', [
                                'invoice_id' => $invoice['id'] ?? 'unknown',
                                'student_id' => $invoice['student_id'] ?? 'unknown',
                                'selected_months' => $invoice['selected_months'] ?? 'empty',
                                'processed_months' => $invoiceMonths,
                                'date_filter' => $filters['date_filter'],
                                'billDate' => $invoice['billDate'] ?? 'unknown',
                            ]);
                        }
                        return false;
                    }
                }
                
                // Membership status filter
                if ($filters['membership_status_filter'] !== 'all') {
                    $isDeleted = $invoice['membership_deleted'] ?? false;
                    if ($filters['membership_status_filter'] === 'active' && $isDeleted) {
                        return false;
                    }
                    if ($filters['membership_status_filter'] === 'deleted' && !$isDeleted) {
                        return false;
                    }
                }
                
                // Payment status filter
                if ($filters['payment_status_filter'] !== 'all') {
                    $isPaid = $invoice['is_month_paid'] ?? false;
                    if ($filters['payment_status_filter'] === 'paid' && !$isPaid) {
                        return false;
                    }
                    if ($filters['payment_status_filter'] === 'pending' && $isPaid) {
                        return false;
                    }
                }
                
                return true;
            });
            
            // Sort invoices by creation date (newest first) - this ensures the most recently created invoices appear first
            $invoices = $invoices->sortByDesc('created_at')->values();
            
            // Calculate stats from ALL filtered invoices (before pagination)
            $stats = [
                'total_invoices' => $invoices->count(),
                'total_amount' => $invoices->sum('teacher_amount'),
                'unique_students' => $invoices->pluck('student_id')->unique()->count(),
                'best_offer' => $this->calculateBestOffer($invoices),
                'current_month_amount' => $this->calculateCurrentMonthAmount($invoices),
                'deleted_memberships' => 0, // This would need to be calculated separately if needed
                'pending_months' => $this->calculatePendingMonths($invoices),
                'active_memberships' => $invoices->pluck('membership_id')->unique()->count(),
            ];
            
            // Debug: Log the stats for troubleshooting
            Log::info('Teacher stats calculated', [
                'teacher_id' => $teacher->id,
                'date_filter' => $filters['date_filter'] ?? 'none',
                'total_invoices' => $stats['total_invoices'],
                'unique_students' => $stats['unique_students'],
                'invoices_count_before_filter' => $invoices->count(),
                'sample_student_ids' => $invoices->pluck('student_id')->unique()->take(5)->toArray(),
                'sample_invoice_ids' => $invoices->pluck('id')->take(5)->toArray(),
                'all_student_ids_count' => $invoices->pluck('student_id')->count(),
                'unique_student_ids_count' => $invoices->pluck('student_id')->unique()->count(),
                'duplicate_students' => $invoices->pluck('student_id')->count() - $invoices->pluck('student_id')->unique()->count(),
            ]);
            
            
            // Paginate the invoices
            $perPage = 10; // Number of invoices per page
            $currentPage = (int) $filters['page']; // Use filter page parameter and ensure it's an integer
            $paginatedInvoices = new \Illuminate\Pagination\LengthAwarePaginator(
                $invoices->forPage($currentPage, $perPage),
                $invoices->count(),
                $perPage,
                $currentPage,
                ['path' => request()->url(), 'query' => request()->query()]
            );
            
            
            
            // Fetch other necessary data
            $schools = School::all();
            $classes = Classes::all();
            $subjects = Subject::all();
            
            // Get unique filter options from all invoices (not just filtered ones)
            $allInvoices = $memberships->flatMap(function ($membership) use ($teacher) {
                if (!$membership->student) return [];
                
                return $membership->invoices->flatMap(function ($invoice) use ($membership, $teacher) {
                    $teacherData = collect($membership->teachers)->first(function($item) use ($teacher) {
                        return isset($item['teacherId']) && $item['teacherId'] == (string)$teacher->id;
                    });
                    
                    if (!$teacherData || !isset($teacherData['subject'])) return [];
                    
                    $selectedMonths = $invoice->selected_months ?? [];
                    if (is_string($selectedMonths)) {
                        $selectedMonths = json_decode($selectedMonths, true) ?? [];
                    }
                    if (empty($selectedMonths)) {
                        $selectedMonths = [$invoice->billDate ? $invoice->billDate->format('Y-m') : null];
                    }
                    
                    $schoolName = 'Unknown';
                    if ($membership->student->school) {
                        $schoolName = $membership->student->school->name;
                    } else {
                        $school = School::find($membership->student->schoolId);
                        if ($school) {
                            $schoolName = $school->name;
                        }
                    }
                    
                    $className = $membership->student->class ? $membership->student->class->name : 'Unknown';
                    $offerName = $invoice->offer ? $invoice->offer->offer_name : null;
                    
                    return collect($selectedMonths)->map(function($month) use ($className, $schoolName, $offerName) {
                        return [
                            'student_class' => $className,
                            'student_school' => $schoolName,
                            'offer_name' => $offerName,
                        ];
                    });
                });
            });
            
            // Extract unique values for filter dropdowns
            $filterOptions = [
                'classes' => $allInvoices->pluck('student_class')->unique()->filter()->values()->toArray(),
                'offers' => $allInvoices->pluck('offer_name')->unique()->filter()->values()->toArray(),
                'schools' => $allInvoices->pluck('student_school')->unique()->filter()->values()->toArray(),
            ];
            
            // Get recurring transactions for this teacher
            $recurringTransactions = collect();
            if ($teacherUser) {
                $recurringTransactions = \App\Models\Transaction::where('is_recurring', 1)
                    ->where('user_id', $teacherUser->id)
                    ->get();
            }
                
            // Log the relationship for debugging
            Log::info('Teacher-User relationship', [
                'teacher_id' => $teacher->id,
                'teacher_email' => $teacher->email,
                'user_found' => $teacherUser ? true : false,
                'user_id' => $teacherUser ? $teacherUser->id : null,
                'user_email' => $teacherUser ? $teacherUser->email : null
            ]);
                
            // Check if any recurring transactions have been paid this month
            $currentMonth = now()->format('Y-m');
            $startDate = \Carbon\Carbon::parse($currentMonth . '-01')->startOfMonth();
            $endDate = \Carbon\Carbon::parse($currentMonth . '-01')->endOfMonth();
            
            foreach ($recurringTransactions as $transaction) {
                // Check if a corresponding one-time transaction exists for this month
                $isPaidThisMonth = \App\Models\Transaction::where('is_recurring', 0)
                    ->where('description', 'like', '%(Recurring payment from #' . $transaction->id . ')%')
                    ->whereBetween('payment_date', [$startDate, $endDate])
                    ->exists();
                
                $transaction->paid_this_month = $isPaidThisMonth;
            }
            
            // Get all transactions (recurring and one-time) for this teacher
            $transactions = collect();
            if ($teacherUser) {
                $transactions = \App\Models\Transaction::where('user_id', $teacherUser->id)->get();
            }
            
            // Log transaction fetching results
            Log::info('Teacher transactions fetched', [
                'user_id' => $teacherUser ? $teacherUser->id : null,
                'transactions_count' => $transactions->count(),
                'transaction_user_ids' => $transactions->pluck('user_id')->unique()->toArray()
            ]);

            // Mark recurring transactions as paid_this_month if a corresponding one-time payment exists
            $currentMonth = now()->format('Y-m');
            $startDate = \Carbon\Carbon::parse($currentMonth . '-01')->startOfMonth();
            $endDate = \Carbon\Carbon::parse($currentMonth . '-01')->endOfMonth();

            foreach ($transactions as $transaction) {
                if ($transaction->is_recurring) {
                    $isPaidThisMonth = \App\Models\Transaction::where('is_recurring', 0)
                        ->where('description', 'like', '%(Recurring payment from #' . $transaction->id . ')%')
                        ->whereBetween('payment_date', [$startDate, $endDate])
                        ->exists();
                    $transaction->paid_this_month = $isPaidThisMonth;
                }
            }
            
            // Get the currently selected school from session
            $selectedSchool = null;
            $selectedSchoolId = session('school_id');
            $selectedSchoolName = session('school_name');
            
            if ($selectedSchoolId && $selectedSchoolName) {
                $selectedSchool = [
                    'id' => $selectedSchoolId,
                    'name' => $selectedSchoolName
                ];
            }
            
            return Inertia::render('Menu/SingleTeacherPage', [
                'teacher' => $teacherUser ? array_merge($teacher->toArray(), ['user_id' => $teacherUser->id, 'totalStudents' => $totalStudents]) : array_merge($teacher->toArray(), ['totalStudents' => $totalStudents]),
                'invoices' => $paginatedInvoices,
                'invoiceStats' => $stats, // Add calculated stats
                'schools' => $schools,
                'subjects' => $subjects,
                'classes' => $classes,
                'announcements' => $announcements,
                'filters' => [
                    'status' => $announcementStatus,
                    'invoice_filters' => $filters, // Add invoice filters
                ],
                'filterOptions' => $filterOptions, // Add filter options for dropdowns
                'userRole' => $userRole,
                'selectedSchool' => $selectedSchool, // Add the selected school
                'recurringTransactions' => $recurringTransactions, // Add the recurring transactions
                'transactions' => $transactions, // Add all transactions
            ]);
        } catch (\Exception $e) {
            Log::error('Error in TeacherController@show: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return redirect()->back()->with('error', 'Failed to load teacher details. Please try again.');
        }
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Teacher $teacher)
    {
        $subjects = Subject::all();
        $classes = Classes::all(); // ✅ Changed from 'groups' to 'classes'
        $schools = School::all();
        $teacherUser = User::where('email', $teacher->email)->first();
        return Inertia::render('Teachers/Edit', [
            'teacher' => $teacherUser ? array_merge($teacher->toArray(), ['user_id' => $teacherUser->id]) : $teacher,
            'subjects' => $subjects,
            'classes' => $classes, // ✅ Changed from 'groups' to 'classes'
            'schools' => $schools,
        ]);
    }

    public function update(Request $request, Teacher $teacher)
    {
        try {
            $currentSchoolId = session('school_id');
            $currentSchoolName = session('school_name');

            // Store the old email before updating
            $oldEmail = $teacher->email;

            // Validate input, but do not allow duplicate emails in users or teachers (except for this teacher/user)
            $validatedData = $request->validate([
                'first_name' => 'required|string|max:100',
                'last_name' => 'required|string|max:100',
                'address' => 'nullable|string|max:255',
                'phone_number' => 'nullable|string|max:20',
                'email' => [
                    'required',
                    'string',
                    'email',
                    'max:255',
                    // Unique in teachers, except for this teacher
                    'unique:teachers,email,' . $teacher->id,
                ],
                'status' => 'required|in:active,inactive',
                'wallet' => 'required|numeric|min:0',
                'profile_image' => 'nullable|image|mimes:jpg,jpeg,png|max:5120',
                'subjects' => 'array',
                'subjects.*' => 'exists:subjects,id',
                'classes' => 'array',
                'classes.*' => 'exists:classes,id',
                'schools' => 'array',
                'schools.*' => 'exists:schools,id',
            ]);

            // Check for duplicate email in users table (except for the user with the old email)
            $userWithEmail = User::where('email', $validatedData['email'])
                ->where('email', '!=', $oldEmail)
                ->first();
            $teacherWithEmail = Teacher::where('email', $validatedData['email'])
                ->where('id', '!=', $teacher->id)
                ->first();
            if ($userWithEmail || $teacherWithEmail) {
                return redirect()->back()
                    ->withErrors(['email' => 'Cette adresse e-mail est déjà utilisée par un autre utilisateur ou enseignant.'])
                    ->withInput();
            }

            // Handle profile image update
            if ($request->hasFile('profile_image')) {
                if ($teacher->profile_image) {
                    $publicId = $teacher->profile_image_public_id ?? null;
                    if ($publicId) {
                        $this->getCloudinary()->uploadApi()->destroy($publicId);
                    }
                }
                $uploadResult = $this->uploadToCloudinary($request->file('profile_image'));
                $validatedData['profile_image'] = $uploadResult['secure_url'];
            }

            event(new CheckEmailUnique($request->email, $teacher->id));

            // Update teacher attributes
            $teacher->update($validatedData);

            // Sync relationships
            $teacher->subjects()->sync($request->subjects ?? []);
            $teacher->classes()->sync($request->classes ?? []);
            $teacher->schools()->sync($request->schools ?? []);

            // Update the corresponding user (if exists)
            $user = User::where('email', $oldEmail)->first();
            if ($user) {
                $user->name = $validatedData['first_name'] . ' ' . $validatedData['last_name'];
                $user->email = $validatedData['email'];
                $user->save();
            }

            if ($currentSchoolId) {
                session([
                    'school_id' => $currentSchoolId,
                    'school_name' => $currentSchoolName
                ]);
            }

            $isFormUpdate = $request->has('is_form_update');
            if ($isFormUpdate) {
                return redirect()->route('teachers.show', $teacher->id)->with('success', 'Teacher updated successfully.');
            }
            $isViewingAs = session()->has('admin_user_id');
            if ($isViewingAs) {
                return redirect()->route('dashboard')->with('success', 'Teacher updated successfully.');
            } else {
                return redirect()->route('teachers.show', $teacher->id)->with('success', 'Teacher updated successfully.');
            }
        } catch (\Exception $e) {
            Log::error('Error updating teacher: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to update teacher. Please try again.');
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Teacher $teacher)
    {
        try {
            // Delete profile image from Cloudinary if exists
            if ($teacher->profile_image) {
                $publicId = $teacher->profile_image_public_id ?? null;
                if ($publicId) {
                    $this->getCloudinary()->uploadApi()->destroy($publicId);
                }
            }

            // Detach relationships
            $teacher->subjects()->detach();
            $teacher->classes()->detach();
            $teacher->schools()->detach();

            // Delete teacher
            $teacher->delete();

            return redirect()->route('teachers.index')->with('success', 'Teacher deleted successfully.');
        } catch (\Exception $e) {
            Log::error('Error deleting teacher: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to delete teacher. Please try again.');
        }
    }

    /**
     * Store both a user and a teacher in a single transaction.
     */
    public function storeWithUser(Request $request)
    {
        DB::beginTransaction();
        try {
            // Validate user data
            $userData = $request->validate([
                'user.name' => 'required|string|max:255',
                'user.email' => 'required|string|lowercase|email|max:255|unique:users,email',
                'user.password' => ['required', 'confirmed', Rules\Password::defaults()],
                'user.role' => 'required|in:admin,assistant,teacher',
            ]);

            // Validate teacher data
            $teacherData = $request->validate([
                'teacher.first_name' => 'required|string|max:100',
                'teacher.last_name' => 'required|string|max:100',
                'teacher.address' => 'nullable|string|max:255',
                'teacher.phone_number' => 'nullable|string|max:20',
                'teacher.email' => 'required|string|email|max:255|unique:teachers,email',
                'teacher.status' => 'required|in:active,inactive',
                'teacher.wallet' => 'required|numeric|min:0',
                'teacher.profile_image' => 'nullable|image|mimes:jpg,jpeg,png|max:5120',
                'teacher.schools' => 'array',
                'teacher.schools.*' => 'exists:schools,id',
                'teacher.subjects' => 'array',
                'teacher.subjects.*' => 'exists:subjects,id',
                'teacher.classes' => 'array',
                'teacher.classes.*' => 'exists:classes,id',
            ]);

            // Create user
            $user = User::create([
                'name' => $request->input('user.name'),
                'email' => $request->input('user.email'),
                'password' => Hash::make($request->input('user.password')),
                'role' => $request->input('user.role'),
            ]);

            // Handle teacher profile image
            $teacherDataArr = [
                'first_name' => $request->input('teacher.first_name'),
                'last_name' => $request->input('teacher.last_name'),
                'address' => $request->input('teacher.address'),
                'phone_number' => $request->input('teacher.phone_number'),
                'email' => $request->input('teacher.email'),
                'status' => $request->input('teacher.status'),
                'wallet' => $request->input('teacher.wallet'),
            ];

            if ($request->hasFile('teacher.profile_image')) {
                $uploadResult = $this->uploadToCloudinary($request->file('teacher.profile_image'));
                $teacherDataArr['profile_image'] = $uploadResult['secure_url'];
            }

            // Create teacher
            $teacher = Teacher::create($teacherDataArr);

            // Sync relationships
            $teacher->subjects()->sync($request->input('teacher.subjects', []));
            $teacher->classes()->sync($request->input('teacher.classes', []));
            $teacher->schools()->sync($request->input('teacher.schools', []));

            DB::commit();
            // Always redirect to teachers.index for Inertia
            return redirect()->route('teachers.index')->with('success', 'User and Teacher created successfully.');
        } catch (ValidationException $e) {
            DB::rollBack();
            $errors = $e->errors();
            $userErrors = [];
            $teacherErrors = [];
            foreach ($errors as $key => $val) {
                if (str_starts_with($key, 'user.')) $userErrors[$key] = $val;
                if (str_starts_with($key, 'teacher.')) $teacherErrors[$key] = $val;
            }
            // Only return JSON for true API requests
            if ($request->expectsJson() || $request->isXmlHttpRequest()) {
                return response()->json(['errors' => [
                    'user' => $userErrors,
                    'teacher' => $teacherErrors,
                ]], 422);
            } else {
                // For Inertia/browser, redirect back with errors
                return redirect()->back()
                    ->withErrors(['user' => $userErrors, 'teacher' => $teacherErrors])
                    ->withInput();
            }
        } catch (\Exception $e) {
            DB::rollBack();
            if ($request->expectsJson() || $request->isXmlHttpRequest()) {
                return response()->json(['error' => 'Failed to create user and teacher.'], 500);
            } else {
                return redirect()->back()->with('error', 'Failed to create user and teacher.');
            }
        }
    }

    /**
     * Calculate the best offer from invoices
     */
    private function calculateBestOffer($invoices)
    {
        $offerTotals = $invoices->groupBy('offer_name')->map(function ($group) {
            return $group->sum('teacher_amount');
        });

        if ($offerTotals->isEmpty()) {
            return ['name' => 'N/A', 'amount' => 0];
        }

        $bestOffer = $offerTotals->sortDesc()->first();
        $bestOfferName = $offerTotals->sortDesc()->keys()->first();

        return [
            'name' => $bestOfferName ?: 'N/A',
            'amount' => number_format($bestOffer, 2)
        ];
    }

    /**
     * Calculate current month amount
     */
    private function calculateCurrentMonthAmount($invoices)
    {
        $currentMonth = now()->format('Y-m');
        
        return $invoices->filter(function ($invoice) use ($currentMonth) {
            return strpos($invoice['billDate'], $currentMonth) === 0;
        })->sum('teacher_amount');
    }

    /**
     * Calculate pending months
     */
    private function calculatePendingMonths($invoices)
    {
        // This would need to be calculated based on your business logic
        // For now, returning a placeholder
        return 0;
    }
}