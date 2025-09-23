// Diagnostic for Invoice 509 - Use creation date for partial month processing
use App\Models\Invoice;
use App\Models\Membership;
use App\Models\Teacher;
use App\Models\Offer;

// Get invoice 509 with all relationships
$invoice = Invoice::with(['membership.student', 'offer'])->find(509);
if (!$invoice) {
    echo "Invoice 509 not found\n";
    exit;
}

echo "=== INVOICE 509 DETAILS ===\n";
echo "ID: " . $invoice->id . "\n";
echo "Total Amount: " . $invoice->totalAmount . "\n";
echo "Amount Paid: " . $invoice->amountPaid . "\n";
echo "Selected Months: " . json_encode($invoice->selected_months) . "\n";
echo "Include Partial Month: " . ($invoice->includePartialMonth ? 'Yes' : 'No') . "\n";
echo "Partial Month Amount: " . $invoice->partialMonthAmount . "\n";
echo "Bill Date: " . $invoice->billDate . "\n";
echo "Creation Date: " . $invoice->created_at . "\n";

echo "\n=== MEMBERSHIP DETAILS ===\n";
$membership = $invoice->membership;
if (!$membership) {
    echo "ERROR: No membership found for this invoice!\n";
    exit;
}

echo "Membership ID: " . $membership->id . "\n";
echo "Student ID: " . $membership->student_id . "\n";
echo "Student Name: " . $membership->student->firstName . " " . $membership->student->lastName . "\n";
echo "Teachers: " . json_encode($membership->teachers) . "\n";
echo "Offer ID: " . $membership->offer_id . "\n";

if (!is_array($membership->teachers) || empty($membership->teachers)) {
    echo "ERROR: No teachers found in membership!\n";
    exit;
}

echo "\n=== TEACHER DETAILS ===\n";
foreach ($membership->teachers as $teacherData) {
    echo "Teacher ID: " . $teacherData['teacherId'] . "\n";
    echo "Subject: " . ($teacherData['subject'] ?? 'NOT SET') . "\n";
    
    $teacher = Teacher::find($teacherData['teacherId']);
    if (!$teacher) {
        echo "ERROR: Teacher not found in database!\n";
        continue;
    }
    
    echo "Teacher Name: " . $teacher->firstName . " " . $teacher->lastName . "\n";
    echo "Teacher Email: " . $teacher->email . "\n";
}

echo "\n=== OFFER DETAILS ===\n";
$offer = $invoice->offer;
if (!$offer) {
    echo "ERROR: No offer found!\n";
    exit;
}

echo "Offer ID: " . $offer->id . "\n";
echo "Offer Name: " . $offer->name . "\n";
echo "Offer Percentage: " . json_encode($offer->percentage) . "\n";

echo "\n=== TESTING PAYMENT PROCESSING WITH CORRECT DATE ===\n";

// Use the creation date as the "current month" for processing
$creationDate = $invoice->created_at;
$currentMonth = $creationDate->format('Y-m');
echo "Using creation date as current month: " . $currentMonth . "\n";

$selectedMonths = $invoice->selected_months ?? [];
if (is_string($selectedMonths)) {
    $selectedMonths = json_decode($selectedMonths, true) ?? [];
}

echo "Original Selected Months: " . json_encode($selectedMonths) . "\n";

// Add creation month for partial payment
if ($invoice->includePartialMonth && $invoice->partialMonthAmount > 0) {
    if (!in_array($currentMonth, $selectedMonths)) {
        $selectedMonths[] = $currentMonth;
        sort($selectedMonths);
    }
}

echo "After adding creation month: " . json_encode($selectedMonths) . "\n";

// Test teacher processing
foreach ($membership->teachers as $teacherData) {
    $teacher = Teacher::find($teacherData['teacherId']);
    if (!$teacher) continue;
    
    $teacherSubject = $teacherData['subject'] ?? null;
    echo "\nProcessing Teacher: " . $teacher->firstName . " " . $teacher->lastName . "\n";
    echo "Subject: " . $teacherSubject . "\n";
    
    if (!$teacherSubject || !is_array($offer->percentage)) {
        echo "ERROR: Missing subject or offer percentage!\n";
        continue;
    }
    
    $teacherPercentage = $offer->percentage[$teacherSubject] ?? 0;
    echo "Teacher Percentage: " . $teacherPercentage . "%\n";
    
    $totalTeacherAmount = $invoice->amountPaid * ($teacherPercentage / 100);
    echo "Total Teacher Amount: " . $totalTeacherAmount . "\n";
    
    $isCurrentMonthIncluded = in_array($currentMonth, $selectedMonths);
    echo "Creation Month (" . $currentMonth . ") Included: " . ($isCurrentMonthIncluded ? 'Yes' : 'No') . "\n";
    
    if ($isCurrentMonthIncluded) {
        $immediateAmount = $invoice->partialMonthAmount * ($teacherPercentage / 100);
        echo "Immediate Amount (for " . $currentMonth . "): " . $immediateAmount . "\n";
    }
}

echo "\n=== CHECKING EXISTING PAYMENT RECORDS ===\n";
$existingPayments = \App\Models\TeacherMembershipPayment::where('invoice_id', 509)->get();
echo "Existing TeacherMembershipPayment records: " . $existingPayments->count() . "\n";

if ($existingPayments->count() > 0) {
    foreach ($existingPayments as $payment) {
        echo "Payment ID: " . $payment->id . ", Teacher ID: " . $payment->teacher_id . ", Active: " . ($payment->is_active ? 'Yes' : 'No') . "\n";
        echo "Selected Months: " . json_encode($payment->selected_months) . "\n";
        echo "Unpaid Months: " . json_encode($payment->months_rest_not_paid_yet) . "\n";
    }
} else {
    echo "No existing payment records found.\n";
}

