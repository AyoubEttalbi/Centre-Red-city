// Fix Invoice 286 - Process payment correctly (subjects are actually correct)
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

echo "=== FIXING INVOICE 286 ===\n";
echo "Invoice ID: " . $invoice->id . "\n";
echo "Amount Paid: " . $invoice->amountPaid . "\n";
echo "Partial Month Amount: " . $invoice->partialMonthAmount . "\n";

$membership = $invoice->membership;
$offer = $invoice->offer;

echo "Offer Percentage: " . json_encode($offer->percentage) . "\n";

// Delete existing payment records
$existingPayments = TeacherMembershipPayment::where('invoice_id', 286)->get();
echo "Deleting " . $existingPayments->count() . " existing payment records...\n";
foreach ($existingPayments as $payment) {
    $payment->delete();
}

// Use creation date for processing
$creationDate = $invoice->created_at;
$currentMonth = $creationDate->format('Y-m');
echo "Using creation date as current month: " . $currentMonth . "\n";

$selectedMonths = [$currentMonth]; // Only the creation month for partial payment

echo "\n=== PROCESSING TEACHERS ===\n";
foreach ($membership->teachers as $teacherData) {
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
        'months_rest_not_paid_yet' => [], // No future months for partial payment
        'total_teacher_amount' => round($totalAmount, 2),
        'monthly_teacher_amount' => 0, // No monthly payments for partial
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

foreach ($newPayments as $payment) {
    echo "Payment ID: " . $payment->id . " - Teacher: " . $payment->teacher_subject . " - Amount: " . $payment->immediate_wallet_amount . " DH\n";
}

echo "Invoice 286 fixed successfully!\n";

