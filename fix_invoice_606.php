// Fix for Invoice 606 - Manual processing of partial month payment
// Run this in your Laravel tinker

use App\Models\Invoice;
use App\Services\TeacherMembershipPaymentService;

// Get invoice 606
$invoice = Invoice::find(606);
if (!$invoice) {
    echo "Invoice 606 not found\n";
    exit;
}

echo "Invoice 606 details:\n";
echo "ID: " . $invoice->id . "\n";
echo "Total Amount: " . $invoice->totalAmount . "\n";
echo "Amount Paid: " . $invoice->amountPaid . "\n";
echo "Selected Months: " . json_encode($invoice->selected_months) . "\n";
echo "Include Partial Month: " . ($invoice->includePartialMonth ? 'Yes' : 'No') . "\n";
echo "Partial Month Amount: " . $invoice->partialMonthAmount . "\n";
echo "Bill Date: " . $invoice->billDate . "\n";

// Check if there are existing TeacherMembershipPayment records
$existingPayments = \App\Models\TeacherMembershipPayment::where('invoice_id', 606)->get();
echo "\nExisting TeacherMembershipPayment records: " . $existingPayments->count() . "\n";

if ($existingPayments->count() > 0) {
    foreach ($existingPayments as $payment) {
        echo "Payment ID: " . $payment->id . ", Teacher ID: " . $payment->teacher_id . ", Active: " . ($payment->is_active ? 'Yes' : 'No') . "\n";
        echo "Selected Months: " . json_encode($payment->selected_months) . "\n";
        echo "Unpaid Months: " . json_encode($payment->months_rest_not_paid_yet) . "\n";
    }
} else {
    echo "No existing payment records found. Processing payment...\n";
    
    // Create the validated array as it would be passed to the service
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
    
    // Process the payment
    $paymentService = new TeacherMembershipPaymentService();
    $paymentService->processInvoicePayment($invoice, $validated);
    
    echo "Payment processing completed.\n";
    
    // Check if records were created
    $newPayments = \App\Models\TeacherMembershipPayment::where('invoice_id', 606)->get();
    echo "New TeacherMembershipPayment records: " . $newPayments->count() . "\n";
    
    foreach ($newPayments as $payment) {
        echo "Payment ID: " . $payment->id . ", Teacher ID: " . $payment->teacher_id . ", Active: " . ($payment->is_active ? 'Yes' : 'No') . "\n";
        echo "Selected Months: " . json_encode($payment->selected_months) . "\n";
        echo "Unpaid Months: " . json_encode($payment->months_rest_not_paid_yet) . "\n";
        echo "Immediate Wallet Amount: " . $payment->immediate_wallet_amount . "\n";
        echo "Total Paid to Teacher: " . $payment->total_paid_to_teacher . "\n";
    }
}
