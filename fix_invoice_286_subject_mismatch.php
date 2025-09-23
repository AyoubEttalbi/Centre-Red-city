// Fix Invoice 286 - Update membership teachers to match Offer ID 6
use App\Models\Invoice;
use App\Models\Membership;
use App\Models\Teacher;
use App\Models\Offer;
use App\Models\TeacherMembershipPayment;

// Get invoice 286
$invoice = Invoice::with(['membership.student', 'offer'])->find(286);
if (!$invoice) {
    echo "Invoice 286 not found\n";
    exit;
}

echo "=== FIXING INVOICE 286 SUBJECT MISMATCH ===\n";
echo "Invoice ID: " . $invoice->id . "\n";
echo "Offer ID: " . $invoice->offer_id . "\n";

$membership = $invoice->membership;
$offer = $invoice->offer;

echo "\n=== CURRENT STATE ===\n";
echo "Membership Teachers: " . json_encode($membership->teachers) . "\n";
echo "Offer Percentages: " . json_encode($offer->percentage) . "\n";

echo "\n=== SUBJECT MAPPING ===\n";
$subjectMapping = [
    'math' => 'ENG',  // Map math to ENG since Offer ID 6 has ENG but not math
    'PC' => 'PC',     // Keep PC as is
    'SVT' => 'SVT',   // Keep SVT as is  
    'FR' => 'FR'      // Keep FR as is
];

echo "Mapping: math → ENG, PC → PC, SVT → SVT, FR → FR\n";

// Update membership teachers with correct subjects
$updatedTeachers = [];
foreach ($membership->teachers as $teacherData) {
    $originalSubject = $teacherData['subject'];
    $newSubject = $subjectMapping[$originalSubject] ?? $originalSubject;
    
    $updatedTeacher = $teacherData;
    $updatedTeacher['subject'] = $newSubject;
    $updatedTeachers[] = $updatedTeacher;
    
    echo "Teacher " . $teacherData['teacherId'] . ": " . $originalSubject . " → " . $newSubject . "\n";
}

echo "\n=== UPDATING MEMBERSHIP ===\n";
$membership->teachers = $updatedTeachers;
$membership->save();
echo "Membership updated successfully!\n";

echo "\n=== DELETING EXISTING PAYMENT RECORDS ===\n";
$existingPayments = TeacherMembershipPayment::where('invoice_id', 286)->get();
echo "Deleting " . $existingPayments->count() . " existing payment records...\n";
foreach ($existingPayments as $payment) {
    $payment->delete();
}

echo "\n=== PROCESSING PAYMENT WITH CORRECT SUBJECTS ===\n";
$creationDate = $invoice->created_at;
$currentMonth = $creationDate->format('Y-m');
$selectedMonths = [$currentMonth];

foreach ($updatedTeachers as $teacherData) {
    $teacher = Teacher::find($teacherData['teacherId']);
    if (!$teacher) continue;
    
    $subject = $teacherData['subject'];
    $percentage = $offer->percentage[$subject] ?? 0;
    
    $totalAmount = $invoice->amountPaid * ($percentage / 100);
    $immediateAmount = $invoice->partialMonthAmount * ($percentage / 100);
    
    echo "Teacher " . $teacher->firstName . " " . $teacher->lastName . " (" . $subject . "):\n";
    echo "  Percentage: " . $percentage . "%\n";
    echo "  Total Amount: " . $totalAmount . " DH\n";
    echo "  Immediate Amount: " . $immediateAmount . " DH\n";
    
    // Increment teacher wallet
    $teacher->increment('wallet', $immediateAmount);
    echo "  Incremented wallet by: " . $immediateAmount . " DH\n";
    
    // Create payment record
    $paymentRecord = TeacherMembershipPayment::create([
        'student_id' => $membership->student_id,
        'teacher_id' => $teacher->id,
        'membership_id' => $membership->id,
        'invoice_id' => $invoice->id,
        'selected_months' => $selectedMonths,
        'months_rest_not_paid_yet' => [],
        'total_teacher_amount' => round($totalAmount, 2),
        'monthly_teacher_amount' => 0,
        'payment_percentage' => 100,
        'teacher_subject' => $subject,
        'teacher_percentage' => round($percentage, 2),
        'immediate_wallet_amount' => round($immediateAmount, 2),
        'total_paid_to_teacher' => round($immediateAmount, 2),
        'is_active' => true,
    ]);
    
    echo "  Created payment record ID: " . $paymentRecord->id . "\n";
}

echo "\n=== FINAL RESULTS ===\n";
$newPayments = TeacherMembershipPayment::where('invoice_id', 286)->get();
echo "Total payment records: " . $newPayments->count() . "\n";

$totalEarnings = 0;
foreach ($newPayments as $payment) {
    echo "Payment ID: " . $payment->id . " - Teacher: " . $payment->teacher_subject . " - Amount: " . $payment->immediate_wallet_amount . " DH\n";
    $totalEarnings += $payment->immediate_wallet_amount;
}

echo "Total earnings: " . $totalEarnings . " DH\n";
echo "Invoice 286 fixed successfully!\n";