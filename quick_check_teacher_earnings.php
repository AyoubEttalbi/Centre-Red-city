<?php
// Quick script to compute a teacher's earnings for a specific month using Eloquent (no auth)

use Illuminate\Support\Carbon;

require __DIR__ . '/vendor/autoload.php';

$app = require __DIR__ . '/bootstrap/app.php';

// Boot the application (artisan kernel is fine to bootstrap Eloquent/config)
$consoleKernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$consoleKernel->bootstrap();

// Params
$teacherId = (int)($argv[1] ?? 1);
$month = $argv[2] ?? date('Y-m'); // format: YYYY-MM
$mode = $argv[3] ?? 'total'; // 'total' | 'breakdown' | 'tmp_total' | 'tmp_breakdown'

// If using TeacherMembershipPayment direct method
if ($mode === 'tmp_total' || $mode === 'tmp_breakdown') {
    $query = \App\Models\TeacherMembershipPayment::query()
        ->where('teacher_id', $teacherId)
        ->whereJsonContains('selected_months', $month);

    $total = (float)$query->sum('monthly_teacher_amount');

    if ($mode === 'tmp_breakdown') {
        $rows = $query->with(['student','membership','invoice'])->get()->map(function($r){
            return [
                'tmp_id' => $r->id,
                'invoice_id' => $r->invoice_id,
                'membership_id' => $r->membership_id,
                'student' => $r->student ? ($r->student->first_name . ' ' . $r->student->last_name) : null,
                'subject' => $r->teacher_subject,
                'teacher_percentage' => (float)$r->teacher_percentage,
                'monthly_teacher_amount' => round((float)$r->monthly_teacher_amount, 2),
                'selected_months_count' => is_array($r->selected_months) ? count($r->selected_months) : 0,
                'is_active' => (bool)$r->is_active,
            ];
        });
        echo json_encode([
            'teacher_id' => $teacherId,
            'month' => $month,
            'tmp_total_earned' => round($total, 2),
            'items' => $rows,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), PHP_EOL;
        exit(0);
    } else {
        echo json_encode([
            'teacher_id' => $teacherId,
            'month' => $month,
            'tmp_total_earned' => round($total, 2),
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), PHP_EOL;
        exit(0);
    }
}

// Models
/** @var \Illuminate\Database\Eloquent\Collection $memberships */
$memberships = \App\Models\Membership::withTrashed()
    ->whereIn('payment_status', ['paid', 'pending'])
    ->whereJsonContains('teachers', [['teacherId' => (string)$teacherId]])
    ->with(['invoices' => function($query) {
        $query->whereNull('deleted_at')->where('amountPaid', '>', 0);
    }, 'student', 'student.school', 'student.class', 'offer'])
    ->get();

// Extract invoices
$invoices = $memberships->flatMap(function ($membership) {
    return $membership->invoices;
});

$totalForMonth = 0.0;
$breakdown = [];

foreach ($invoices as $invoice) {
    $membership = $invoice->membership;
    if (!$membership || !is_array($membership->teachers)) continue;

    // Selected months
    $selectedMonths = $invoice->selected_months ?? [];
    if (is_string($selectedMonths)) {
        $decoded = json_decode($selectedMonths, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            $selectedMonths = $decoded;
        } else {
            $selectedMonths = [];
        }
    }
    if (empty($selectedMonths)) {
        $selectedMonths = [$invoice->billDate ? $invoice->billDate->format('Y-m') : null];
    }

    foreach ($membership->teachers as $teacherData) {
        if (!isset($teacherData['teacherId'])) continue;
        if ((string)$teacherData['teacherId'] !== (string)$teacherId) continue;

        $teacher = \App\Models\Teacher::find($teacherData['teacherId']);
        if (!$teacher) continue;

        $offer = $invoice->offer;
        $teacherSubject = $teacherData['subject'] ?? ($teacher->subjects->first()->name ?? 'Unknown');
        if (!$offer || !$teacherSubject || !is_array($offer->percentage)) continue;

        $teacherPercentage = $offer->percentage[$teacherSubject] ?? 0;

        $totalTeacherAmount = (float)$invoice->amountPaid * ((float)$teacherPercentage / 100.0);
        $monthsCount = count($selectedMonths);
        $earningsPerMonth = 0.0;
        if ($monthsCount > 0) {
            $includePartialMonth = $invoice->includePartialMonth ?? false;
            $partialMonthAmount = (float)($invoice->partialMonthAmount ?? 0);
            if ($includePartialMonth && $partialMonthAmount > 0) {
                $earningsPerMonth = $partialMonthAmount * ((float)$teacherPercentage / 100.0);
            } else {
                $earningsPerMonth = $monthsCount > 0 ? $totalTeacherAmount / $monthsCount : 0.0;
            }
        }

        foreach ($selectedMonths as $selectedMonth) {
            if (empty($selectedMonth)) continue;
            if ($selectedMonth !== $month) continue;
            $totalForMonth += $earningsPerMonth;
            if ($mode === 'breakdown') {
                $student = $invoice->student;
                $breakdown[] = [
                    'invoice_id' => $invoice->id,
                    'membership_id' => $invoice->membership_id,
                    'student' => $student ? ($student->first_name . ' ' . $student->last_name) : null,
                    'subject' => $teacherSubject,
                    'teacher_percentage' => (float)$teacherPercentage,
                    'amount_paid' => (float)$invoice->amountPaid,
                    'selected_months_count' => $monthsCount,
                    'include_partial_month' => (bool)($invoice->includePartialMonth ?? false),
                    'partial_month_amount' => (float)($invoice->partialMonthAmount ?? 0),
                    'per_month_earning' => round($earningsPerMonth, 2),
                ];
            }
        }
    }
}

// Output
if ($mode === 'breakdown') {
    usort($breakdown, function ($a, $b) { return $b['per_month_earning'] <=> $a['per_month_earning']; });
    echo json_encode([
        'teacher_id' => $teacherId,
        'month' => $month,
        'total_earned' => round($totalForMonth, 2),
        'items' => $breakdown,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), PHP_EOL;
} else {
    echo json_encode([
        'teacher_id' => $teacherId,
        'month' => $month,
        'total_earned' => round($totalForMonth, 2),
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), PHP_EOL;
}


