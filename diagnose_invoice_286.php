// Diagnostic for Invoice 286 - Zero earnings issue
use App\Models\Invoice;
use App\Models\Membership;
use App\Models\Teacher;
use App\Models\Offer;

// Get invoice 286 with all relationships
$invoice = Invoice::with(['membership.student', 'offer'])->find(286);
if (!$invoice) {
    echo "Invoice 286 not found\n";
    exit;
}

echo "=== INVOICE 286 DETAILS ===\n";
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
    echo "Amount: " . ($teacherData['amount'] ?? 'NOT SET') . "\n";
    
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

echo "\n=== TEACHER PERCENTAGE CALCULATION ===\n";
foreach ($membership->teachers as $teacherData) {
    $teacher = Teacher::find($teacherData['teacherId']);
    if (!$teacher) continue;
    
    $teacherSubject = $teacherData['subject'] ?? null;
    echo "\nTeacher: " . $teacher->firstName . " " . $teacher->lastName . "\n";
    echo "Subject: " . $teacherSubject . "\n";
    
    if (!$teacherSubject) {
        echo "ERROR: No subject specified!\n";
        continue;
    }
    
    if (!is_array($offer->percentage)) {
        echo "ERROR: Offer percentage is not an array!\n";
        continue;
    }
    
    $teacherPercentage = $offer->percentage[$teacherSubject] ?? null;
    echo "Teacher Percentage: " . ($teacherPercentage !== null ? $teacherPercentage . "%" : "NOT FOUND") . "\n";
    
    if ($teacherPercentage === null) {
        echo "Available subjects in offer: " . implode(', ', array_keys($offer->percentage)) . "\n";
        echo "Subject mismatch! Teacher subject '" . $teacherSubject . "' not found in offer.\n";
    } else {
        $totalTeacherAmount = $invoice->amountPaid * ($teacherPercentage / 100);
        echo "Total Teacher Amount: " . $totalTeacherAmount . " DH\n";
        
        if ($invoice->includePartialMonth && $invoice->partialMonthAmount > 0) {
            $immediateAmount = $invoice->partialMonthAmount * ($teacherPercentage / 100);
            echo "Immediate Amount (partial month): " . $immediateAmount . " DH\n";
        }
    }
}

echo "\n=== CHECKING EXISTING PAYMENT RECORDS ===\n";
$existingPayments = \App\Models\TeacherMembershipPayment::where('invoice_id', 286)->get();
echo "Existing TeacherMembershipPayment records: " . $existingPayments->count() . "\n";

if ($existingPayments->count() > 0) {
    foreach ($existingPayments as $payment) {
        echo "Payment ID: " . $payment->id . ", Teacher ID: " . $payment->teacher_id . ", Active: " . ($payment->is_active ? 'Yes' : 'No') . "\n";
        echo "Teacher Subject: " . $payment->teacher_subject . "\n";
        echo "Teacher Percentage: " . $payment->teacher_percentage . "%\n";
        echo "Total Teacher Amount: " . $payment->total_teacher_amount . "\n";
        echo "Immediate Amount: " . $payment->immediate_wallet_amount . "\n";
        echo "Selected Months: " . json_encode($payment->selected_months) . "\n";
        echo "Unpaid Months: " . json_encode($payment->months_rest_not_paid_yet) . "\n";
    }
} else {
    echo "No existing payment records found.\n";
}

