<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TeacherMembershipPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'teacher_id',
        'membership_id',
        'invoice_id',
        'selected_months',
        'months_rest_not_paid_yet',
        'total_teacher_amount',
        'monthly_teacher_amount',
        'payment_percentage',
        'teacher_subject',
        'teacher_percentage',
        'immediate_wallet_amount',
        'total_paid_to_teacher',
        'is_active',
    ];

    protected $casts = [
        'selected_months' => 'array',
        'months_rest_not_paid_yet' => 'array',
        'total_teacher_amount' => 'decimal:2',
        'monthly_teacher_amount' => 'decimal:2',
        'payment_percentage' => 'decimal:2',
        'teacher_percentage' => 'decimal:2',
        'immediate_wallet_amount' => 'decimal:2',
        'total_paid_to_teacher' => 'decimal:2',
        'is_active' => 'boolean',
        'membership_id' => 'integer',
    ];

    // Relationships
    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function teacher()
    {
        return $this->belongsTo(Teacher::class);
    }

    public function membership()
    {
        return $this->belongsTo(Membership::class)->withTrashed();
    }

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    /**
     * Scope to get active records
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get records for a specific teacher
     */
    public function scopeForTeacher($query, $teacherId)
    {
        return $query->where('teacher_id', $teacherId);
    }

    /**
     * Scope to get records for a specific membership
     */
    public function scopeForMembership($query, $membershipId)
    {
        return $query->where('membership_id', $membershipId);
    }

    /**
     * Scope to get records that have unpaid months for current month
     */
    public function scopeWithUnpaidCurrentMonth($query, $currentMonth = null)
    {
        $currentMonth = $currentMonth ?? now()->format('Y-m');
        
        return $query->whereJsonContains('selected_months', $currentMonth)
                    ->whereJsonContains('months_rest_not_paid_yet', $currentMonth);
    }

    /**
     * Check if a specific month is unpaid
     */
    public function isMonthUnpaid($month)
    {
        return in_array($month, $this->months_rest_not_paid_yet ?? []);
    }

    /**
     * Mark a month as paid (remove from unpaid list)
     */
    public function markMonthAsPaid($month)
    {
        $unpaidMonths = $this->months_rest_not_paid_yet ?? [];
        $unpaidMonths = array_filter($unpaidMonths, function($m) use ($month) {
            return $m !== $month;
        });
        
        $this->update(['months_rest_not_paid_yet' => array_values($unpaidMonths)]);
    }

    /**
     * Get the number of unpaid months
     */
    public function getUnpaidMonthsCount()
    {
        return count($this->months_rest_not_paid_yet ?? []);
    }

    /**
     * Check if all months are paid
     */
    public function isFullyPaid()
    {
        return empty($this->months_rest_not_paid_yet);
    }
}
