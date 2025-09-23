// Quick fix for Invoice 286 - Check offer percentages
use App\Models\Invoice;
use App\Models\Offer;

// Get invoice 286
$invoice = Invoice::with(['membership.student', 'offer'])->find(286);
if (!$invoice) {
    echo "Invoice 286 not found\n";
    exit;
}

echo "=== INVOICE 286 OFFER ANALYSIS ===\n";
echo "Invoice ID: " . $invoice->id . "\n";
echo "Amount Paid: " . $invoice->amountPaid . "\n";
echo "Partial Month Amount: " . $invoice->partialMonthAmount . "\n";

$offer = $invoice->offer;
if (!$offer) {
    echo "ERROR: No offer found!\n";
    exit;
}

echo "\n=== OFFER DETAILS ===\n";
echo "Offer ID: " . $offer->id . "\n";
echo "Offer Name: " . $offer->name . "\n";
echo "Offer Percentage: " . json_encode($offer->percentage) . "\n";

echo "\n=== TEACHER SUBJECTS IN MEMBERSHIP ===\n";
$membership = $invoice->membership;
foreach ($membership->teachers as $teacherData) {
    echo "Teacher ID: " . $teacherData['teacherId'] . " - Subject: " . $teacherData['subject'] . "\n";
}

echo "\n=== PERCENTAGE MATCHING ===\n";
foreach ($membership->teachers as $teacherData) {
    $subject = $teacherData['subject'];
    $percentage = $offer->percentage[$subject] ?? null;
    echo "Subject '" . $subject . "': " . ($percentage !== null ? $percentage . "%" : "NOT FOUND") . "\n";
}

echo "\n=== CALCULATING TEACHER AMOUNTS ===\n";
foreach ($membership->teachers as $teacherData) {
    $subject = $teacherData['subject'];
    $percentage = $offer->percentage[$subject] ?? 0;
    
    $totalAmount = $invoice->amountPaid * ($percentage / 100);
    $immediateAmount = $invoice->partialMonthAmount * ($percentage / 100);
    
    echo "Teacher " . $teacherData['teacherId'] . " (" . $subject . "):\n";
    echo "  Percentage: " . $percentage . "%\n";
    echo "  Total Amount: " . $totalAmount . " DH\n";
    echo "  Immediate Amount: " . $immediateAmount . " DH\n";
}

echo "\n=== CHECKING EXISTING PAYMENT RECORDS ===\n";
$existingPayments = \App\Models\TeacherMembershipPayment::where('invoice_id', 286)->get();
echo "Existing records: " . $existingPayments->count() . "\n";

if ($existingPayments->count() > 0) {
    foreach ($existingPayments as $payment) {
        echo "Payment ID: " . $payment->id . "\n";
        echo "  Teacher ID: " . $payment->teacher_id . "\n";
        echo "  Subject: " . $payment->teacher_subject . "\n";
        echo "  Percentage: " . $payment->teacher_percentage . "%\n";
        echo "  Total Amount: " . $payment->total_teacher_amount . "\n";
        echo "  Immediate Amount: " . $payment->immediate_wallet_amount . "\n";
        echo "  Active: " . ($payment->is_active ? 'Yes' : 'No') . "\n";
    }
}

