

<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
// Controllers
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\AssistantController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\ClassesController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\LevelController;
use App\Http\Controllers\MembershipController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\OfferController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ResultsController;
use App\Http\Controllers\SchoolController;
use App\Http\Controllers\SchoolYearController;
use App\Http\Controllers\StatsController;
use App\Http\Controllers\StudentsController;
use App\Http\Controllers\SubjectController;
use App\Http\Controllers\TeacherController;
use App\Http\Controllers\TeacherClassController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CashierController;
use App\Http\Controllers\PerformanceController;
use App\Http\Controllers\AbsenceController;
use App\Http\Controllers\TeacherMembershipPaymentController;

// Middleware
use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\CheckImpersonation;
use App\Http\Middleware\RoleRedirect;
use App\Http\Middleware\CanViewTeacherProfile;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// Redirect to dashboard if authenticated, otherwise to login
Route::get('/', function () {
    return Auth::check() ? redirect('/dashboard') : redirect('/login');
});
Route::middleware('auth')->group(function () {
    // Dashboard route with RoleRedirect middleware
    Route::get('/dashboard', [StatsController::class, 'index'])
        ->middleware(RoleRedirect::class)
        ->name('dashboard');

    // Membership stats route
    Route::get('/stats/membership/{month?}', [StatsController::class, 'getStatsOfPaidUnpaid'])
        ->name('membership.stats')
        ->where('month', '[0-9]{4}-[0-9]{2}');

    // Profile routes
    Route::controller(ProfileController::class)->group(function () {
        Route::get('/profile', 'edit')->name('profile.edit');
        Route::patch('/profile', 'update')->name('profile.update');
        Route::delete('/profile', 'destroy')->name('profile.destroy');
        Route::get('/select-profile', 'select')->name('profiles.select');
        Route::post('/select-profile', 'store')->name('profiles.store');
    });

    // Main resource routes - accessible by all authenticated users based on Menu.jsx
    Route::get('/classes', [ClassesController::class, 'index'])->name('classes.index');
    Route::get('/classes/{class}', [ClassesController::class, 'show'])->name('classes.show');
    Route::get('/students', [StudentsController::class, 'index'])->name('students.index');
    Route::get('/students/{student}', [StudentsController::class, 'show'])->name('students.show');
    Route::get('/students/{student}/download-pdf', [StudentsController::class, 'downloadPdf'])->name('students.downloadPdf');
    Route::get('/teachers', [TeacherController::class, 'index'])->middleware(CanViewTeacherProfile::class)->name('teachers.index');
    Route::get('/teachers/{teacher}', [TeacherController::class, 'show'])
        ->middleware(CanViewTeacherProfile::class)
        ->name('teachers.show');
    Route::get('/schools/{school}', [SchoolController::class, 'show'])->name('schools.show');
    Route::get('/results', [ResultsController::class, 'index'])->name('results.index');
    Route::get('/attendances', [AttendanceController::class, 'index'])->name('attendances.index');
    
    // Methods that need authentication but aren't specific to admin
    Route::resources([
        'students' => StudentsController::class,
        'invoices' => InvoiceController::class,
        'memberships' => MembershipController::class,
        'results' => ResultsController::class,
        'attendances' => AttendanceController::class,
        'schools' => SchoolController::class,
    ], ['except' => ['show', 'index']]);
    
    // Attendance stats route
    Route::get('/attendance/stats', [AttendanceController::class, 'getStats'])->name('attendance.stats');
    
    // Student promotion management routes - accessible to all authenticated users
    Route::get('/schoolyear/setup-promotions', [SchoolYearController::class, 'setupPromotions'])
        ->name('schoolyear.setup-promotions');
    Route::post('/schoolyear/setup-promotions', [SchoolYearController::class, 'setupPromotions']);
    Route::post('/schoolyear/update-promotion', [SchoolYearController::class, 'updatePromotion'])
        ->name('schoolyear.update-promotion');

    // Resource routes specific to admin users (create, edit, store, update, destroy)
    Route::middleware(AdminMiddleware::class)->group(function () {
        // Classes routes
        Route::post('/classes', [ClassesController::class, 'store'])->name('classes.store');
        Route::get('/classes/create', [ClassesController::class, 'create'])->name('classes.create');
        Route::get('/classes/{class}/edit', [ClassesController::class, 'edit'])->name('classes.edit');
        Route::put('/classes/{class}', [ClassesController::class, 'update'])->name('classes.update');
        Route::delete('/classes/{class}', [ClassesController::class, 'destroy'])->name('classes.destroy');
        
        // Teachers routes
        Route::get('/teachers/create', [TeacherController::class, 'create'])->name('teachers.create');
        Route::post('/teachers', [TeacherController::class, 'store'])->name('teachers.store');
        Route::get('/teachers/{teacher}/edit', [TeacherController::class, 'edit'])->name('teachers.edit');
        Route::put('/teachers/{teacher}', [TeacherController::class, 'update'])->name('teachers.update');
        Route::patch('/teachers/{teacher}', [TeacherController::class, 'update']);
        Route::delete('/teachers/{teacher}', [TeacherController::class, 'destroy'])->name('teachers.destroy');
    });

    // Invoice specific routes
    Route::controller(InvoiceController::class)->prefix('invoices')->group(function () {
        Route::get('/{id}/pdf', 'generateInvoicePdf')->name('invoices.pdf');
        Route::get('/{id}/download', 'download')->name('invoices.download');
        Route::post('/bulk-download', 'bulkDownload')->name('invoices.bulk.download');
    });
    
    // Teacher invoices bulk download route
    Route::post('/teacher-invoices/bulk-download', [InvoiceController::class, 'teacherBulkDownload'])->name('teacher-invoices.bulk-download');
    
    // Direct PDF download route (GET request, no CSRF needed)
    Route::get('/teacher-invoices/download-pdf', [InvoiceController::class, 'teacherBulkDownload'])
        ->name('teacher-invoices.download-pdf');
    // Custom route for deleting an invoice from the student context
    Route::delete('/students/invoices/{id}', [InvoiceController::class, 'destroy'])->name('students.invoices.destroy');
    
    // Results API routes
    Route::controller(ResultsController::class)->prefix('results')->group(function () {
        Route::get('/classes-by-teacher/{teacher_id}', 'getClassesByTeacher')->name('results.classes-by-teacher');
        Route::get('/students-by-class/{class_id}', 'getStudentsByClass')->name('results.students-by-class');
        Route::get('/by-class/{class_id}', 'getResultsByClass')->name('results.by-class');
        Route::get('/calculate-grade', 'calculateGrade')->name('results.calculate-grade');
        Route::post('/update-grade', 'updateGrade')->name('results.update-grade');
        Route::get('/subjects-by-teacher/{teacher_id}/{class_id?}', 'getSubjectsByTeacher')->name('results.subjects-by-teacher');
    });

    // Class specific routes
    Route::controller(ClassesController::class)->prefix('classes')->group(function () {
        Route::delete('/students/{student}', 'removeStudent')->name('classes.removeStudent');
        Route::get('/fix-counts', 'fixAllClassCounts')->name('classes.fix-counts');
    });
    
    // Message routes
    Route::controller(MessageController::class)->group(function () {
        Route::get('/inbox', 'inbox')->name('inbox');
        Route::post('/message/{user}', 'store')->name('message.store');
        Route::get('/message/{user}', 'show')->name('message.show');
        Route::post('/message/{user}/read', 'markAsRead');
        Route::get('/unread-count', 'unreadCount');
        Route::get('/messages/last-messages', 'getLastMessages');
    });

    // Individual resource view routes - based on Menu.jsx visibility
    // Teachers, Students: accessible by admin, teacher, assistant
    // Assistants: index route is admin-only, but view route accessible by all authenticated users
    Route::get('/assistants/{assistant}', [AssistantController::class, 'show'])->name('assistants.show');
    Route::get('/assistants/{assistant}/student-payments', [AssistantController::class, 'studentPayments'])->name('assistants.student-payments');

    // Announcements view all - accessible by all authenticated users
    Route::get('/ViewAllAnnouncements', [AnnouncementController::class, 'viewAllAnnouncements'])
    ->name('ViewAllAnnouncements');
    
    // Mark all announcements as read
    Route::post('/announcements/mark-all-read', [AnnouncementController::class, 'markAllRead'])->name('announcements.markAllRead');
    
    // ADMIN ONLY routes based on Menu.jsx
    Route::middleware(AdminMiddleware::class)->group(function () {
        // Admin-only index routes based on Menu.jsx visibility
        Route::get('/assistants', [AssistantController::class, 'index'])->name('assistants.index');
        Route::get('/offers', [OfferController::class, 'index'])->name('offers.index');
        Route::get('/transactions', [TransactionController::class, 'index'])->name('transactions.index');
        Route::get('/announcements', [AnnouncementController::class, 'index'])->name('announcements.index');
        Route::get('/othersettings', [LevelController::class, 'index'])->name('othersettings.index');
        
        // Teacher-Class management routes - security is handled in the controller
        Route::controller(TeacherClassController::class)->prefix('teacher-classes')->group(function () {
            Route::get('/', 'index')->name('teacher-classes.index');
            Route::get('/create', 'create')->name('teacher-classes.create');
            Route::post('/', 'store')->name('teacher-classes.store');
            Route::post('/bulk-assign', 'bulkAssign')->name('teacher-classes.bulk-assign');
            Route::post('/remove/{teacher_id}/{class_id}', 'removeTeacherFromClass')->name('teacher-classes.remove');
            Route::get('/classes-by-teacher/{teacherId}', 'getClassesByTeacher')->name('teacher-classes.classes-by-teacher');
            Route::get('/teachers-by-class/{classId}', 'getTeachersByClass')->name('teacher-classes.teachers-by-class');
        });
        
        // Admin resource methods (create, store, update, destroy)
        Route::resource('assistants', AssistantController::class, ['except' => ['show', 'index']]);
        Route::resource('offers', OfferController::class, ['except' => ['index']]);
        Route::resource('transactions', TransactionController::class, ['except' => ['index']]);
        Route::resource('announcements', AnnouncementController::class, ['except' => ['index']]);
        
        // Transaction routes - admin only
        Route::controller(TransactionController::class)->group(function () {
            Route::get('/batch-payment', 'batchPaymentForm')->name('transactions.batch-payment-form');
            Route::post('/batch-payment', 'batchPayEmployees')->name('transactions.batch-pay');
            Route::get('/recurring-transactions', 'showRecurringTransactions')->name('transactions.recurring');
            Route::get('/recurring-transactions/filter', 'recurringTransactions')->name('transactions.recurring.filter');
            Route::post('/recurring-transactions/process/{id}', 'processSingleRecurringTransaction')->name('transactions.process-single-recurring');
            Route::post('/recurring-transactions/process-selected', 'processSelectedRecurringTransactions')->name('transactions.process-selected-recurring');
            Route::post('/recurring-transactions/process-all', 'processAllRecurringTransactions')->name('transactions.process-all-recurring');
            Route::post('/recurring-transactions/process-month', 'processMonthRecurringTransactions')->name('transactions.process-month-recurring');
            Route::get('/employee-transactions/{employee}', 'employeeTransactions')->name('employee.transactions');
            Route::get('/employees/{employee}/transactions', 'transactions')->name('employees.transactions');
            Route::get('/admin-earnings-dashboard', 'getAdminEarningsDashboard')->name('admin.earnings.dashboard');
            Route::get('/filtered-monthly-stats', 'getFilteredMonthlyStats')->name('admin.filtered.monthly.stats');
            Route::get('/filtered-employee-data', 'getFilteredEmployeeData')->name('admin.filtered.employee.data');
        });

        // Payments page
        Route::get('/payments', function () {
            return Inertia::render('Menu/PaymentsPage');
        });

        // Other settings routes - admin only
        Route::prefix('othersettings')->group(function () {
            // Main othersettings routes
            Route::get('/', [LevelController::class, 'index'])->name('othersettings.index');
            Route::get('/levels', [LevelController::class, 'index'])->name('othersettings.levels');
            Route::get('/subjects', [SubjectController::class, 'index'])->name('othersettings.subjects');
            Route::get('/schools', [SchoolController::class, 'index'])->name('othersettings.schools');
            
            // School year transition route
            Route::post('/schoolyear/transition', [SchoolYearController::class, 'transition'])
                ->name('schoolyear.transition');
                
            // Level routes
            Route::controller(LevelController::class)->group(function () {
                Route::post('/levels', 'store')->name('othersettings.levels.store');
                Route::put('/levels/{level}', 'update')->name('othersettings.levels.update');
                Route::delete('/levels/{level}', 'destroy')->name('othersettings.levels.destroy');
            });
            
            // Subject routes
            Route::controller(SubjectController::class)->group(function () {
                Route::post('/subjects', 'store')->name('othersettings.subjects.store');
                Route::put('/subjects/{subject}', 'update')->name('othersettings.subjects.update');
                Route::delete('/subjects/{subject}', 'destroy')->name('othersettings.subjects.destroy');
            });
            
            // School settings routes
            Route::controller(SchoolController::class)->group(function () {
                Route::post('/schools', 'store')->name('othersettings.schools.store');
                Route::put('/schools/{school}', 'update')->name('othersettings.schools.update');
                Route::delete('/schools/{school}', 'destroy')->name('othersettings.schools.destroy');
            });
        });
        
        // Setting route - admin only
        Route::get('/setting', [RegisteredUserController::class, 'show'])->name('register');
        Route::post('/setting', [RegisteredUserController::class, 'store'])->name('register.store');
        Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');

        // Add after other teacher routes, inside the admin middleware group if possible
        Route::post('/teachers-with-user', [TeacherController::class, 'storeWithUser'])->name('teachers.storeWithUser');
        Route::post('/assistants-with-user', [AssistantController::class, 'storeWithUser'])->name('assistants.storeWithUser');
        
        // Teacher Membership Payments (API routes for testing)
        Route::prefix('api/teacher-payments')->group(function () {
            Route::get('/', [TeacherMembershipPaymentController::class, 'index'])->name('teacher-payments.index');
            Route::get('/{id}', [TeacherMembershipPaymentController::class, 'show'])->name('teacher-payments.show');
            Route::post('/process-monthly', [TeacherMembershipPaymentController::class, 'processMonthlyPayments'])->name('teacher-payments.process-monthly');
            Route::get('/earnings-summary', [TeacherMembershipPaymentController::class, 'earningsSummary'])->name('teacher-payments.earnings-summary');
            Route::get('/pending-payments', [TeacherMembershipPaymentController::class, 'pendingPayments'])->name('teacher-payments.pending');
            Route::post('/test-deletion', [TeacherMembershipPaymentController::class, 'testInvoiceDeletion'])->name('teacher-payments.test-deletion');
        });
    });

    // Performance routes
    Route::get('/students/{student}/performance', [PerformanceController::class, 'show'])
        ->name('performance.student')
        ->middleware('auth');

    // New route for UserController@index
    Route::get('/users', [\App\Http\Controllers\UserController::class, 'index'])->name('users.index');

    // Absence Log routes (admin and assistant only)
    Route::get('/absence-log', [AttendanceController::class, 'absenceLogPage'])->name('absence.log.page');
    Route::get('/api/absence-log', [AttendanceController::class, 'absenceLogData'])->name('absence.log.data');
    Route::post('/absence/{student}/notify', [AttendanceController::class, 'notifyParent'])->name('absence.notify');

    // Absence List page (frontend selection)
    Route::get('/absence-list', [AttendanceController::class, 'absenceListPage'])->name('absence-list')->middleware('auth');
    // Absence List PDF download (GET, not POST)
    Route::get('/absence-list/download', [AttendanceController::class, 'downloadAbsenceList'])->name('absence-list.download')->middleware('auth');
});
// Route::get('/cashier/daily', [CashierController::class, 'daily'])->name('cashier.daily');
// Route::post('/cashier/daily', [CashierController::class, 'daily']); // For filtering
// Data route
Route::get('/cashier/daily', function (\Illuminate\Http\Request $request) {
    $user = Auth::user();
    if ($user && $user->role === 'teacher') {
        return redirect('/dashboard')->with('error', 'Accès refusé.');
    }
    return app(CashierController::class)->daily($request);
})->name('cashier.daily');

// Redirect /cashier to today's view
Route::get('/cashier', function () {
    $user = Auth::user();
    if ($user && $user->role === 'teacher') {
        return redirect('/dashboard')->with('error', 'Accès refusé.');
    }
    $today = Carbon::today()->toDateString();
    return redirect()->route('cashier.daily', ['date' => $today]);
})->name('cashier');
    
// Custom route for deleting invoices from the student context (must be outside local-only block)
Route::delete('/students/invoices/{id}', [InvoiceController::class, 'destroy']);

// Authentication routes
require __DIR__ . '/auth.php';

// For debugging/development only - should be removed in production
if (app()->environment('local')) {
Route::get('/debug-assistant/{id}', function($id) {
    $assistant = App\Models\Assistant::with('schools')->find($id);
    
    if (!$assistant) {
        return response()->json(['error' => 'Assistant not found'], 404);
    }
    
    $schoolIds = $assistant->schools->pluck('id')->toArray();
    $today = \Carbon\Carbon::now();
    
    // Recent absences
    $recentAbsences = \App\Models\Attendance::with(['student', 'class'])
        ->whereIn('status', ['absent', 'late'])
        ->where(function($query) use ($schoolIds) {
            $query->whereHas('class', function($classQuery) use ($schoolIds) {
                $classQuery->whereIn('school_id', $schoolIds);
            });
            
            $query->orWhereHas('student', function($studentQuery) use ($schoolIds) {
                $studentQuery->whereIn('schoolId', $schoolIds);
            });
        })
        ->where('date', '>=', $today->copy()->subDays(7))
        ->orderBy('date', 'desc')
        ->limit(10)
        ->get();
    
    return response()->json([
        'assistant' => $assistant->only(['id', 'first_name', 'last_name', 'email']),
        'schools' => $schoolIds,
        'recent_absences' => $recentAbsences->map(function($attendance) {
            return [
                'id' => $attendance->id,
                'student_id' => $attendance->student ? $attendance->student->id : null,
                'student_name' => $attendance->student ? $attendance->student->firstName . ' ' . $attendance->student->lastName : 'Unknown',
                'class_name' => $attendance->class ? $attendance->class->name : 'Unknown',
                'date' => $attendance->date,
                'status' => $attendance->status,
                'reason' => $attendance->reason
            ];
        })
    ]);
});
}

// TEMPORARY: Debug route to inspect session contents
Route::get('/debug-session', function () {
    return response()->json(session()->all());
});

// Debug route for mobile authentication testing
Route::get('/debug-mobile-auth', function (Request $request) {
    $user = auth()->user();
    return response()->json([
        'authenticated' => auth()->check(),
        'user' => $user ? [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role
        ] : null,
        'session_id' => $request->session()->getId(),
        'user_agent' => $request->header('User-Agent'),
        'is_mobile' => strpos($request->header('User-Agent'), 'Mobile') !== false,
        'ip' => $request->ip(),
        'cookies' => $request->cookies->all(),
        'session_data' => $request->session()->all()
    ]);
});

// Admin impersonation routes (available in all environments, protected)
Route::middleware(['auth', AdminMiddleware::class])->group(function () {
    Route::post('/admin/view-as/{user}', [AdminController::class, 'viewAs'])->name('admin.view-as');
    Route::post('/admin/switch-back', [AdminController::class, 'switchBack'])->middleware(CheckImpersonation::class)->name('admin.switch-back');
});
// Debug invoice data
Route::get('/debug-invoice-data', [App\Http\Controllers\TransactionController::class, 'debugInvoiceData'])
    ->name('debug.invoice.data');

// TEMP: Direct GET route for switch back (for debugging only)
// Restore real switch-back route
Route::post('/admin/switch-back', [App\Http\Controllers\AdminController::class, 'switchBack'])->middleware(App\Http\Middleware\CheckImpersonation::class)->name('admin.switch-back');

// API route for fetching invoice details as JSON
Route::middleware('auth')->get('/api/invoices/{id}', [App\Http\Controllers\InvoiceController::class, 'apiShow']);

// API route for fetching upcoming announcements
Route::middleware('auth')->get('/api/upcoming-announcements', function () {
    $user = auth()->user();
    $userRole = $user ? $user->role : null;
    $now = now();
    $query = \App\Models\Announcement::query();
    $query->where('date_announcement', '>', $now);
    if ($userRole !== 'admin') {
        $query->where(function($q) use ($userRole) {
            $q->where('visibility', 'all')
              ->orWhere('visibility', $userRole);
        });
    }
    $query->orderBy('date_announcement');
    $announcements = $query->get();
    return response()->json(['announcements' => $announcements]);
});

// API: Teacher earnings per month (paid only)
Route::middleware('auth')->get('/teacher-earnings-report', [TransactionController::class, 'teacherMonthlyEarningsReport']);

// API: Teacher invoice breakdown for a given month
Route::middleware('auth')->get('/teacher-invoice-breakdown', [TransactionController::class, 'teacherInvoiceBreakdown']);

// Route to fetch all schools as JSON for filters (for frontend dropdowns)
Route::middleware('auth')->get('/schoolsForFilters', [SchoolController::class, 'listJson']);

// Route to fetch all classes as JSON for filters (for frontend dropdowns)
Route::middleware('auth')->get('/classesForFilters', [ClassesController::class, 'listJson']);

// Global fallback route: redirect any not found route to dashboard
Route::fallback(function () {
    return redirect('/dashboard');
});