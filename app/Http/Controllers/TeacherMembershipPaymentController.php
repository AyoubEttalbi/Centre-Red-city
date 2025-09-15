<?php

namespace App\Http\Controllers;

use App\Models\TeacherMembershipPayment;
use App\Services\TeacherMembershipPaymentService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TeacherMembershipPaymentController extends Controller
{
    protected $paymentService;

    public function __construct(TeacherMembershipPaymentService $paymentService)
    {
        $this->paymentService = $paymentService;
    }

    /**
     * Get all teacher membership payments
     */
    public function index(Request $request): JsonResponse
    {
        $query = TeacherMembershipPayment::with(['teacher', 'student', 'membership']);

        // Filter by teacher
        if ($request->has('teacher_id')) {
            $query->where('teacher_id', $request->teacher_id);
        }

        // Filter by membership
        if ($request->has('membership_id')) {
            $query->where('membership_id', $request->membership_id);
        }

        // Filter by active status
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $payments = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($payments);
    }

    /**
     * Get teacher membership payment details
     */
    public function show($id): JsonResponse
    {
        $payment = TeacherMembershipPayment::with(['teacher', 'student', 'membership', 'invoice'])
            ->findOrFail($id);

        return response()->json($payment);
    }

    /**
     * Process monthly payments manually (for testing)
     */
    public function processMonthlyPayments(Request $request): JsonResponse
    {
        $month = $request->input('month', now()->format('Y-m'));

        try {
            $result = $this->paymentService->processMonthlyPayments($month);

            return response()->json([
                'success' => true,
                'message' => "Successfully processed {$result['processed_count']} payments",
                'data' => $result
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error processing monthly payments: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get teacher earnings summary
     */
    public function earningsSummary(Request $request): JsonResponse
    {
        $teacherId = $request->input('teacher_id');
        $startMonth = $request->input('start_month');
        $endMonth = $request->input('end_month');

        $summary = $this->paymentService->getTeacherEarningsSummary($teacherId, $startMonth, $endMonth);

        return response()->json($summary);
    }

    /**
     * Get pending payments for a teacher
     */
    public function pendingPayments(Request $request): JsonResponse
    {
        $teacherId = $request->input('teacher_id');
        $currentMonth = $request->input('month', now()->format('Y-m'));

        $pendingPayments = TeacherMembershipPayment::active()
            ->withUnpaidCurrentMonth($currentMonth)
            ->when($teacherId, function($query) use ($teacherId) {
                return $query->where('teacher_id', $teacherId);
            })
            ->with(['teacher', 'student', 'membership'])
            ->get();

        return response()->json($pendingPayments);
    }

    /**
     * Test invoice deletion reversal (for testing purposes)
     */
    public function testInvoiceDeletion(Request $request): JsonResponse
    {
        $invoiceId = $request->input('invoice_id');
        
        if (!$invoiceId) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice ID is required'
            ], 400);
        }

        try {
            $invoice = \App\Models\Invoice::findOrFail($invoiceId);
            
            // Get teacher payment records before deletion
            $recordsBefore = TeacherMembershipPayment::active()
                ->where('invoice_id', $invoiceId)
                ->with(['teacher'])
                ->get();

            $teacherDetailsBefore = $recordsBefore->map(function($record) {
                return [
                    'teacher_id' => $record->teacher_id,
                    'teacher_name' => $record->teacher->first_name . ' ' . $record->teacher->last_name,
                    'wallet_before' => $record->teacher->wallet,
                    'payment_details' => app(\App\Services\TeacherMembershipPaymentService::class)->calculateTeacherPaidAmount($record)
                ];
            });

            // Simulate invoice deletion reversal
            $paymentService = new \App\Services\TeacherMembershipPaymentService();
            $paymentService->reverseInvoicePayments($invoice);

            // Get teacher details after reversal
            $teacherDetailsAfter = $recordsBefore->map(function($record) {
                $teacher = \App\Models\Teacher::find($record->teacher_id);
                return [
                    'teacher_id' => $teacher->id,
                    'teacher_name' => $teacher->first_name . ' ' . $teacher->last_name,
                    'wallet_after' => $teacher->wallet,
                    'wallet_change' => $teacher->wallet - $record->teacher->wallet
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Invoice deletion reversal completed',
                'data' => [
                    'invoice_id' => $invoiceId,
                    'before_reversal' => $teacherDetailsBefore,
                    'after_reversal' => $teacherDetailsAfter
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error testing invoice deletion: ' . $e->getMessage()
            ], 500);
        }
    }
}
