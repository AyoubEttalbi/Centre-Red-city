<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\TeacherMembershipPayment;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class PaymentMonitoringService
{
    /**
     * Get payment statistics
     */
    public function getPaymentStatistics(): array
    {
        $totalInvoices = Invoice::count();
        $paidInvoices = Invoice::where('amountPaid', '>', 0)->count();
        $totalPaymentRecords = TeacherMembershipPayment::count();
        $activePaymentRecords = TeacherMembershipPayment::where('is_active', true)->count();
        $inactivePaymentRecords = TeacherMembershipPayment::where('is_active', false)->count();
        
        $paidInvoicesWithoutPayments = Invoice::where('amountPaid', '>', 0)
            ->whereDoesntHave('teacherMembershipPayments')
            ->count();
            
        $inactiveRecordsForPaidInvoices = TeacherMembershipPayment::where('is_active', false)
            ->whereHas('invoice', function($query) {
                $query->where('amountPaid', '>', 0);
            })
            ->count();

        return [
            'total_invoices' => $totalInvoices,
            'paid_invoices' => $paidInvoices,
            'total_payment_records' => $totalPaymentRecords,
            'active_payment_records' => $activePaymentRecords,
            'inactive_payment_records' => $inactivePaymentRecords,
            'paid_invoices_without_payments' => $paidInvoicesWithoutPayments,
            'inactive_records_for_paid_invoices' => $inactiveRecordsForPaidInvoices
        ];
    }

    /**
     * Check for payment consistency issues
     */
    public function checkPaymentConsistency(): array
    {
        $issues = [];

        // Check for paid invoices without payment records
        $paidInvoicesWithoutPayments = Invoice::where('amountPaid', '>', 0)
            ->whereDoesntHave('teacherMembershipPayments')
            ->count();
            
        if ($paidInvoicesWithoutPayments > 0) {
            $issues[] = [
                'type' => 'paid_invoices_without_payments',
                'description' => 'Paid invoices without teacher payment records',
                'count' => $paidInvoicesWithoutPayments
            ];
        }

        // Check for inactive payment records for paid invoices
        $inactiveRecordsForPaidInvoices = TeacherMembershipPayment::where('is_active', false)
            ->whereHas('invoice', function($query) {
                $query->where('amountPaid', '>', 0);
            })
            ->count();
            
        if ($inactiveRecordsForPaidInvoices > 0) {
            $issues[] = [
                'type' => 'inactive_records_for_paid_invoices',
                'description' => 'Inactive payment records for paid invoices',
                'count' => $inactiveRecordsForPaidInvoices
            ];
        }

        // Check for payment records with unpaid months for fully paid invoices
        $recordsWithUnpaidMonths = TeacherMembershipPayment::where('is_active', true)
            ->whereHas('invoice', function($query) {
                $query->whereRaw('amountPaid >= totalAmount');
            })
            ->whereJsonLength('months_rest_not_paid_yet', '>', 0)
            ->count();
            
        if ($recordsWithUnpaidMonths > 0) {
            $issues[] = [
                'type' => 'unpaid_months_for_fully_paid_invoices',
                'description' => 'Payment records with unpaid months for fully paid invoices',
                'count' => $recordsWithUnpaidMonths
            ];
        }

        return $issues;
    }

    /**
     * Auto-fix payment issues
     */
    public function autoFixPaymentIssues(): array
    {
        $result = [
            'total_fixed' => 0,
            'total_errors' => 0,
            'fixed' => [],
            'errors' => []
        ];

        try {
            $paymentService = new TeacherMembershipPaymentService();

            // Fix inactive payment records for paid invoices
            $inactiveRecords = TeacherMembershipPayment::where('is_active', false)
                ->whereHas('invoice', function($query) {
                    $query->where('amountPaid', '>', 0);
                })
                ->with('invoice')
                ->get();

            foreach ($inactiveRecords as $record) {
                try {
                    $reactivationResult = $paymentService->reactivatePaymentRecords($record->invoice);
                    
                    if ($reactivationResult['success']) {
                        $result['fixed'][] = [
                            'type' => 'reactivated_payment_record',
                            'record_id' => $record->id,
                            'invoice_id' => $record->invoice_id
                        ];
                        $result['total_fixed']++;
                    }
                } catch (\Exception $e) {
                    $result['errors'][] = [
                        'type' => 'failed_to_reactivate_record',
                        'record_id' => $record->id,
                        'error' => $e->getMessage()
                    ];
                    $result['total_errors']++;
                }
            }

            // Clear unpaid months for fully paid invoices
            $recordsWithUnpaidMonths = TeacherMembershipPayment::where('is_active', true)
                ->whereHas('invoice', function($query) {
                    $query->whereRaw('amountPaid >= totalAmount');
                })
                ->whereJsonLength('months_rest_not_paid_yet', '>', 0)
                ->get();

            foreach ($recordsWithUnpaidMonths as $record) {
                try {
                    $record->update(['months_rest_not_paid_yet' => []]);
                    
                    $result['fixed'][] = [
                        'type' => 'cleared_unpaid_months',
                        'record_id' => $record->id,
                        'invoice_id' => $record->invoice_id
                    ];
                    $result['total_fixed']++;
                } catch (\Exception $e) {
                    $result['errors'][] = [
                        'type' => 'failed_to_clear_unpaid_months',
                        'record_id' => $record->id,
                        'error' => $e->getMessage()
                    ];
                    $result['total_errors']++;
                }
            }

            // Note: We don't automatically create payment records for invoices without them
            // because this requires complex business logic and could cause data integrity issues
            // This should be handled manually or through the invoice creation process

        } catch (\Exception $e) {
            $result['errors'][] = [
                'type' => 'general_error',
                'error' => $e->getMessage()
            ];
            $result['total_errors']++;
        }

        return $result;
    }
}
