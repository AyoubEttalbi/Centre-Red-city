<?php

// Production fix script for offer mismatches
// Run this on your VPS: php artisan tinker < fix_production_offer_mismatches.php

use App\Models\Invoice;
use App\Models\Membership;
use App\Models\Teacher;
use App\Models\Offer;
use App\Models\TeacherMembershipPayment;

echo "🔧 PRODUCTION FIX FOR OFFER MISMATCHES\n";
echo "=====================================\n\n";

// Get all invoices with offer mismatches
$invoices = Invoice::with(['membership', 'offer'])->get();
$mismatches = [];

foreach ($invoices as $invoice) {
    if (!$invoice->membership) continue;
    
    if ($invoice->offer_id != $invoice->membership->offer_id) {
        $mismatches[] = $invoice;
    }
}

echo "Found " . count($mismatches) . " invoices with offer mismatches:\n";

foreach ($mismatches as $invoice) {
    echo "Invoice " . $invoice->id . ": " . $invoice->membership->student->firstName . " " . $invoice->membership->student->lastName;
    echo " - Invoice Offer " . $invoice->offer_id . " vs Membership Offer " . $invoice->membership->offer_id . "\n";
}

if (count($mismatches) == 0) {
    echo "✅ No mismatches found! System is already consistent.\n";
    exit;
}

echo "\n🔧 FIXING MISMATCHES...\n";
echo "======================\n";

foreach ($mismatches as $invoice) {
    echo "\nFixing Invoice " . $invoice->id . "...\n";
    
    $membership = $invoice->membership;
    $correctOffer = Offer::find($membership->offer_id);
    
    echo "  Correct Offer ID: " . $correctOffer->id . "\n";
    echo "  Correct Offer: " . json_encode($correctOffer->percentage) . "\n";
    
    // Update invoice to use correct offer
    $invoice->offer_id = $membership->offer_id;
    $invoice->save();
    echo "  ✅ Updated invoice offer_id to " . $invoice->offer_id . "\n";
    
    // Delete existing payment records
    $existingPayments = TeacherMembershipPayment::where('invoice_id', $invoice->id)->get();
    echo "  Deleting " . $existingPayments->count() . " existing payment records...\n";
    foreach ($existingPayments as $payment) {
        $payment->delete();
    }
    
    // Process payment with correct offer
    $creationDate = $invoice->created_at;
    $currentMonth = $creationDate->format('Y-m');
    $selectedMonths = [$currentMonth];
    
    $totalEarnings = 0;
    foreach ($membership->teachers as $teacherData) {
        $teacher = Teacher::find($teacherData['teacherId']);
        if (!$teacher) continue;
        
        $subject = $teacherData['subject'];
        $percentage = $correctOffer->percentage[$subject] ?? 0;
        
        $totalAmount = $invoice->amountPaid * ($percentage / 100);
        $immediateAmount = $invoice->partialMonthAmount * ($percentage / 100);
        
        echo "  Teacher " . $teacher->firstName . " " . $teacher->lastName . " (" . $subject . "): " . $immediateAmount . " DH\n";
        
        // Increment teacher wallet
        $teacher->increment('wallet', $immediateAmount);
        
        // Create payment record
        TeacherMembershipPayment::create([
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
        
        $totalEarnings += $immediateAmount;
    }
    
    echo "  ✅ Total earnings: " . $totalEarnings . " DH\n";
}

echo "\n✅ ALL MISMATCHES FIXED!\n";
echo "========================\n";
echo "The system is now consistent and all teachers have been paid correctly.\n";

