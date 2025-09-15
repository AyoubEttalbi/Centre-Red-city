<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class StudentMovement extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'student_id',
        'movement_type',
        'movement_date',
        'month_year',
        'school_id',
        'class_id',
        'level_id',
        'student_first_name',
        'student_last_name',
        'student_full_name',
        'guardian_name',
        'guardian_number',
        'reason',
        'previous_status',
        'new_status',
        'billing_date',
        'assurance_amount',
        'has_assurance',
        'recorded_by',
        'notes',
    ];

    protected $casts = [
        'movement_date' => 'date',
        'billing_date' => 'date',
        'assurance_amount' => 'decimal:2',
        'has_assurance' => 'boolean',
    ];

    // Relationships
    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function class()
    {
        return $this->belongsTo(Classes::class, 'class_id');
    }

    public function level()
    {
        return $this->belongsTo(Level::class);
    }

    public function recordedBy()
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    // Scopes
    public function scopeInscribed($query)
    {
        return $query->where('movement_type', 'inscribed');
    }

    public function scopeAbandoned($query)
    {
        return $query->where('movement_type', 'abandoned');
    }

    public function scopeForMonth($query, $monthYear)
    {
        return $query->where('month_year', $monthYear);
    }

    public function scopeForSchool($query, $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }

    // Helper methods
    public function isInscribed()
    {
        return $this->movement_type === 'inscribed';
    }

    public function isAbandoned()
    {
        return $this->movement_type === 'abandoned';
    }
}
