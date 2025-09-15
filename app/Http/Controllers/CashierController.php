<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Invoice;
use App\Models\Student;
use App\Models\User;
use App\Models\Offer;
use App\Models\Assistant;
use App\Models\Membership;
use App\Models\School;
use Carbon\Carbon;
use Inertia\Inertia;

class CashierController extends Controller
{
    // Fetch daily statistics for the cashier page
    public function daily(Request $request)
    {
        // Use today's date if no date is provided
$date = $request->input('date');
if (empty($date)) {
    $date = Carbon::today()->toDateString();
}
    

        $user = auth()->user();
        $isAssistant = $user && $user->role === 'assistant';
        $assistantSchoolIds = [];
        if ($isAssistant) {
            $assistant = Assistant::where('email', $user->email)->first();
            if ($assistant) {
                $assistantSchoolIds = $assistant->schools()->pluck('schools.id')->toArray();
            }
        }

        $query = Invoice::with(['student', 'creator', 'membership' => function($membershipQuery) {
                $membershipQuery->withTrashed()->with('offer');
            }])
            ->whereDate('created_at', $date)
            ->where('amountPaid', '>', 0);

        // If assistant, filter invoices by related schools
        if ($isAssistant && count($assistantSchoolIds) > 0) {
            $query->whereHas('student', function ($studentQuery) use ($assistantSchoolIds) {
                $studentQuery->whereIn('schoolId', $assistantSchoolIds);
            });
        }

        // Optional: filter by membership, student, creator, school, or offer
        if ($request->filled('membership_id')) {
            $query->where('membership_id', $request->membership_id);
        }

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        if ($request->filled('creator_id')) {
            $query->where('created_by', $request->creator_id);
        }

        // School filter: filter invoices by the schoolId of the related student
        if ($request->filled('school_id')) {
            $query->whereHas('student', function ($studentQuery) use ($request) {
                $studentQuery->where('schoolId', $request->school_id);
            });
        }

        // Offer filter: filter invoices by the offer_id of the related membership
        if ($request->filled('offer_id')) {
            $query->whereHas('membership', function ($membershipQuery) use ($request) {
                $membershipQuery->withTrashed()->where('offer_id', $request->offer_id);
            });
        }

        // Get all filtered invoices for statistics calculation (before pagination)
        $allFilteredInvoices = $query->get();
        
        // Calculate statistics from all filtered invoices
        $totalPaid = $allFilteredInvoices->sum('amountPaid');
        $totalInvoices = $allFilteredInvoices->count();
        $averagePayment = $totalInvoices > 0 ? $totalPaid / $totalInvoices : 0;
        
        // Find peak hour from all filtered invoices
        $hourlyData = $allFilteredInvoices->groupBy(function ($invoice) {
            return $invoice->created_at->format('H');
        })->map(function ($invoices, $hour) {
            return [
                'hour' => (int) $hour,
                'total' => $invoices->sum('amountPaid')
            ];
        });
        $peakHour = $hourlyData->sortByDesc('total')->first() ?? ['hour' => 0, 'total' => 0];
        
        // Calculate previous day total for trend comparison
        $previousDate = Carbon::parse($date)->subDay()->toDateString();
        $previousDayQuery = Invoice::whereDate('created_at', $previousDate)
            ->where('amountPaid', '>', 0);
        
        // Apply same filters to previous day query
        if ($isAssistant && count($assistantSchoolIds) > 0) {
            $previousDayQuery->whereHas('student', function ($studentQuery) use ($assistantSchoolIds) {
                $studentQuery->whereIn('schoolId', $assistantSchoolIds);
            });
        }
        if ($request->filled('membership_id')) {
            $previousDayQuery->where('membership_id', $request->membership_id);
        }
        if ($request->filled('student_id')) {
            $previousDayQuery->where('student_id', $request->student_id);
        }
        if ($request->filled('creator_id')) {
            $previousDayQuery->where('created_by', $request->creator_id);
        }
        if ($request->filled('school_id')) {
            $previousDayQuery->whereHas('student', function ($studentQuery) use ($request) {
                $studentQuery->where('schoolId', $request->school_id);
            });
        }
        if ($request->filled('offer_id')) {
            $previousDayQuery->whereHas('membership', function ($membershipQuery) use ($request) {
                $membershipQuery->withTrashed()->where('offer_id', $request->offer_id);
            });
        }
        $previousDayTotal = $previousDayQuery->sum('amountPaid');

        // Now paginate the results for display
        $invoices = $query->orderBy('created_at', 'desc')->paginate(20);

        // For chart: group by hour and sum amountPaid (using the same filtered data)
        $chartData = $hourlyData->sortBy('hour')->values()->map(function ($item) {
            return [
                'hour' => $item['hour'],
                'total' => (float) $item['total'],
                'label' => sprintf('%02d:00', $item['hour'])
            ];
        });

        // For filters: get all memberships with their offers (including deleted ones)
        $membershipsQuery = Membership::withTrashed()->with('offer')->whereHas('offer');
        $studentsQuery = Student::select('id', 'firstName', 'lastName');
        $schoolsQuery = School::select('id', 'name');
        if ($isAssistant && count($assistantSchoolIds) > 0) {
            $studentsQuery->whereIn('schoolId', $assistantSchoolIds);
            $schoolsQuery->whereIn('id', $assistantSchoolIds);
        }
        $memberships = $membershipsQuery->get()->map(function ($membership) {
            return [
                'id' => $membership->id,
                'name' => $membership->offer ? $membership->offer->offer_name : 'No Offer',
                'deleted_at' => $membership->deleted_at,
                'is_deleted' => !is_null($membership->deleted_at)
            ];
        })->sortBy('name')->values();
        $students = $studentsQuery->orderBy('firstName')->get()->map(function ($student) {
            return [
                'id' => $student->id,
                'name' => $student->firstName . ' ' . $student->lastName
            ];
        });
        $creators = User::whereIn('id', Invoice::whereNotNull('created_by')->pluck('created_by')->unique())
            ->select('id', 'name')
            ->orderBy('name')
            ->get()
            ->map(function ($creator) {
                return [
                    'id' => $creator->id,
                    'name' => $creator->name
                ];
            });
        $schools = $schoolsQuery->orderBy('name')->get()->map(function ($school) {
            return [
                'id' => $school->id,
                'name' => $school->name
            ];
        });
        // Fetch all offers for the offer filter
        $offers = Offer::select('id', 'offer_name')->orderBy('offer_name')->get()->map(function ($offer) {
            return [
                'id' => $offer->id,
                'name' => $offer->offer_name
            ];
        });

        // Format invoices for frontend (for paginated results, use ->getCollection())
        $formattedInvoices = $invoices->getCollection()->map(function ($invoice) {
            return [
                'id' => $invoice->id,
                'amountPaid' => (float) $invoice->amountPaid,
                'created_at' => $invoice->created_at->format('Y-m-d H:i:s'),
                'student' => $invoice->student ? [
                    'id' => $invoice->student->id,
                    'name' => $invoice->student->firstName . ' ' . $invoice->student->lastName
                ] : null,
                'creator' => $invoice->creator ? [
                    'id' => $invoice->creator->id,
                    'name' => $invoice->creator->name
                ] : null,
                'membership' => $invoice->membership ? [
                    'id' => $invoice->membership->id,
                    'name' => $invoice->membership->offer ? $invoice->membership->offer->offer_name : 'No Offer',
                    'deleted_at' => $invoice->membership->deleted_at,
                    'is_deleted' => !is_null($invoice->membership->deleted_at)
                ] : null,
                'type' => $invoice->type,
                'assurance_amount' => $invoice->assurance_amount,
            ];
        });

        return Inertia::render('Menu/CashierPage', [
            'invoices' => $formattedInvoices,
            'pagination' => [
                'current_page' => $invoices->currentPage(),
                'last_page' => $invoices->lastPage(),
                'per_page' => $invoices->perPage(),
                'total' => $invoices->total(),
                'links' => $invoices->linkCollection(),
            ],
            'chartData' => $chartData,
            'totalPaid' => (float) $totalPaid,
            'previousDayTotal' => (float) $previousDayTotal,
            'cashierStats' => [
                'totalInvoices' => $totalInvoices,
                'totalPaid' => (float) $totalPaid,
                'averagePayment' => (float) $averagePayment,
                'peakHour' => $peakHour,
            ],
            'date' => $date,
            'filters' => [
                'memberships' => $memberships,
                'students' => $students,
                'creators' => $creators,
                'schools' => $schools,
                'offers' => $offers, // Add offers to filters
            ],
            'currentFilters' => [
                'membership_id' => $request->input('membership_id'),
                'student_id' => $request->input('student_id'),
                'creator_id' => $request->input('creator_id'),
                'school_id' => $request->input('school_id'),
                'offer_id' => $request->input('offer_id'), // Add offer_id to currentFilters
                'date' => $date, // Always return the date being used
            ],
            'role' => $user ? $user->role : null,
        ]);
    }
}