<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MembershipMonthlyStats extends Model
{
    use HasFactory;

    protected $fillable = [
        'school_id',
        'year',
        'month',
        'total_memberships',
        'paid_count',
        'unpaid_count',
        'expired_count',
        'pending_count',
    ];

    protected $casts = [
        'year' => 'integer',
        'month' => 'integer',
        'total_memberships' => 'integer',
        'paid_count' => 'integer',
        'unpaid_count' => 'integer',
        'expired_count' => 'integer',
        'pending_count' => 'integer',
    ];

    /**
     * Get the school that owns the stats.
     */
    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    /**
     * Scope to filter by school.
     */
    public function scopeForSchool($query, $schoolId)
    {
        if ($schoolId && $schoolId !== 'all') {
            return $query->where('school_id', $schoolId);
        }
        return $query;
    }

    /**
     * Scope to filter by year and month.
     */
    public function scopeForPeriod($query, $year, $month)
    {
        return $query->where('year', $year)->where('month', $month);
    }

    /**
     * Scope to get current month stats.
     */
    public function scopeCurrentMonth($query)
    {
        return $query->where('year', now()->year)->where('month', now()->month);
    }

    /**
     * Get the month name in French.
     */
    public function getMonthNameAttribute(): string
    {
        $frenchMonths = [
            1 => 'Janvier',
            2 => 'Février',
            3 => 'Mars',
            4 => 'Avril',
            5 => 'Mai',
            6 => 'Juin',
            7 => 'Juillet',
            8 => 'Août',
            9 => 'Septembre',
            10 => 'Octobre',
            11 => 'Novembre',
            12 => 'Décembre'
        ];
        
        return $frenchMonths[$this->month] ?? 'Inconnu';
    }

    /**
     * Get the formatted period (e.g., "Janvier 2025").
     */
    public function getFormattedPeriodAttribute(): string
    {
        return $this->month_name . ' ' . $this->year;
    }

    /**
     * Calculate the percentage of paid memberships.
     */
    public function getPaidPercentageAttribute(): float
    {
        if ($this->total_memberships === 0) {
            return 0;
        }
        return round(($this->paid_count / $this->total_memberships) * 100, 1);
    }

    /**
     * Calculate the percentage of unpaid memberships.
     */
    public function getUnpaidPercentageAttribute(): float
    {
        if ($this->total_memberships === 0) {
            return 0;
        }
        return round(($this->unpaid_count / $this->total_memberships) * 100, 1);
    }
}


