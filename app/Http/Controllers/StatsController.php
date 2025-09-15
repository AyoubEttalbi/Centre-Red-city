<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Teacher;
use App\Models\Assistant;
use App\Models\Invoice;
use App\Models\School;
use App\Models\Announcement;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use App\Models\Membership;
use App\Models\Transaction;
use App\Models\StudentMovement;
use App\Services\StudentMovementService;
use App\Services\MembershipStatsService;
use Illuminate\Support\Facades\Log;

class StatsController extends Controller
{
    /**
     * Helper method to format month names in French
     */
    private function formatMonthInFrench($month, $year)
    {
        $frenchMonths = [
            1 => 'Janvier',
            2 => 'Février',
            3 => 'Mars',
            4 => 'Avril',
            5 => 'Mai',
            6 => 'Juin',
            7 => 'Juillet',
            8 => 'Août',
            9 => 'Septembre',
            10 => 'Octobre',
            11 => 'Novembre',
            12 => 'Décembre'
        ];
        
        return $frenchMonths[$month] . ' ' . $year;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
{
    $schoolId = $request->get('school_id');
    if ($schoolId === 'all' || $schoolId === '' || $schoolId === null) {
        $schoolId = null;
    }
    $month = $request->get('month');
    $studentStatsMonth = $request->get('student_stats_month');
    $membershipStats = $this->getMembershipStats($month, $schoolId);

    // --- Combined Student Monthly Stats ---
    $selectedMonth = $studentStatsMonth ? Carbon::parse($studentStatsMonth) : Carbon::now();
    $monthYear = $selectedMonth->format('Y-m');
    
    // Use StudentMovementService to get stats from the movements table
    $movementService = new StudentMovementService();
    $studentMonthlyStats = $movementService->getMovementStats($monthYear, $schoolId);
    
    // Debug: Log the student monthly stats
    if (config('app.debug')) {
        Log::info('Student Monthly Stats (from movements):', [
            'month' => $monthYear,
            'school_id' => $schoolId,
            'inscribed' => $studentMonthlyStats['inscribed'],
            'abandoned' => $studentMonthlyStats['abandoned'],
        ]);
    }

    // --- Optimized Teacher Counts ---
    // Get all teacher counts per school in one query
    $teacherCounts = DB::table('school_teacher')
        ->select('school_id', DB::raw('COUNT(DISTINCT teacher_id) as count'))
        ->groupBy('school_id')
        ->get()
        ->keyBy('school_id');
    // Total teachers (all schools or filtered)
    $totalTeacherCount = $schoolId
        ? ($teacherCounts[$schoolId]->count ?? 0)
        : $teacherCounts->sum('count');

    // --- Optimized Student Counts ---
    // Get all student counts per school in one query
    $studentCounts = Student::select('schoolId', DB::raw('COUNT(*) as count'))
        ->groupBy('schoolId')
        ->get()
        ->keyBy('schoolId');
    $totalStudentCount = $schoolId
        ? ($studentCounts[$schoolId]->count ?? 0)
        : $studentCounts->sum('count');

    // --- Optimized Assistant Counts ---
    $assistantCounts = DB::table('assistant_school')
        ->select('school_id', DB::raw('COUNT(DISTINCT assistant_id) as count'))
        ->groupBy('school_id')
        ->get()
        ->keyBy('school_id');
    $totalAssistantCount = $schoolId
        ? ($assistantCounts[$schoolId]->count ?? 0)
        : $assistantCounts->sum('count');

    // Schools list
    $schoolsList = collect([
        (object)['id' => 'all', 'name' => 'Toutes les écoles']
    ])->concat(School::select('id', 'name')->get());

    // Monthly incomes and expenses
    $now = Carbon::now();
    $start = $now->copy()->subMonths(11)->startOfMonth();
    $end = $now->copy()->endOfMonth();

    $incomeQuery = DB::table('invoices')
        ->join('students', 'invoices.student_id', '=', 'students.id')
        ->select(
            DB::raw('YEAR(billDate) as year'),
            DB::raw('MONTH(billDate) as month'),
            'students.schoolId as school_id',
            DB::raw('SUM(amountPaid) as income')
        )
        ->whereNull('invoices.deleted_at')
        ->whereColumn('invoices.amountPaid', '>=', 'invoices.totalAmount')
        ->whereBetween('billDate', [$start, $end]);
    if ($schoolId) {
        $incomeQuery->where('students.schoolId', $schoolId);
    }
    $incomeQuery = $incomeQuery
        ->groupBy('year', 'month', 'students.schoolId')
        ->orderBy('year')
        ->orderBy('month')
        ->get();

    $expenseRaw = DB::table('transactions')
        ->whereBetween('payment_date', [$start, $end])
        ->get();
    $expenseRows = [];
    foreach ($expenseRaw as $tx) {
        if ($tx->type === 'payment') {
            $user = \App\Models\User::find($tx->user_id);
            if ($user && $user->role === 'teacher' && $user->teacher) {
                $schools = $user->teacher->schools()->pluck('schools.id');
                foreach ($schools as $sid) {
                    $expenseRows[] = [
                        'year' => (int)date('Y', strtotime($tx->payment_date)),
                        'month' => (int)date('m', strtotime($tx->payment_date)),
                        'school_id' => $sid,
                        'expense' => (float)$tx->amount
                    ];
                }
            }
        } elseif ($tx->type === 'salary') {
            $user = \App\Models\User::find($tx->user_id);
            if ($user && $user->role === 'assistant' && $user->assistant) {
                $schools = $user->assistant->schools()->pluck('schools.id');
                foreach ($schools as $sid) {
                    $expenseRows[] = [
                        'year' => (int)date('Y', strtotime($tx->payment_date)),
                        'month' => (int)date('m', strtotime($tx->payment_date)),
                        'school_id' => $sid,
                        'expense' => (float)$tx->amount
                    ];
                }
            }
        } elseif ($tx->type === 'expense') {
            $expenseRows[] = [
                'year' => (int)date('Y', strtotime($tx->payment_date)),
                'month' => (int)date('m', strtotime($tx->payment_date)),
                'school_id' => null,
                'expense' => (float)$tx->amount
            ];
        }
    }
    if ($schoolId) {
        $expenseRows = array_filter($expenseRows, function($row) use ($schoolId) {
            return $row['school_id'] == $schoolId;
        });
    }
    $expenseGrouped = [];
    foreach ($expenseRows as $row) {
        $key = $row['year'] . '-' . str_pad($row['month'], 2, '0', STR_PAD_LEFT) . '-' . ($row['school_id'] ?? 'none');
        if (!isset($expenseGrouped[$key])) {
            $expenseGrouped[$key] = [
                'year' => $row['year'],
                'month' => $row['month'],
                'school_id' => $row['school_id'],
                'expense' => 0
            ];
        }
        $expenseGrouped[$key]['expense'] += $row['expense'];
    }
    $merged = [];
    foreach ($incomeQuery as $item) {
        $key = $item->year . '-' . str_pad($item->month, 2, '0', STR_PAD_LEFT) . '-' . $item->school_id;
        $merged[$key] = [
            'name' => $this->formatMonthInFrench($item->month, $item->year),
            'income' => (float)$item->income,
            'expense' => 0,
            'school_id' => $item->school_id,
            'year' => $item->year,
            'month' => $item->month
        ];
    }
    foreach ($expenseGrouped as $key => $item) {
        if (!isset($merged[$key])) {
            $merged[$key] = [
                'name' => $this->formatMonthInFrench($item['month'], $item['year']),
                'income' => 0,
                'expense' => (float)$item['expense'],
                'school_id' => $item['school_id'],
                'year' => $item['year'],
                'month' => $item['month']
            ];
        } else {
            $merged[$key]['expense'] = (float)$item['expense'];
        }
    }
    $result = array_values($merged);

    // Most selling offers
    $mostSellingOffersQuery = DB::table('invoices')
        ->join('offers', 'invoices.offer_id', '=', 'offers.id')
        ->join('students', 'invoices.student_id', '=', 'students.id')
        ->select(
            'offers.id as offer_id',
            'offers.offer_name as name',
            DB::raw('COUNT(DISTINCT invoices.student_id) as student_count'),
            DB::raw('SUM(invoices.`totalAmount`) as total_price')
        )
        ->whereNull('invoices.deleted_at');
    if ($schoolId) {
        $mostSellingOffersQuery->where('students.schoolId', $schoolId);
        $mostSellingOffersQuery->addSelect('students.schoolId as school_id');
        $mostSellingOffersQuery->groupBy('offers.id', 'offers.offer_name', 'students.schoolId');
    } else {
        $mostSellingOffersQuery->groupBy('offers.id', 'offers.offer_name');
    }
    $mostSellingOffers = $mostSellingOffersQuery
        ->orderByDesc('student_count')
        ->limit(5)
        ->get();

    // Announcements
    $status = $request->query('status', 'all');
    $query = Announcement::query();
    $now = Carbon::now();
    if ($status === 'active') {
        $query->where(function($q) use ($now) {
            $q->where(function($q) use ($now) {
                $q->whereNull('date_start')
                  ->orWhere('date_start', '<=', $now);
            })->where(function($q) use ($now) {
                $q->whereNull('date_end')
                  ->orWhere('date_end', '>=', $now);
            });
        });
    } elseif ($status === 'upcoming') {
        $query->where('date_start', '>', $now);
    } elseif ($status === 'expired') {
        $query->where('date_end', '<', $now);
    }
    $userRole = Auth::user() ? Auth::user()->role : null;
    if ($userRole === 'admin') {
        // Admin sees all announcements
    } else {
        $query->where(function($q) use ($userRole) {
            $q->where('visibility', 'all')
              ->orWhere('visibility', $userRole);
        });
    }
    $query->orderBy('date_announcement', 'desc');
    $announcements = $query->get();

    return Inertia::render('Dashboard', [
        'teacherCounts' => $teacherCounts,
        'totalTeacherCount' => $totalTeacherCount,
        'studentCounts' => $studentCounts,
        'totalStudentCount' => $totalStudentCount,
        'assistantCounts' => $assistantCounts,
        'totalAssistantCount' => $totalAssistantCount,
        'schools' => $schoolsList,
        'monthlyIncomes' => $result,
        'mostSellingOffers' => $mostSellingOffers,
        'announcements' => $announcements,
        'filters' => [
            'status' => $status,
        ],
        'userRole' => $userRole,
        'membershipStats' => $membershipStats,
        'selectedSchoolId' => $schoolId,
        'studentMonthlyStats' => $studentMonthlyStats,
    ]);
}

    private function getMembershipStats($month = null, $schoolId = null)
    {
        try {
            $date = $month ? Carbon::parse($month) : Carbon::now();
            $year = $date->year;
            $monthNum = $date->month;
            
            // Debug logging
            if (config('app.debug')) {
                Log::info('Getting membership stats:', [
                    'requested_month' => $month,
                    'parsed_year' => $year,
                    'parsed_month' => $monthNum,
                    'school_id' => $schoolId
                ]);
            }
            
            // Use the new service to get or create stats
            $membershipStatsService = new MembershipStatsService();
            $stats = $membershipStatsService->getOrCreateMonthlyStats($schoolId, $year, $monthNum);
            
            // Debug logging
            if (config('app.debug')) {
                Log::info('Membership stats result:', [
                    'paid_count' => $stats->paid_count,
                    'unpaid_count' => $stats->unpaid_count,
                    'total_memberships' => $stats->total_memberships
                ]);
            }
            
            return [
                'paidCount' => $stats->paid_count,
                'unpaidCount' => $stats->unpaid_count,
                'month' => $date->format('Y-m')
            ];
        } catch (\Exception $e) {
            Log::error('Error fetching membership stats: ' . $e->getMessage());
            return [
                'error' => 'Error fetching stats: ' . $e->getMessage(),
                'paidCount' => 0,
                'unpaidCount' => 0,
                'month' => $date->format('Y-m')
            ];
        }
    }

public function getStatsOfPaidUnpaid(Request $request)
{
    // Accept date range and school_id from request
    $startDate = $request->input('start_date') ?? now()->subYear()->startOfYear()->toDateString();
    $endDate = $request->input('end_date') ?? now()->endOfMonth()->toDateString();
    $schoolId = $request->input('school_id');

    // Query memberships in range, filter by school if provided
    $query = DB::table('memberships')
        ->join('students', 'memberships.student_id', '=', 'students.id')
        ->select(
            DB::raw('YEAR(memberships.start_date) as year'),
            DB::raw('MONTH(memberships.start_date) as month'),
            'students.schoolId as school_id',
            DB::raw('SUM(CASE WHEN memberships.payment_status = "paid" THEN 1 ELSE 0 END) as paid_count'),
            DB::raw('SUM(CASE WHEN memberships.payment_status != "paid" THEN 1 ELSE 0 END) as unpaid_count')
        )
        ->whereNull('memberships.deleted_at')
        ->whereBetween('memberships.start_date', [$startDate, $endDate]);
    if ($schoolId && $schoolId !== 'all') {
        $query->where('students.schoolId', $schoolId);
    }
    $rows = $query->groupBy('year', 'month', 'students.schoolId')
        ->orderBy('year')
        ->orderBy('month')
        ->get();

    // Format for chart
    $result = $rows->map(function($row) {
        return [
            'name' => $this->formatMonthInFrench($row->month, $row->year),
            'paid' => (int)$row->paid_count,
            'unpaid' => (int)$row->unpaid_count,
            'school_id' => $row->school_id,
            'year' => $row->year,
            'month' => $row->month
        ];
    });

    return response()->json($result);
}

public function getFinanceStats(Request $request)
{
    $startDate = $request->input('start_date') ?? now()->subYear()->startOfYear()->toDateString();
    $endDate = $request->input('end_date') ?? now()->endOfMonth()->toDateString();
    $schoolId = $request->input('school_id');

    // Income: sum amountPaid from invoices, grouped by month
    $incomeQuery = DB::table('invoices')
        ->join('students', 'invoices.student_id', '=', 'students.id')
        ->select(
            DB::raw('YEAR(billDate) as year'),
            DB::raw('MONTH(billDate) as month'),
            'students.schoolId as school_id',
            DB::raw('SUM(amountPaid) as income')
        )
        ->whereNull('invoices.deleted_at')
        ->whereColumn('invoices.amountPaid', '>=', 'invoices.totalAmount')
        ->whereBetween('billDate', [$startDate, $endDate]);
    if ($schoolId && $schoolId !== 'all') {
        $incomeQuery->where('students.schoolId', $schoolId);
    }
    $incomeRows = $incomeQuery
        ->groupBy('year', 'month', 'students.schoolId')
        ->orderBy('year')
        ->orderBy('month')
        ->get();

    // Expense: sum amount from transactions, grouped by month
    $expenseQuery = DB::table('transactions')
        ->select(
            DB::raw('YEAR(payment_date) as year'),
            DB::raw('MONTH(payment_date) as month'),
            DB::raw('SUM(amount) as expense')
        )
        ->whereBetween('payment_date', [$startDate, $endDate]);
    // If you want to filter expenses by school, add logic here (if possible)
    $expenseRows = $expenseQuery
        ->groupBy('year', 'month')
        ->orderBy('year')
        ->orderBy('month')
        ->get();

    // Merge income and expense by year/month
    $merged = [];
    foreach ($incomeRows as $row) {
        $key = $row->year . '-' . str_pad($row->month, 2, '0', STR_PAD_LEFT);
        $merged[$key] = [
            'name' => $this->formatMonthInFrench($row->month, $row->year),
            'income' => (float)$row->income,
            'expense' => 0,
            'year' => $row->year,
            'month' => $row->month
        ];
    }
    foreach ($expenseRows as $row) {
        $key = $row->year . '-' . str_pad($row->month, 2, '0', STR_PAD_LEFT);
        if (!isset($merged[$key])) {
            $merged[$key] = [
                'name' => $this->formatMonthInFrench($row->month, $row->year),
                'income' => 0,
                'expense' => (float)$row->expense,
                'year' => $row->year,
                'month' => $row->month
            ];
        } else {
            $merged[$key]['expense'] = (float)$row->expense;
        }
    }
    $result = array_values($merged);
    usort($result, function($a, $b) {
        return ($a['year'] <=> $b['year']) ?: ($a['month'] <=> $b['month']);
    });

    return response()->json($result);
}

}