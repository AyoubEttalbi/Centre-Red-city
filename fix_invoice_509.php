// Fix Invoice 509 - Use creation date for partial month processing
use App\Models\Invoice;
use App\Models\Membership;
use App\Models\Teacher;
use App\Models\Offer;

// Get invoice 509
$invoice = Invoice::with(['membership.student', 'offer'])->find(509);
if (!$invoice) {
    echo "Invoice 509 not found\n";
    exit;
}

echo "=== FIXING INVOICE 509 ===\n";
echo "Invoice ID: " . $invoice->id . "\n";
echo "Creation Date: " . $invoice->created_at . "\n";
echo "Bill Date: " . $invoice->billDate . "\n";
echo "Include Partial Month: " . ($invoice->includePartialMonth ? 'Yes' : 'No') . "\n";
echo "Partial Month Amount: " . $invoice->partialMonthAmount . "\n";

$membership = $invoice->membership;
if (!$membership) {
    echo "ERROR: No membership found!\n";
    exit;
}

echo "\n=== FIXING MEMBERSHIP " . $membership->id . " TEACHERS ===\n";
echo "Current teachers data: " . json_encode($membership->teachers) . "\n";

// Get the offer to see available subjects
$offer = $membership->offer;
if (!$offer) {
    echo "ERROR: No offer found for membership " . $membership->id . "\n";
    exit;
}

echo "Offer ID: " . $offer->id . "\n";
echo "Available subjects: " . json_encode(array_keys($offer->percentage ?? [])) . "\n";

// Fix the teachers array by adding subject for each teacher
$fixedTeachers = [];
foreach ($membership->teachers as $teacherData) {
    $teacher = Teacher::with('subjects')->find($teacherData['teacherId']);
    if (!$teacher) {
        echo "ERROR: Teacher ID " . $teacherData['teacherId'] . " not found\n";
        continue;
    }
    
    // Get the first subject of this teacher
    $firstSubject = $teacher->subjects->first();
    $subjectName = $firstSubject ? $firstSubject->name : 'Unknown';
    
    // Add the subject to the teacher data
    $fixedTeacherData = [
        'teacherId' => $teacherData['teacherId'],
        'amount' => $teacherData['amount'],
        'subject' => $subjectName
    ];
    
    $fixedTeachers[] = $fixedTeacherData;
    
    echo "Fixed teacher " . $teacher->firstName . " " . $teacher->lastName . " - Subject: " . $subjectName . "\n";
}

echo "\n=== UPDATING MEMBERSHIP ===\n";
echo "New teachers data: " . json_encode($fixedTeachers) . "\n";

// Update the membership
$membership->teachers = $fixedTeachers;
$membership->save();

echo "Membership updated successfully!\n";

// Now process the payment using the CREATION DATE
echo "\n=== PROCESSING PAYMENT WITH CREATION DATE ===\n";

// Use the creation date as the "current month" for processing
$creationDate = $invoice->created_at;
$currentMonth = $creationDate->format('Y-m');
echo "Using creation date as current month: " . $currentMonth . "\n";

// Create the validated array with creation date context
$validated = [
    'includePartialMonth' => $invoice->includePartialMonth,
    'partialMonthAmount' => $invoice->partialMonthAmount,
    'selected_months' => $invoice->selected_months,
    'totalAmount' => $invoice->totalAmount,
    'amountPaid' => $invoice->amountPaid,
    'rest' => $invoice->rest,
    'billDate' => $invoice->billDate,
    'endDate' => $invoice->endDate,
    'months' => $invoice->months,
    'offer_id' => $invoice->offer_id,
    'student_id' => $invoice->student_id,
    'membership_id' => $invoice->membership_id,
    'creation_date' => $creationDate, // Add creation date for context
];

// Process the payment
$paymentService = new \App\Services\TeacherMembershipPaymentService();

// We need to modify the service to use creation date instead of current date
// For now, let's manually create the payment records

echo "\n=== MANUALLY CREATING PAYMENT RECORDS ===\n";

$selectedMonths = $invoice->selected_months ?? [];
if (is_string($selectedMonths)) {
    $selectedMonths = json_decode($selectedMonths, true) ?? [];
}

// Add creation month for partial payment
if ($invoice->includePartialMonth && $invoice->partialMonthAmount > 0) {
    if (!in_array($currentMonth, $selectedMonths)) {
        $selectedMonths[] = $currentMonth;
        sort($selectedMonths);
    }
}

echo "Final selected months: " . json_encode($selectedMonths) . "\n";

// Calculate payment details for each teacher
foreach ($membership->teachers as $teacherData) {
    $teacher = Teacher::find($teacherData['teacherId']);
    if (!$teacher) continue;
    
    $teacherSubject = $teacherData['subject'];
    $teacherPercentage = $offer->percentage[$teacherSubject] ?? 0;
    
    echo "\nProcessing Teacher: " . $teacher->firstName . " " . $teacher->lastName . "\n";
    echo "Subject: " . $teacherSubject . "\n";
    echo "Percentage: " . $teacherPercentage . "%\n";
    
    $totalTeacherAmount = $invoice->amountPaid * ($teacherPercentage / 100);
    echo "Total Teacher Amount: " . $totalTeacherAmount . "\n";
    
    $isCurrentMonthIncluded = in_array($currentMonth, $selectedMonths);
    $immediateWalletAmount = 0;
    
    if ($isCurrentMonthIncluded) {
        $immediateWalletAmount = $invoice->partialMonthAmount * ($teacherPercentage / 100);
        echo "Immediate Amount (for " . $currentMonth . "): " . $immediateWalletAmount . "\n";
        
        // Increment teacher wallet immediately
        $teacher->increment('wallet', $immediateWalletAmount);
        echo "Incremented teacher wallet by: " . $immediateWalletAmount . "\n";
    }
    
    // Calculate monthly amount for future months
    $futureMonths = array_filter($selectedMonths, function($month) use ($currentMonth) {
        return $month > $currentMonth;
    });
    $futureMonthsCount = count($futureMonths);
    $monthlyTeacherAmount = 0;
    
    if ($futureMonthsCount > 0) {
        $remainingAmountForFutureMonths = $totalTeacherAmount - $immediateWalletAmount;
        $monthlyTeacherAmount = $remainingAmountForFutureMonths / $futureMonthsCount;
    }
    
    echo "Monthly amount for future months: " . $monthlyTeacherAmount . "\n";
    echo "Future months count: " . $futureMonthsCount . "\n";
    
    // Create TeacherMembershipPayment record
    $paymentRecord = \App\Models\TeacherMembershipPayment::create([
        'student_id' => $membership->student_id,
        'teacher_id' => $teacher->id,
        'membership_id' => $membership->id,
        'invoice_id' => $invoice->id,
        'selected_months' => $selectedMonths,
        'months_rest_not_paid_yet' => array_values($futureMonths), // Only future months
        'total_teacher_amount' => round($totalTeacherAmount, 2),
        'monthly_teacher_amount' => round($monthlyTeacherAmount, 2),
        'payment_percentage' => 100, // Fully paid
        'teacher_subject' => $teacherSubject,
        'teacher_percentage' => round($teacherPercentage, 2),
        'immediate_wallet_amount' => round($immediateWalletAmount, 2),
        'total_paid_to_teacher' => round($immediateWalletAmount, 2),
        'is_active' => true,
    ]);
    
    echo "Created payment record ID: " . $paymentRecord->id . "\n";
}

echo "\n=== FINAL RESULTS ===\n";
$newPayments = \App\Models\TeacherMembershipPayment::where('invoice_id', 509)->get();
echo "Total TeacherMembershipPayment records: " . $newPayments->count() . "\n";

foreach ($newPayments as $payment) {
    echo "Payment ID: " . $payment->id . ", Teacher ID: " . $payment->teacher_id . ", Subject: " . $payment->teacher_subject . "\n";
    echo "Selected Months: " . json_encode($payment->selected_months) . "\n";
    echo "Unpaid Months: " . json_encode($payment->months_rest_not_paid_yet) . "\n";
    echo "Immediate Amount: " . $payment->immediate_wallet_amount . "\n";
    echo "Total Paid: " . $payment->total_paid_to_teacher . "\n";
}

