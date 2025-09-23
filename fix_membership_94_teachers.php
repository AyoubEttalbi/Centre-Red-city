// Fix Membership 94 - Add missing subject fields to teachers
use App\Models\Membership;
use App\Models\Teacher;
use App\Models\Offer;

// Get membership 94
$membership = Membership::find(94);
if (!$membership) {
    echo "Membership 94 not found\n";
    exit;
}

echo "=== CURRENT MEMBERSHIP 94 TEACHERS ===\n";
echo "Current teachers data: " . json_encode($membership->teachers) . "\n";

// Get the offer to see available subjects
$offer = $membership->offer;
if (!$offer) {
    echo "ERROR: No offer found for membership 94\n";
    exit;
}

echo "\n=== OFFER DETAILS ===\n";
echo "Offer ID: " . $offer->id . "\n";
echo "Offer Name: " . $offer->name . "\n";
echo "Available subjects: " . json_encode(array_keys($offer->percentage ?? [])) . "\n";

// Get all teachers and their subjects
$teachers = Teacher::with('subjects')->get();
echo "\n=== AVAILABLE TEACHERS AND SUBJECTS ===\n";
foreach ($teachers as $teacher) {
    echo "Teacher ID: " . $teacher->id . " - " . $teacher->firstName . " " . $teacher->lastName . "\n";
    echo "  Subjects: ";
    $subjectNames = $teacher->subjects->pluck('name')->toArray();
    echo implode(', ', $subjectNames) . "\n";
}

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

// Now test the payment processing again
echo "\n=== TESTING PAYMENT PROCESSING AGAIN ===\n";
$invoice = \App\Models\Invoice::find(606);
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
];

$paymentService = new \App\Services\TeacherMembershipPaymentService();
$paymentService->processInvoicePayment($invoice, $validated);

// Check if records were created
$newPayments = \App\Models\TeacherMembershipPayment::where('invoice_id', 606)->get();
echo "New TeacherMembershipPayment records: " . $newPayments->count() . "\n";

foreach ($newPayments as $payment) {
    echo "Payment ID: " . $payment->id . ", Teacher ID: " . $payment->teacher_id . ", Subject: " . $payment->teacher_subject . "\n";
    echo "Selected Months: " . json_encode($payment->selected_months) . "\n";
    echo "Unpaid Months: " . json_encode($payment->months_rest_not_paid_yet) . "\n";
    echo "Immediate Amount: " . $payment->immediate_wallet_amount . "\n";
}

