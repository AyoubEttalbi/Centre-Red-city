// Fix Invoice 286 - Update invoice to use correct offer (Offer ID 2)
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

echo "=== FIXING INVOICE 286 OFFER MISMATCH ===\n";
echo "Invoice ID: " . $invoice->id . "\n";
echo "Student: " . $invoice->membership->student->firstName . " " . $invoice->membership->student->lastName . "\n";

$membership = $invoice->membership;

echo "\n=== CURRENT STATE ===\n";
echo "Membership Offer ID: " . $membership->offer_id . "\n";
echo "Invoice Offer ID: " . $invoice->offer_id . "\n";

if ($membership->offer_id == $invoice->offer_id) {
    echo "✅ Offers already match!\n";
    exit;
}

echo "⚠️  MISMATCH: Membership uses offer " . $membership->offer_id . " but invoice uses offer " . $invoice->offer_id . "\n";

// Get the correct offer (membership's offer)
$correctOffer = Offer::find($membership->offer_id);
echo "\n=== CORRECT OFFER ===\n";
echo "Offer ID: " . $correctOffer->id . "\n";
echo "Offer Percentage: " . json_encode($correctOffer->percentage) . "\n";

// Update invoice to use correct offer
echo "\n=== UPDATING INVOICE ===\n";
$invoice->offer_id = $membership->offer_id;
$invoice->save();
echo "Invoice updated to use Offer ID: " . $invoice->offer_id . "\n";

// Delete existing payment records
echo "\n=== DELETING EXISTING PAYMENT RECORDS ===\n";
$existingPayments = TeacherMembershipPayment::where('invoice_id', 286)->get();
echo "Deleting " . $existingPayments->count() . " existing payment records...\n";
foreach ($existingPayments as $payment) {
    $payment->delete();
}

// Process payment with correct offer
echo "\n=== PROCESSING PAYMENT WITH CORRECT OFFER ===\n";
$creationDate = $invoice->created_at;
$currentMonth = $creationDate->format('Y-m');
$selectedMonths = [$currentMonth];

foreach ($membership->teachers as $teacherData) {
    $teacher = Teacher::find($teacherData['teacherId']);
    if (!$teacher) continue;
    
    $subject = $teacherData['subject'];
    $percentage = $correctOffer->percentage[$subject] ?? 0;
    
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
echo "\nNow both student membership and teacher invoice views should show the same offer!\n";

