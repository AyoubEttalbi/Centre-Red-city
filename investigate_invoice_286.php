// Investigate why Invoice 286 shows 0.00 DH earnings
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

echo "=== INVESTIGATING INVOICE 286 ===\n";
echo "Invoice ID: " . $invoice->id . "\n";
echo "Amount Paid: " . $invoice->amountPaid . "\n";
echo "Partial Month Amount: " . $invoice->partialMonthAmount . "\n";
echo "Creation Date: " . $invoice->created_at . "\n";

$membership = $invoice->membership;
$offer = $invoice->offer;

echo "\n=== OFFER ANALYSIS ===\n";
echo "Offer ID: " . $offer->id . "\n";
echo "Offer Percentage: " . json_encode($offer->percentage) . "\n";

echo "\n=== TEACHER DATA ANALYSIS ===\n";
foreach ($membership->teachers as $teacherData) {
    $teacher = Teacher::find($teacherData['teacherId']);
    if (!$teacher) continue;
    
    $subject = $teacherData['subject'];
    $percentage = $offer->percentage[$subject] ?? 0;
    
    $totalAmount = $invoice->amountPaid * ($percentage / 100);
    $immediateAmount = $invoice->partialMonthAmount * ($percentage / 100);
    
    echo "Teacher " . $teacher->firstName . " " . $teacher->lastName . ":\n";
    echo "  Subject: " . $subject . "\n";
    echo "  Percentage: " . $percentage . "%\n";
    echo "  Total Amount: " . $totalAmount . " DH\n";
    echo "  Immediate Amount: " . $immediateAmount . " DH\n";
    echo "  Current Wallet: " . $teacher->wallet . " DH\n";
}

echo "\n=== EXISTING PAYMENT RECORDS ANALYSIS ===\n";
$existingPayments = TeacherMembershipPayment::where('invoice_id', 286)->get();
echo "Number of existing payment records: " . $existingPayments->count() . "\n";

if ($existingPayments->count() > 0) {
    foreach ($existingPayments as $payment) {
        echo "\nPayment Record ID: " . $payment->id . "\n";
        echo "  Teacher ID: " . $payment->teacher_id . "\n";
        echo "  Teacher Subject: " . $payment->teacher_subject . "\n";
        echo "  Teacher Percentage: " . $payment->teacher_percentage . "%\n";
        echo "  Total Teacher Amount: " . $payment->total_teacher_amount . " DH\n";
        echo "  Monthly Teacher Amount: " . $payment->monthly_teacher_amount . " DH\n";
        echo "  Immediate Wallet Amount: " . $payment->immediate_wallet_amount . " DH\n";
        echo "  Total Paid to Teacher: " . $payment->total_paid_to_teacher . " DH\n";
        echo "  Selected Months: " . json_encode($payment->selected_months) . "\n";
        echo "  Unpaid Months: " . json_encode($payment->months_rest_not_paid_yet) . "\n";
        echo "  Is Active: " . ($payment->is_active ? 'Yes' : 'No') . "\n";
        echo "  Created At: " . $payment->created_at . "\n";
        echo "  Updated At: " . $payment->updated_at . "\n";
        
        // Check if this payment record is causing the 0.00 DH display
        if ($payment->immediate_wallet_amount == 0) {
            echo "  ⚠️  WARNING: This payment record has 0 immediate wallet amount!\n";
        }
    }
} else {
    echo "No existing payment records found.\n";
}

echo "\n=== CHECKING TEACHER WALLETS ===\n";
foreach ($membership->teachers as $teacherData) {
    $teacher = Teacher::find($teacherData['teacherId']);
    if (!$teacher) continue;
    
    echo "Teacher " . $teacher->firstName . " " . $teacher->lastName . ":\n";
    echo "  Current Wallet: " . $teacher->wallet . " DH\n";
    echo "  Email: " . $teacher->email . "\n";
}

echo "\n=== CHECKING INVOICE STATUS LOGIC ===\n";
// Simulate the logic used in TeacherInvoicesTable
$currentMonth = $invoice->created_at->format('Y-m');
echo "Current month for processing: " . $currentMonth . "\n";

foreach ($membership->teachers as $teacherData) {
    $teacher = Teacher::find($teacherData['teacherId']);
    if (!$teacher) continue;
    
    // Check if there's a payment record for this teacher
    $teacherPayment = TeacherMembershipPayment::where('teacher_id', $teacher->id)
        ->where('membership_id', $membership->id)
        ->where('invoice_id', $invoice->id)
        ->whereJsonContains('selected_months', $currentMonth)
        ->first();
    
    $isMonthPaid = false;
    if ($teacherPayment) {
        // Check if the month is NOT in the unpaid months list
        $isMonthPaid = !in_array($currentMonth, $teacherPayment->months_rest_not_paid_yet ?? []);
    }
    
    echo "Teacher " . $teacher->firstName . " " . $teacher->lastName . ":\n";
    echo "  Payment record exists: " . ($teacherPayment ? 'Yes' : 'No') . "\n";
    echo "  Is month paid: " . ($isMonthPaid ? 'Yes' : 'No') . "\n";
    echo "  Status would be: " . ($isMonthPaid ? 'Actif' : 'En attente') . "\n";
    
    if ($teacherPayment) {
        echo "  Monthly amount: " . $teacherPayment->monthly_teacher_amount . " DH\n";
        echo "  Immediate amount: " . $teacherPayment->immediate_wallet_amount . " DH\n";
    }
}

