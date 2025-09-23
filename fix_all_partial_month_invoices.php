// Comprehensive fix for all invoices with partial month payment issues
use App\Models\Invoice;
use App\Models\Membership;
use App\Models\Teacher;
use App\Models\Offer;
use App\Models\TeacherMembershipPayment;

echo "=== COMPREHENSIVE FIX FOR PARTIAL MONTH PAYMENT ISSUES ===\n";

// Find all invoices with empty selected_months but includePartialMonth = 1
$problematicInvoices = Invoice::where('includePartialMonth', 1)
    ->where(function($query) {
        $query->where('selected_months', '[]')
              ->orWhere('selected_months', '')
              ->orWhereNull('selected_months');
    })
    ->with(['membership.student', 'offer'])
    ->get();

echo "Found " . $problematicInvoices->count() . " invoices with partial month payment issues\n\n";

$fixedInvoices = 0;
$fixedMemberships = 0;
$totalWalletIncrements = 0;
$totalPaymentRecords = 0;

foreach ($problematicInvoices as $invoice) {
    echo "=== PROCESSING INVOICE " . $invoice->id . " ===\n";
    echo "Creation Date: " . $invoice->created_at . "\n";
    echo "Bill Date: " . $invoice->billDate . "\n";
    echo "Amount Paid: " . $invoice->amountPaid . "\n";
    echo "Partial Month Amount: " . $invoice->partialMonthAmount . "\n";
    
    $membership = $invoice->membership;
    if (!$membership) {
        echo "ERROR: No membership found for invoice " . $invoice->id . "\n";
        continue;
    }
    
    echo "Membership ID: " . $membership->id . "\n";
    echo "Student: " . $membership->student->firstName . " " . $membership->student->lastName . "\n";
    
    // Check if teachers have subject fields
    $needsSubjectFix = false;
    if (is_array($membership->teachers)) {
        foreach ($membership->teachers as $teacherData) {
            if (!isset($teacherData['subject'])) {
                $needsSubjectFix = true;
                break;
            }
        }
    }
    
    if ($needsSubjectFix) {
        echo "Fixing missing subject fields in membership " . $membership->id . "...\n";
        
        $offer = $membership->offer;
        if (!$offer) {
            echo "ERROR: No offer found for membership " . $membership->id . "\n";
            continue;
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
            echo "  Fixed teacher " . $teacher->firstName . " " . $teacher->lastName . " - Subject: " . $subjectName . "\n";
        }
        
        // Update the membership
        $membership->teachers = $fixedTeachers;
        $membership->save();
        echo "Membership " . $membership->id . " updated successfully!\n";
        $fixedMemberships++;
    } else {
        echo "Membership " . $membership->id . " already has subject fields.\n";
    }
    
    // Check if payment records already exist
    $existingPayments = TeacherMembershipPayment::where('invoice_id', $invoice->id)->count();
    if ($existingPayments > 0) {
        echo "Payment records already exist for invoice " . $invoice->id . " (skipping)\n\n";
        continue;
    }
    
    // Process the payment using the CREATION DATE
    echo "Processing payment using creation date...\n";
    
    // Use the creation date as the "current month" for processing
    $creationDate = $invoice->created_at;
    $currentMonth = $creationDate->format('Y-m');
    echo "Using creation date as current month: " . $currentMonth . "\n";
    
    $selectedMonths = $invoice->selected_months ?? [];
    if (is_string($selectedMonths)) {
        $selectedMonths = json_decode($selectedMonths, true) ?? [];
    }
    
    // Add creation month for partial payment
    if ($invoice->includePartialMonth && $invoice->partialMonthAmount > 0) {
        if (!in_array($currentMonth, $selectedMonths)) {
            $selectedMonths[] = $currentMonth;
            sort($selectedMonths);
        }
    }
    
    echo "Final selected months: " . json_encode($selectedMonths) . "\n";
    
    // Calculate payment details for each teacher
    $invoiceWalletIncrements = 0;
    $invoicePaymentRecords = 0;
    
    foreach ($membership->teachers as $teacherData) {
        $teacher = Teacher::find($teacherData['teacherId']);
        if (!$teacher) continue;
        
        $teacherSubject = $teacherData['subject'];
        $offer = $invoice->offer;
        $teacherPercentage = $offer->percentage[$teacherSubject] ?? 0;
        
        echo "  Processing Teacher: " . $teacher->firstName . " " . $teacher->lastName . " (" . $teacherSubject . ")\n";
        echo "  Percentage: " . $teacherPercentage . "%\n";
        
        $totalTeacherAmount = $invoice->amountPaid * ($teacherPercentage / 100);
        echo "  Total Teacher Amount: " . $totalTeacherAmount . "\n";
        
        $isCurrentMonthIncluded = in_array($currentMonth, $selectedMonths);
        $immediateWalletAmount = 0;
        
        if ($isCurrentMonthIncluded) {
            $immediateWalletAmount = $invoice->partialMonthAmount * ($teacherPercentage / 100);
            echo "  Immediate Amount (for " . $currentMonth . "): " . $immediateWalletAmount . "\n";
            
            // Increment teacher wallet immediately
            $teacher->increment('wallet', $immediateWalletAmount);
            echo "  Incremented teacher wallet by: " . $immediateWalletAmount . "\n";
            $invoiceWalletIncrements += $immediateWalletAmount;
        }
        
        // Calculate monthly amount for future months
        $futureMonths = array_filter($selectedMonths, function($month) use ($currentMonth) {
            return $month > $currentMonth;
        });
        $futureMonthsCount = count($futureMonths);
        $monthlyTeacherAmount = 0;
        
        if ($futureMonthsCount > 0) {
            $remainingAmountForFutureMonths = $totalTeacherAmount - $immediateWalletAmount;
            $monthlyTeacherAmount = $remainingAmountForFutureMonths / $futureMonthsCount;
        }
        
        echo "  Monthly amount for future months: " . $monthlyTeacherAmount . "\n";
        echo "  Future months count: " . $futureMonthsCount . "\n";
        
        // Create TeacherMembershipPayment record
        $paymentRecord = TeacherMembershipPayment::create([
            'student_id' => $membership->student_id,
            'teacher_id' => $teacher->id,
            'membership_id' => $membership->id,
            'invoice_id' => $invoice->id,
            'selected_months' => $selectedMonths,
            'months_rest_not_paid_yet' => array_values($futureMonths), // Only future months
            'total_teacher_amount' => round($totalTeacherAmount, 2),
            'monthly_teacher_amount' => round($monthlyTeacherAmount, 2),
            'payment_percentage' => 100, // Fully paid
            'teacher_subject' => $teacherSubject,
            'teacher_percentage' => round($teacherPercentage, 2),
            'immediate_wallet_amount' => round($immediateWalletAmount, 2),
            'total_paid_to_teacher' => round($immediateWalletAmount, 2),
            'is_active' => true,
        ]);
        
        echo "  Created payment record ID: " . $paymentRecord->id . "\n";
        $invoicePaymentRecords++;
    }
    
    echo "Invoice " . $invoice->id . " processed successfully!\n";
    echo "  Wallet increments: " . $invoiceWalletIncrements . " DH\n";
    echo "  Payment records created: " . $invoicePaymentRecords . "\n\n";
    
    $fixedInvoices++;
    $totalWalletIncrements += $invoiceWalletIncrements;
    $totalPaymentRecords += $invoicePaymentRecords;
}

echo "=== FINAL SUMMARY ===\n";
echo "Total invoices processed: " . $fixedInvoices . "\n";
echo "Total memberships fixed: " . $fixedMemberships . "\n";
echo "Total wallet increments: " . $totalWalletIncrements . " DH\n";
echo "Total payment records created: " . $totalPaymentRecords . "\n";
echo "All partial month payment issues have been resolved!\n";

