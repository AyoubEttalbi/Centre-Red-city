<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Result;
use App\Models\Attendance;
use App\Models\Membership;
use App\Models\Invoice;
use App\Models\Subject;
use App\Models\Classes;
use App\Models\School;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Inertia\Inertia;

class PerformanceController extends Controller
{
    /**
     * Display the performance page for a student
     */
    public function show($studentId)
    {
        try {
            $student = Student::with(['class', 'school'])->findOrFail($studentId);
            
            // Get academic performance
            $academicScore = $this->calculateAcademicScore($studentId);
            
            // Get attendance performance
            $attendanceScore = $this->calculateAttendanceScore($studentId);
            
            // Get payment performance
            $paymentScore = $this->calculatePaymentScore($studentId);
            
            // Get membership performance
            $membershipScore = $this->calculateMembershipScore($studentId);
            
            // Calculate total weighted score
            $totalScore = (
                ($academicScore * 0.4) +
                ($attendanceScore * 0.3) +
                ($paymentScore * 0.2) +
                ($membershipScore * 0.1)
            );
            
            // Get detailed data for each metric
            $detailedData = [
                'academic' => [
                    'score' => $academicScore,
                    'totalExams' => Result::where('student_id', $studentId)->count(),
                    'recentResults' => Result::where('student_id', $studentId)
                        ->with(['subject', 'class'])
                        ->latest()
                        ->take(5)
                        ->get()
                        ->map(function($result) {
                            return [
                                'subject' => $result->subject ? $result->subject->name : 'N/A',
                                'class' => $result->class ? $result->class->name : 'N/A',
                                'score' => $result->score,
                                'date' => $result->exam_date,
                                'grade' => $this->calculateGrade($result->score)
                            ];
                        }),
                    'subjectAverages' => $this->getSubjectAverages($studentId)
                ],
                'attendance' => [
                    'score' => $attendanceScore,
                    'totalDays' => Attendance::where('student_id', $studentId)->count(),
                    'presentDays' => Attendance::where('student_id', $studentId)
                        ->where('status', 'present')
                        ->count(),
                    'recentAttendance' => Attendance::where('student_id', $studentId)
                        ->with(['class', 'recordedBy'])
                        ->latest()
                        ->take(5)
                        ->get()
                        ->map(function($attendance) {
                            return [
                                'date' => $attendance->date,
                                'status' => $attendance->status,
                                'class' => $attendance->class ? $attendance->class->name : 'N/A',
                                'recordedBy' => $attendance->recordedBy ? $attendance->recordedBy->name : 'N/A',
                                'reason' => $attendance->reason
                            ];
                        }),
                    'monthlyStats' => $this->getMonthlyAttendanceStats($studentId)
                ],
                'payment' => [
                    'score' => $paymentScore,
                    'totalInvoices' => Invoice::where('student_id', $studentId)->count(),
                    'paidInvoices' => Invoice::where('student_id', $studentId)
                        ->whereRaw('amountPaid >= totalAmount')
                        ->count(),
                    'recentPayments' => Invoice::where('student_id', $studentId)
                        ->with(['offer', 'membership' => function($membershipQuery) {
                            $membershipQuery->withTrashed();
                        }])
                        ->latest()
                        ->take(5)
                        ->get()
                        ->map(function($invoice) {
                            return [
                                'date' => $invoice->billDate,
                                'amount' => $invoice->totalAmount,
                                'paid' => $invoice->amountPaid,
                                'status' => $invoice->amountPaid >= $invoice->totalAmount ? 'Paid' : 'Partial',
                                'offer' => $invoice->offer ? $invoice->offer->offer_name : 'N/A',
                                'months' => $invoice->months
                            ];
                        }),
                    'paymentHistory' => $this->getPaymentHistory($studentId)
                ],
                'membership' => [
                    'score' => $membershipScore,
                    'activeMemberships' => Membership::whereNull('deleted_at')
                        ->where('student_id', $studentId)
                        ->where('is_active', true)
                        ->count(),
                    'totalMemberships' => Membership::whereNull('deleted_at')
                        ->where('student_id', $studentId)->count(),
                    'currentMemberships' => Membership::whereNull('deleted_at')
                        ->where('student_id', $studentId)
                        ->where('is_active', true)
                        ->with(['offer', 'invoices'])
                        ->get()
                        ->map(function($membership) {
                            return [
                                'offer' => $membership->offer ? $membership->offer->offer_name : 'N/A',
                                'start_date' => $membership->start_date,
                                'end_date' => $membership->end_date,
                                'status' => $membership->payment_status,
                                'teachers' => $membership->teachers,
                                'total_paid' => $membership->invoices->sum('amountPaid'),
                                'total_amount' => $membership->invoices->sum('totalAmount')
                            ];
                        })
                ]
            ];

            // Get student's basic information
            $studentInfo = [
                'id' => $student->id,
                'name' => $student->firstName . ' ' . $student->lastName,
                'class' => $student->class ? $student->class->name : 'N/A',
                'school' => $student->school ? $student->school->name : 'N/A',
                'level' => $student->level ? $student->level->name : 'N/A',
                'massarCode' => $student->massarCode,
                'profile_image' => $student->profile_image
            ];

            return Inertia::render('Performance/Performance', [
                'student' => $studentInfo,
                'performance' => [
                    'totalScore' => round($totalScore * 10) / 10,
                    'detailedData' => $detailedData
                ]
            ]);

        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Error calculating performance: ' . $e->getMessage());
        }
    }

    /**
     * Calculate academic score for a student
     */
    private function calculateAcademicScore($studentId)
    {
        $results = Result::where('student_id', $studentId)->get();
        
        if ($results->isEmpty()) {
            return 0;
        }
        
        $totalScore = $results->sum('score');
        $averageScore = $totalScore / $results->count();
        
        // Convert to 0-10 scale (assuming scores are out of 20)
        return min(10, round(($averageScore / 20) * 10 * 10) / 10);
    }

    /**
     * Calculate attendance score for a student
     */
    private function calculateAttendanceScore($studentId)
    {
        $attendances = Attendance::where('student_id', $studentId)->get();
        
        if ($attendances->isEmpty()) {
            return 0;
        }
        
        $totalDays = $attendances->count();
        $presentDays = $attendances->where('status', 'present')->count();
        $attendanceRate = ($presentDays / $totalDays) * 100;
        
        return round(($attendanceRate / 100) * 10 * 10) / 10;
    }

    /**
     * Calculate payment score for a student
     */
    private function calculatePaymentScore($studentId)
    {
        $invoices = Invoice::where('student_id', $studentId)->get();
        
        if ($invoices->isEmpty()) {
            return 0;
        }
        
        $totalInvoices = $invoices->count();
        $paidInvoices = $invoices->filter(function($invoice) {
            return $invoice->amountPaid >= $invoice->totalAmount;
        })->count();
        
        $paymentRate = ($paidInvoices / $totalInvoices) * 100;
        
        return round(($paymentRate / 100) * 10 * 10) / 10;
    }

    /**
     * Calculate membership score for a student
     */
    private function calculateMembershipScore($studentId)
    {
        $activeMemberships = Membership::withTrashed()->where('student_id', $studentId)
            ->where('is_active', true)
            ->count();
            
        return $activeMemberships > 0 ? 10 : 0;
    }

    /**
     * Calculate grade based on score
     */
    private function calculateGrade($score)
    {
        if ($score >= 18) return 'A+';
        if ($score >= 16) return 'A';
        if ($score >= 14) return 'B+';
        if ($score >= 12) return 'B';
        if ($score >= 10) return 'C+';
        if ($score >= 8) return 'C';
        if ($score >= 6) return 'D';
        return 'F';
    }

    /**
     * Get subject averages for a student
     */
    private function getSubjectAverages($studentId)
    {
        return Result::where('student_id', $studentId)
            ->with('subject')
            ->get()
            ->groupBy('subject_id')
            ->map(function($results) {
                $subject = $results->first()->subject;
                return [
                    'subject' => $subject ? $subject->name : 'N/A',
                    'average' => round($results->avg('score') * 10) / 10,
                    'count' => $results->count()
                ];
            })->values();
    }

    /**
     * Get monthly attendance statistics
     */
    private function getMonthlyAttendanceStats($studentId)
    {
        $startDate = Carbon::now()->subMonths(6);
        
        return Attendance::where('student_id', $studentId)
            ->where('date', '>=', $startDate)
            ->get()
            ->groupBy(function($attendance) {
                return Carbon::parse($attendance->date)->format('Y-m');
            })
            ->map(function($attendances) {
                $total = $attendances->count();
                $present = $attendances->where('status', 'present')->count();
                return [
                    'month' => Carbon::parse($attendances->first()->date)->format('F Y'),
                    'total' => $total,
                    'present' => $present,
                    'rate' => $total > 0 ? round(($present / $total) * 100) : 0
                ];
            })->values();
    }

    /**
     * Get payment history
     */
    private function getPaymentHistory($studentId)
    {
        $startDate = Carbon::now()->subMonths(6);
        
        return Invoice::where('student_id', $studentId)
            ->where('billDate', '>=', $startDate)
            ->get()
            ->groupBy(function($invoice) {
                return Carbon::parse($invoice->billDate)->format('Y-m');
            })
            ->map(function($invoices) {
                return [
                    'month' => Carbon::parse($invoices->first()->billDate)->format('F Y'),
                    'total' => $invoices->sum('totalAmount'),
                    'paid' => $invoices->sum('amountPaid'),
                    'count' => $invoices->count()
                ];
            })->values();
    }
} 