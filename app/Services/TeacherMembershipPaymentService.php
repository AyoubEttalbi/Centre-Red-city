<?php

namespace App\Services;

use App\Models\TeacherMembershipPayment;
use App\Models\Teacher;
use App\Models\Membership;
use App\Models\Invoice;
use App\Models\Offer;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class TeacherMembershipPaymentService
{
    /**
     * Create or update teacher membership payment records for an invoice
     */
    public function processInvoicePayment(Invoice $invoice, array $validated)
    {
        $result = [
            'success' => false,
            'created_records' => 0,
            'updated_records' => 0,
            'errors' => []
        ];

        try {
            $membership = $invoice->membership;
            if (!$membership || !is_array($membership->teachers)) {
                $result['errors'][] = 'No membership or teachers found for invoice ' . $invoice->id;
                return $result;
            }

        // Get selected months
        $selectedMonths = $invoice->selected_months ?? [];
        if (is_string($selectedMonths)) {
            $selectedMonths = json_decode($selectedMonths, true) ?? [];
        }

        // If partial month is included, automatically add current month to selected months
        $currentMonth = now()->format('Y-m');
        if (($validated['includePartialMonth'] ?? false) && ($validated['partialMonthAmount'] ?? 0) > 0) {
            if (!in_array($currentMonth, $selectedMonths)) {
                $selectedMonths[] = $currentMonth;
                // Sort months chronologically
                sort($selectedMonths);
            }
        }

        // Fallback: if no selected_months after processing partial month, use billDate month; if missing, use created_at month
        if (empty($selectedMonths)) {
            if ($invoice->billDate) {
                $selectedMonths = [$invoice->billDate->format('Y-m')];
            } else {
                $createdMonth = $invoice->created_at ? $invoice->created_at->format('Y-m') : null;
                $selectedMonths = [$createdMonth];
            }
        }

        // Calculate the percentage of the amount paid (cumulatively for the invoice) to the total invoice amount
        $paymentPercentage = 0;
        $totalInvoiceAmount = round((float)($invoice->totalAmount ?? 0), 2);
        $amountPaidCumulative = round((float)($invoice->amountPaid ?? 0), 2);

        if ($totalInvoiceAmount > 0) {
            $paymentPercentage = ($amountPaidCumulative / $totalInvoiceAmount) * 100;
        } else {
            // If totalAmount is 0 (unlikely for an invoice), but some amount is paid, consider it 100% paid.
            $paymentPercentage = $amountPaidCumulative > 0 ? 100 : 0;
        }

        // Cap payment percentage at 100% to prevent over-calculation
        $paymentPercentage = min($paymentPercentage, 100);
        $paymentPercentage = round($paymentPercentage, 2);

        // Debug logging for payment processing
        Log::info('Payment processing details', [
            'invoice_id' => $invoice->id,
            'validated_total_amount' => $validated['totalAmount'],
            'validated_amount_paid_current_transaction' => $validated['amountPaid'], // This is the current transaction amount
            'invoice_total_amount_cumulative' => $totalInvoiceAmount, // Total invoice value
            'invoice_amount_paid_cumulative' => $amountPaidCumulative, // Cumulative paid for invoice
            'include_partial_month' => $validated['includePartialMonth'] ?? false,
            'partial_month_amount' => round((float)($validated['partialMonthAmount'] ?? 0), 2),
            'payment_percentage' => $paymentPercentage,
            'original_selected_months' => $invoice->selected_months,
            'final_selected_months' => $selectedMonths,
            'current_month' => $currentMonth,
            'current_month_added_to_selected' => in_array($currentMonth, $selectedMonths)
        ]);

        // Process each teacher
        foreach ($membership->teachers as $teacherData) {
            $this->processTeacherPayment(
                $teacherData,
                $membership,
                $invoice,
                $selectedMonths,
                $paymentPercentage,
                $validated,
                round((float)($validated['partialMonthAmount'] ?? 0), 2)
            );
        }
        
        // Validate that payment records were created
        $createdRecords = TeacherMembershipPayment::where('invoice_id', $invoice->id)->count();
        if ($createdRecords === 0) {
            $result['errors'][] = 'No payment records were created for invoice ' . $invoice->id;
            Log::error('No payment records created', ['invoice_id' => $invoice->id]);
        } else {
            $result['success'] = true;
            $result['created_records'] = $createdRecords;
            Log::info('Payment records created successfully', [
                'invoice_id' => $invoice->id,
                'created_records' => $createdRecords
            ]);
        }
        
        } catch (\Exception $e) {
            $result['errors'][] = $e->getMessage();
            Log::error('Error in payment processing', [
                'invoice_id' => $invoice->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
        
        return $result;
    }

    /**
     * Process payment for a specific teacher
     */
    private function processTeacherPayment(
        array $teacherData,
        Membership $membership,
        Invoice $invoice,
        array $selectedMonths,
        float $paymentPercentage,
        array $validated,
        float $partialMonthAmount = 0
    ) {
        $teacher = Teacher::find($teacherData['teacherId']);
        if (!$teacher) {
            return;
        }

        // Get teacher subject and percentage from offer
        $offer = $membership->offer;
        $teacherSubject = $teacherData['subject'] ?? null;

        // If subject is not provided in teacherData, try to map it from offer percentages
        if (!$teacherSubject && $offer && is_array($offer->percentage)) {
            $subjects = array_keys($offer->percentage);
            $teacherIndex = array_search($teacherData['teacherId'], array_column($membership->teachers, 'teacherId'));
            if ($teacherIndex !== false && isset($subjects[$teacherIndex])) {
                $teacherSubject = $subjects[$teacherIndex];
            }
        }

        if (!$offer || !is_array($offer->percentage)) {
            Log::warning('Missing offer or percentage array; proceeding with 0% for teacher', [
                'teacher_id' => $teacherData['teacherId'],
                'offer_id' => $offer->id ?? null,
                'membership_id' => $membership->id
            ]);
        }

        if (!$teacherSubject) {
            Log::warning('Missing teacher subject in membership teachers; proceeding with 0% for teacher', [
                'teacher_id' => $teacherData['teacherId'],
                'membership_id' => $membership->id
            ]);
        }

        $teacherPercentage = 0.0;
        if ($offer && is_array($offer->percentage) && $teacherSubject) {
            $teacherPercentage = round((float)($offer->percentage[$teacherSubject] ?? 0), 2);
        }

        // 1. Calculate total teacher amount based on student's CUMULATIVE payment × teacher percentage
        $studentTotalPaidCumulative = round((float)($invoice->amountPaid ?? 0), 2);
        $totalTeacherAmount = round(($studentTotalPaidCumulative * $teacherPercentage / 100), 2);

        $currentMonth = now()->format('Y-m');
        $isCurrentMonthIncluded = in_array($currentMonth, $selectedMonths);

        // 2. Calculate amount for current month (immediate payment)
        $immediateWalletAmount = 0;
        if ($isCurrentMonthIncluded) {
            if (($validated['includePartialMonth'] ?? false) && $partialMonthAmount > 0) {
                $immediateWalletAmount = round(($partialMonthAmount * $teacherPercentage / 100), 2);
            } else {
                // Current month is selected but no specific partial amount, means full month paid immediately
                // Use the same logic as frontend: if includePartialMonth is true but partialMonthAmount is 0,
                // still use the partial month logic with the full amount
                if (($validated['includePartialMonth'] ?? false)) {
                    // Even if partialMonthAmount is 0, use the full amountPaid for partial month calculation
                    $immediateWalletAmount = round(($studentTotalPaidCumulative * $teacherPercentage / 100), 2);
                } else {
                    // No partial month, use normal division
                    $allSelectedMonthsCount = count($selectedMonths);
                    $actualMonthlyShare = $allSelectedMonthsCount > 0 ? round(($totalTeacherAmount / $allSelectedMonthsCount), 2) : 0;
                    $immediateWalletAmount = $actualMonthlyShare;
                }
            }
        }

        // 3. Monthly amount for scheduled payments (future months)
        $futureMonths = array_filter($selectedMonths, function($month) use ($currentMonth) {
            return $month > $currentMonth;
        });
        $futureMonthsCount = count($futureMonths);
        $monthlyTeacherAmount = 0;
        if ($futureMonthsCount > 0) {
            $remainingAmountForFutureMonths = round(($totalTeacherAmount - $immediateWalletAmount), 2);
            $monthlyTeacherAmount = round(($remainingAmountForFutureMonths / $futureMonthsCount), 2);
        }

        // Debug logging
        Log::info('Teacher payment calculation details', [
            'teacher_id' => $teacher->id,
            'teacher_subject' => $teacherSubject,
            'teacher_percentage' => $teacherPercentage,
            'student_total_paid_cumulative' => $studentTotalPaidCumulative,
            'selected_months' => $selectedMonths,
            'all_selected_months_count' => count($selectedMonths),
            'future_months' => $futureMonths,
            'future_months_count' => $futureMonthsCount,
            'current_month' => $currentMonth,
            'is_current_month_included' => $isCurrentMonthIncluded,
            'calculated_immediate_amount' => $immediateWalletAmount,
            'total_teacher_amount' => $totalTeacherAmount,
            'monthly_teacher_amount' => $monthlyTeacherAmount,
            'partial_month_amount_input' => $partialMonthAmount,
            'include_partial_month' => $validated['includePartialMonth'] ?? false,
            'total_teacher_amount_formula' => "($studentTotalPaidCumulative × $teacherPercentage / 100)",
            'immediate_amount_formula' => ($isCurrentMonthIncluded ? (($partialMonthAmount > 0) ? "($partialMonthAmount × $teacherPercentage / 100)" : "$totalTeacherAmount / " . count($selectedMonths)) : '0'),
            'monthly_amount_formula' => ($futureMonthsCount > 0 ? "($totalTeacherAmount - $immediateWalletAmount) / $futureMonthsCount" : '0'),
        ]);

        // Check if there's an existing record for this teacher and INVOICE (regardless of active status)
        $existingRecord = TeacherMembershipPayment::where('teacher_id', $teacher->id)
            ->where('invoice_id', $invoice->id)
            ->first();

        if ($existingRecord) {
            Log::info('Found existing record - updating', [
                'record_id' => $existingRecord->id,
                'teacher_id' => $teacher->id,
                'invoice_id' => $invoice->id,
                'existing_payment_percentage' => $existingRecord->payment_percentage,
                'new_payment_percentage' => $paymentPercentage,
                'was_inactive' => !$existingRecord->is_active
            ]);
            if (!$existingRecord->is_active) {
                $existingRecord->update(['is_active' => true]);
                Log::info('Reactivated inactive record', ['record_id' => $existingRecord->id]);
            }
            $this->updateExistingRecord($existingRecord, $selectedMonths, $totalTeacherAmount, $monthlyTeacherAmount, $paymentPercentage, $immediateWalletAmount, $partialMonthAmount, $validated);
        } else {
            Log::info('No existing record found - creating new', [
                'teacher_id' => $teacher->id,
                'invoice_id' => $invoice->id,
                'payment_percentage' => $paymentPercentage
            ]);
            $this->createNewRecord(
                $teacher,
                $membership,
                $invoice,
                $selectedMonths,
                $totalTeacherAmount,
                $monthlyTeacherAmount,
                $paymentPercentage,
                $teacherSubject,
                $teacherPercentage,
                $immediateWalletAmount, // Pass calculated immediateWalletAmount
                $partialMonthAmount,
                $validated
            );
        }
    }

    /**
     * Reactivate payment records for fully paid invoices
     */
    public function reactivatePaymentRecords(Invoice $invoice)
    {
        $result = [
            'success' => false,
            'reactivated_records' => 0,
            'errors' => []
        ];

        try {
            // Only reactivate if invoice is fully paid
            if ($invoice->amountPaid < $invoice->totalAmount) {
                $result['errors'][] = 'Invoice is not fully paid (amountPaid: ' . $invoice->amountPaid . ', totalAmount: ' . $invoice->totalAmount . ')';
                return $result;
            }

            $records = TeacherMembershipPayment::where('invoice_id', $invoice->id)
                ->where('is_active', false)
                ->get();

            foreach ($records as $record) {
                $record->update([
                    'is_active' => true,
                    'months_rest_not_paid_yet' => [] // Clear unpaid months for fully paid invoices
                ]);

                Log::info('Reactivated payment record', [
                    'record_id' => $record->id,
                    'invoice_id' => $invoice->id,
                    'teacher_id' => $record->teacher_id
                ]);
            }

            $result['success'] = true;
            $result['reactivated_records'] = $records->count();

            Log::info('Payment records reactivated', [
                'invoice_id' => $invoice->id,
                'reactivated_count' => $records->count()
            ]);

        } catch (\Exception $e) {
            $result['errors'][] = $e->getMessage();
            Log::error('Error reactivating payment records', [
                'invoice_id' => $invoice->id,
                'error' => $e->getMessage()
            ]);
        }

        return $result;
    }

    /**
     * Create a new teacher membership payment record
     */
    private function createNewRecord(
        Teacher $teacher,
        Membership $membership,
        Invoice $invoice,
        array $selectedMonths,
        float $totalTeacherAmount,
        float $monthlyTeacherAmount,
        float $paymentPercentage,
        string $teacherSubject,
        float $teacherPercentage,
        float $immediateWalletAmount, // Now directly receive this
        float $partialMonthAmount = 0,
        array $validated = []
    ) {
        $currentMonth = now()->format('Y-m');
        
        // Check if current month is included in selected months
        $isCurrentMonthIncluded = in_array($currentMonth, $selectedMonths);

        // The immediateWalletAmount is now calculated in processTeacherPayment
        // No need to recalculate here. Just ensure wallet increment if needed.

        if ($immediateWalletAmount > 0) {
            $teacher->increment('wallet', $immediateWalletAmount);
            Log::info('Immediately incremented teacher wallet for current month (creation)', [
                'teacher_id' => $teacher->id,
                'amount' => $immediateWalletAmount,
                'month' => $currentMonth,
                'partial_month_amount' => round($partialMonthAmount, 2),
                'teacher_percentage' => round($teacherPercentage, 2),
                'is_partial_month' => ($validated['includePartialMonth'] ?? false) && $partialMonthAmount > 0,
            ]);
        }

        // Future months will be handled by scheduled payments
        $futureMonths = array_filter($selectedMonths, function($month) use ($currentMonth) {
            return $month > $currentMonth;
        });

        // If current month is included, it's already paid, so only future months remain unpaid
        // If current month is not included, all selected months are unpaid
        $unpaidMonths = array_values($futureMonths); // Always use future months as unpaid if current is handled.

        TeacherMembershipPayment::create([
            'student_id' => $membership->student_id,
            'teacher_id' => $teacher->id,
            'membership_id' => $membership->id,
            'invoice_id' => $invoice->id,
            'selected_months' => $selectedMonths,
            'months_rest_not_paid_yet' => $unpaidMonths, // Only future months
            'total_teacher_amount' => round($totalTeacherAmount, 2),
            'monthly_teacher_amount' => round($monthlyTeacherAmount, 2),
            'payment_percentage' => round($paymentPercentage, 2),
            'teacher_subject' => $teacherSubject,
            'teacher_percentage' => round($teacherPercentage, 2),
            'immediate_wallet_amount' => round($immediateWalletAmount, 2), // Store the immediate amount
            'total_paid_to_teacher' => round($immediateWalletAmount, 2), // Initial payment (immediate amount)
            'is_active' => true,
        ]);

        Log::info('Created teacher membership payment record', [
            'teacher_id' => $teacher->id,
            'membership_id' => $membership->id,
            'invoice_id' => $invoice->id,
            'total_amount' => round($totalTeacherAmount, 2),
            'monthly_amount' => round($monthlyTeacherAmount, 2),
            'selected_months' => $selectedMonths,
            'current_month' => $currentMonth,
            'is_current_month_included' => $isCurrentMonthIncluded,
            'current_month_paid_immediately' => $isCurrentMonthIncluded,
            'immediate_wallet_amount' => round($immediateWalletAmount, 2),
            'partial_month_amount' => round($partialMonthAmount, 2),
            'include_partial_month' => $validated['includePartialMonth'] ?? false,
            'unpaid_months_count' => count($unpaidMonths),
            'future_months_remaining' => $futureMonths,
            'unpaid_months_record' => $unpaidMonths,
        ]);
    }

    /**
     * Update an existing teacher membership payment record
     */
    private function updateExistingRecord(
        TeacherMembershipPayment $record,
        array $selectedMonths,
        float $totalTeacherAmount, // This is the total amount from the original processTeacherPayment, not the new one.
        float $monthlyTeacherAmount, // Same here, this is the original monthly amount.
        float $paymentPercentage,
        float $immediateWalletAmountFromCall, // This is the immediate amount calculated in processTeacherPayment
        float $partialMonthAmount = 0,
        array $validated = [] // Add validated to parameter list
    ) {
        // Merge new selected months with existing ones
        $allSelectedMonths = array_unique(array_merge($record->selected_months ?? [], $selectedMonths));
        sort($allSelectedMonths); // Ensure months are sorted

        $offer = $record->membership->offer;
        $teacherPercentage = round((float)($offer->percentage[$record->teacher_subject] ?? 0), 2);

        // Get the current invoice to know the total amount paid by student
        $currentInvoice = $record->invoice;
        $studentTotalPaid = round((float)($currentInvoice->amountPaid ?? 0), 2);

        // 1. Calculate total teacher amount based on student's payment × teacher percentage
        $newTotalAmount = round(($studentTotalPaid * $teacherPercentage / 100), 2);

        $currentMonth = now()->format('Y-m');
        $isCurrentMonthIncluded = in_array($currentMonth, $allSelectedMonths);

        // Get the old immediate wallet amount from the record
        $oldImmediateWalletAmount = round((float)($record->immediate_wallet_amount ?? 0), 2);
        $oldTotalPaidToTeacher = round((float)($record->total_paid_to_teacher ?? 0), 2);

        // 2. Calculate new immediate wallet amount for current month
        $newImmediateWalletAmount = 0;
        if ($isCurrentMonthIncluded) {
            if (($validated['includePartialMonth'] ?? false) && $partialMonthAmount > 0) {
                // Student chose to pay for current month with partial amount
                $newImmediateWalletAmount = round(($partialMonthAmount * $teacherPercentage / 100), 2);
            } else {
                // Current month is selected but no specific partial amount, means full month paid immediately
                // Calculate actual monthly teacher amount based on total paid and all months
                $allSelectedMonthsCount = count($allSelectedMonths);
                $actualMonthlyShare = $allSelectedMonthsCount > 0 ? round(($newTotalAmount / $allSelectedMonthsCount), 2) : 0;
                $newImmediateWalletAmount = $actualMonthlyShare;
            }
        }

        // 3. Calculate the difference in immediate wallet amount
        $walletDifference = round(($newImmediateWalletAmount - $oldImmediateWalletAmount), 2);

        // Only modify wallet if there's a difference
        if ($walletDifference != 0) {
            $teacher = Teacher::find($record->teacher_id);
            if ($teacher) {
                $teacherWalletBefore = round((float)($teacher->wallet), 2);
                if ($walletDifference > 0) {
                    $teacher->increment('wallet', $walletDifference);
                    Log::info('Incremented teacher wallet due to increased immediate amount in update', [
                        'teacher_id' => $teacher->id,
                        'old_immediate_amount' => $oldImmediateWalletAmount,
                        'new_immediate_amount' => $newImmediateWalletAmount,
                        'difference' => $walletDifference,
                        'wallet_before_op' => $teacherWalletBefore,
                        'wallet_after_op' => round((float)($teacher->wallet), 2),
                        'expected_wallet_after' => round(($teacherWalletBefore + $walletDifference), 2),
                    ]);
                } else {
                    $decrementAmount = abs($walletDifference);
                    $teacher->decrement('wallet', $decrementAmount);
                    Log::info('Decremented teacher wallet due to decreased immediate amount in update', [
                        'teacher_id' => $teacher->id,
                        'old_immediate_amount' => $oldImmediateWalletAmount,
                        'new_immediate_amount' => $newImmediateWalletAmount,
                        'difference' => $walletDifference,
                        'decrement_amount' => $decrementAmount,
                        'wallet_before_op' => $teacherWalletBefore,
                        'wallet_after_op' => round((float)($teacher->wallet), 2),
                        'expected_wallet_after' => round(($teacherWalletBefore - $decrementAmount), 2),
                    ]);
                }
            }
        } else {
            Log::info('No wallet change needed in update - immediate amount unchanged', [
                'teacher_id' => $record->teacher_id,
                'old_immediate_amount' => $oldImmediateWalletAmount,
                'new_immediate_amount' => $newImmediateWalletAmount,
                'difference' => $walletDifference
            ]);
        }

        // 4. Calculate monthly amount for scheduled payments (future months only)
        // This MUST be calculated AFTER newImmediateWalletAmount is finalized
        $futureMonths = array_filter($allSelectedMonths, function($month) use ($currentMonth) {
            return $month > $currentMonth;
        });
        $futureMonthsCount = count($futureMonths);

        $newMonthlyAmount = 0;
        if ($futureMonthsCount > 0) {
            $remainingAmountForFutureMonths = round(($newTotalAmount - $newImmediateWalletAmount), 2);
            $newMonthlyAmount = round(($remainingAmountForFutureMonths / $futureMonthsCount), 2);
        }

        // Add new months to unpaid list, filtering out current month if it's handled immediately
        $unpaidMonths = array_unique(array_merge($record->months_rest_not_paid_yet ?? [], $selectedMonths));
        if ($isCurrentMonthIncluded) {
            $unpaidMonths = array_filter($unpaidMonths, function($month) use ($currentMonth) {
                return $month !== $currentMonth;
            });
        }
        $unpaidMonths = array_values($unpaidMonths); // Re-index array

        // Calculate new total paid to teacher (cumulative: immediate + already processed scheduled payments)
        // We subtract the old immediate amount and add the new one, keeping previous scheduled payments.
        $newTotalPaidToTeacher = round((($oldTotalPaidToTeacher - $oldImmediateWalletAmount) + $newImmediateWalletAmount), 2);

        $record->update([
            'selected_months' => $allSelectedMonths,
            'months_rest_not_paid_yet' => $unpaidMonths,
            'total_teacher_amount' => $newTotalAmount,
            'monthly_teacher_amount' => $newMonthlyAmount,
            'payment_percentage' => $paymentPercentage,
            'immediate_wallet_amount' => $newImmediateWalletAmount, // Recalculated, not added
            'total_paid_to_teacher' => $newTotalPaidToTeacher, // Recalculated, cumulative
            'is_active' => true, // Ensure record stays active for potential updates
        ]);

        Log::info('Updated teacher membership payment record', [
            'record_id' => $record->id,
            'new_total_amount' => $newTotalAmount,
            'new_monthly_amount' => $newMonthlyAmount,
            'all_selected_months' => $allSelectedMonths,
            'current_month_paid_immediately' => $isCurrentMonthIncluded,
            'unpaid_months_count' => count($unpaidMonths),
            'immediate_wallet_amount_before_record' => $oldImmediateWalletAmount,
            'immediate_wallet_amount_after_record' => $newImmediateWalletAmount,
            'total_paid_to_teacher_before_record' => $oldTotalPaidToTeacher,
            'total_paid_to_teacher_after_record' => $newTotalPaidToTeacher, // Log cumulative
            'wallet_difference_applied' => $walletDifference,
            'record_reactivated' => true,
            'recalculation_details' => [
                'old_total_amount' => $record->total_teacher_amount,
                'student_total_paid_cumulative' => $studentTotalPaid,
                'teacher_percentage' => $teacherPercentage,
                'total_selected_months_count' => count($allSelectedMonths),
                'total_teacher_amount_formula' => "($studentTotalPaid × $teacherPercentage / 100)",
                'monthly_amount_calculation' => [
                    'future_months_count' => $futureMonthsCount,
                    'remaining_amount_for_future_months' => round(($newTotalAmount - $newImmediateWalletAmount), 2),
                    'monthly_amount_formula' => ($futureMonthsCount > 0 ? "($newTotalAmount - $newImmediateWalletAmount) / $futureMonthsCount" : "0"),
                ],
                'immediate_calculation_details' => [
                    'current_month_included' => $isCurrentMonthIncluded,
                    'partial_month_amount_input' => round($partialMonthAmount, 2),
                    'calculated_immediate_amount' => $newImmediateWalletAmount,
                    'reason' => ($isCurrentMonthIncluded ? (($partialMonthAmount > 0) ? 'partial_month_payment' : 'full_current_month_payment') : 'no_current_month_payment')
                ],
                'total_paid_to_teacher_cumulative_calc' => "($oldTotalPaidToTeacher - $oldImmediateWalletAmount) + $newImmediateWalletAmount"
            ],
        ]);
    }

    /**
     * Clean up duplicate records for the same invoice and teacher
     * This method should be called manually to fix existing duplicates
     */
    public function cleanupDuplicateRecords()
    {
        Log::info('Starting cleanup of duplicate teacher membership payment records');
        
        $duplicates = DB::table('teacher_membership_payments')
            ->select('invoice_id', 'teacher_id', DB::raw('COUNT(*) as count'))
            ->groupBy('invoice_id', 'teacher_id')
            ->having('count', '>', 1)
            ->get();
        
        $cleanedCount = 0;
        
        foreach ($duplicates as $duplicate) {
            $records = TeacherMembershipPayment::where('invoice_id', $duplicate->invoice_id)
                ->where('teacher_id', $duplicate->teacher_id)
                ->orderBy('created_at', 'desc')
                ->get();
            
            // Keep the most recent record, delete the rest
            $keepRecord = $records->first();
            $deleteRecords = $records->slice(1);
            
            foreach ($deleteRecords as $deleteRecord) {
                Log::info('Deleting duplicate record', [
                    'duplicate_id' => $deleteRecord->id,
                    'invoice_id' => $duplicate->invoice_id,
                    'teacher_id' => $duplicate->teacher->id,
                    'kept_record_id' => $keepRecord->id
                ]);
                $deleteRecord->delete();
                $cleanedCount++;
            }
        }
        
        Log::info('Completed cleanup of duplicate records', [
            'duplicates_found' => $duplicates->count(),
            'records_deleted' => $cleanedCount
        ]);
        
        return [
            'duplicates_found' => $duplicates->count(),
            'records_deleted' => $cleanedCount
        ];
    }

    /**
     * Process monthly payments for all teachers
     * This should be called by a scheduled job at the start of each month
     */
    public function processMonthlyPayments($currentMonth = null)
    {
        $currentMonth = $currentMonth ?? now()->format('Y-m');
        
        Log::info('Starting monthly teacher payment processing', ['month' => $currentMonth]);

        $records = TeacherMembershipPayment::active()
            ->withUnpaidCurrentMonth($currentMonth)
            ->with(['teacher', 'membership', 'student'])
            ->get();

        $processedCount = 0;
        $totalAmount = 0;

        foreach ($records as $record) {
            try {
                DB::beginTransaction();

                // Increment teacher wallet
                $teacher = $record->teacher;
                $monthlyAmount = round((float)$record->monthly_teacher_amount, 2);
                
                $teacher->increment('wallet', $monthlyAmount);

                // Update total paid to teacher
                $record->increment('total_paid_to_teacher', $monthlyAmount);

                // Mark this month as paid
                $record->markMonthAsPaid($currentMonth);

                // Keep record active even when all months are paid
                // This allows the record to be updated when invoices are modified
                // Records are only deactivated when invoices are deleted
                if ($record->isFullyPaid()) {
                    Log::info('All months paid but keeping record active for potential updates', [
                        'record_id' => $record->id,
                        'teacher_id' => $teacher->id,
                        'selected_months' => $record->selected_months,
                        'months_rest_not_paid_yet' => $record->months_rest_not_paid_yet
                    ]);
                }

                $processedCount++;
                $totalAmount += $monthlyAmount;

                Log::info('Processed monthly payment for teacher', [
                    'teacher_id' => $teacher->id,
                    'teacher_name' => $teacher->first_name . ' ' . $teacher->last_name,
                    'amount' => $monthlyAmount,
                    'month' => $currentMonth,
                    'student_name' => $record->student ? $record->student->firstName . ' ' . $record->student->lastName : 'Unknown'
                ]);

                DB::commit();
            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('Error processing monthly payment for teacher', [
                    'teacher_id' => $record->teacher_id,
                    'record_id' => $record->id,
                    'month' => $currentMonth,
                    'error' => $e->getMessage()
                ]);
            }
        }

        Log::info('Completed monthly teacher payment processing', [
            'month' => $currentMonth,
            'processed_count' => $processedCount,
            'total_amount' => $totalAmount
        ]);

        return [
            'processed_count' => $processedCount,
            'total_amount' => $totalAmount,
            'month' => $currentMonth
        ];
    }

    /**
     * Reverse teacher payments when an invoice is updated or deleted
     * Business rules provided by client:
     * - Multi-month invoices: if within 10 days of billing, decrement ALL months (current + future); if after 10 days, only decrement future months, keep current month.
     * - Single-month invoices: if current month and within 10 days after billing date, decrement the amount; otherwise do not decrement.
     */
    public function reverseInvoicePayments(Invoice $invoice, array $oldData = null)
    {
        $membership = $invoice->membership;
        if (!$membership) {
            return;
        }

        $currentMonth = now()->format('Y-m');
        $billingDate = $invoice->billDate;
        $daysSinceBilling = $billingDate ? now()->diffInDays($billingDate) : 999; // If no billing date, treat as expired

        // Find all active records for this membership and invoice
        $records = TeacherMembershipPayment::active()
            ->where('membership_id', $membership->id)
            ->where('invoice_id', $invoice->id)
            ->get();

        foreach ($records as $record) {
            $this->reverseTeacherPayment($record, $invoice, $currentMonth, $daysSinceBilling);
        }
    }

    /**
     * Reverse a specific teacher payment record based on client rules
     */
    private function reverseTeacherPayment(TeacherMembershipPayment $record, Invoice $invoice, string $currentMonth, int $daysSinceBilling)
    {
        try {
            $teacher = Teacher::find($record->teacher_id);
            if (!$teacher) {
                Log::warning('Teacher not found for reversal', ['record_id' => $record->id]);
                return;
            }

            $selectedMonths = $record->selected_months ?? [];
            sort($selectedMonths);
            $monthsCount = count($selectedMonths);

            // Default: do not decrement, only stop future months
            $shouldDecrement = false;
            $amountToReverse = 0.0;

            if ($monthsCount <= 1) {
                // Single-month logic
                $onlyMonth = $monthsCount === 1 ? $selectedMonths[0] : null;
                if ($onlyMonth) {
                    if ($onlyMonth === $currentMonth) {
                        // Current month: allow decrement only within 10 days after billing date
                        if ($daysSinceBilling <= 10) {
                            $shouldDecrement = true;
                            // Reverse whatever was paid to teacher for this invoice (immediate for single month)
                            $amountToReverse = round((float)($record->total_paid_to_teacher ?? 0), 2);
                        }
                    } elseif ($onlyMonth > $currentMonth) {
                        // Future month: no decrement, just stop it
                        $shouldDecrement = false;
                    } else {
                        // Past month: do not decrement
                        $shouldDecrement = false;
                    }
                }
            } else {
                // Multi-month logic: apply 10-day rule
                $futureMonths = array_filter($selectedMonths, function($month) use ($currentMonth) {
                    return $month > $currentMonth;
                });
                $currentMonthIncluded = in_array($currentMonth, $selectedMonths);
                
                if ($daysSinceBilling <= 10) {
                    // Within 10 days: decrement ALL months (current + future)
                    $shouldDecrement = true;
                    $amountToReverse = round((float)($record->total_paid_to_teacher ?? 0), 2);
                } else {
                    // After 10 days: only decrement future months, keep current month
                    if (count($futureMonths) > 0) {
                        $shouldDecrement = true;
                        // Calculate amount for future months only
                        $totalAmount = round((float)($record->total_teacher_amount ?? 0), 2);
                        $allMonthsCount = count($selectedMonths);
                        $futureMonthsCount = count($futureMonths);
                        $amountToReverse = round(($totalAmount / $allMonthsCount) * $futureMonthsCount, 2);
                    } else {
                        // No future months to decrement
                        $shouldDecrement = false;
                    }
                }
            }

            Log::info('Reversal decision', [
                'record_id' => $record->id,
                'teacher_id' => $teacher->id,
                'selected_months' => $selectedMonths,
                'months_count' => $monthsCount,
                'current_month' => $currentMonth,
                'days_since_billing' => $daysSinceBilling,
                'billing_date' => $invoice->billDate?->format('Y-m-d'),
                'should_decrement' => $shouldDecrement,
                'calculated_amount_to_reverse' => $amountToReverse,
                'reversal_rule' => $monthsCount <= 1 ? 'single_month' : 'multi_month',
                'future_months_count' => $monthsCount > 1 ? count($futureMonths) : 0,
                'current_month_included' => $monthsCount > 1 ? $currentMonthIncluded : null,
            ]);

            if ($shouldDecrement && $amountToReverse > 0) {
                $teacherWalletBefore = round((float)($teacher->wallet), 2);
                $teacher->decrement('wallet', $amountToReverse);
                Log::info('Decremented teacher wallet due to allowed reversal', [
                    'record_id' => $record->id,
                    'teacher_id' => $teacher->id,
                    'invoice_id' => $invoice->id,
                    'amount_reversed' => $amountToReverse,
                    'wallet_before_op' => $teacherWalletBefore,
                    'wallet_after_op' => round((float)($teacher->wallet), 2),
                ]);
            }

            // Stop future months: deactivate record and clear remaining unpaid months
            $record->update([
                'is_active' => false,
                'months_rest_not_paid_yet' => [],
            ]);

            Log::info('Deactivated teacher membership payment record and cleared unpaid months', [
                'record_id' => $record->id,
                'teacher_id' => $teacher->id,
                'invoice_id' => $invoice->id
            ]);

        } catch (\Exception $e) {
            Log::error('Error reversing teacher payment', [
                'record_id' => $record->id,
                'teacher_id' => $record->teacher_id,
                'invoice_id' => $invoice->id,
                'error' => $e->getMessage(),
            ]);
            try {
                $record->update(['is_active' => false]);
            } catch (\Exception $deactivationError) {
                Log::error('Failed to deactivate record after reversal error', [
                    'record_id' => $record->id,
                    'error' => $deactivationError->getMessage()
                ]);
            }
        }
    }

    /**
     * Get teacher earnings summary for a specific period
     */
    public function getTeacherEarningsSummary($teacherId = null, $startMonth = null, $endMonth = null)
    {
        $query = TeacherMembershipPayment::active()
            ->with(['teacher', 'student', 'membership']);

        if ($teacherId) {
            $query->where('teacher_id', $teacherId);
        }

        if ($startMonth) {
            $query->whereJsonContains('selected_months', $startMonth);
        }

        if ($endMonth) {
            $query->whereJsonContains('selected_months', $endMonth);
        }

        return $query->get();
    }

    /**
     * Calculate how much a teacher has been paid for a specific invoice
     */
    public function calculateTeacherPaidAmount(TeacherMembershipPayment $record): array
    {
        $totalSelectedMonths = count($record->selected_months ?? []);
        $remainingUnpaidMonths = count($record->months_rest_not_paid_yet ?? []);
        $monthsPaid = $totalSelectedMonths - $remainingUnpaidMonths;
        $scheduledPaidAmount = round(($monthsPaid * ($record->monthly_teacher_amount ?? 0)), 2);
        
        // Include immediate amount that was paid
        $immediatePaidAmount = round((float)($record->immediate_wallet_amount ?? 0), 2);
        $totalPaidAmount = round(($scheduledPaidAmount + $immediatePaidAmount), 2);

        return [
            'total_selected_months' => $totalSelectedMonths,
            'remaining_unpaid_months' => $remainingUnpaidMonths,
            'months_paid' => $monthsPaid,
            'monthly_amount' => round((float)($record->monthly_teacher_amount ?? 0), 2),
            'scheduled_paid_amount' => $scheduledPaidAmount,
            'immediate_paid_amount' => $immediatePaidAmount,
            'total_paid_amount' => $totalPaidAmount,
            'selected_months' => $record->selected_months,
            'unpaid_months' => $record->months_rest_not_paid_yet
        ];
    }

}