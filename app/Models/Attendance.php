<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    protected $fillable = [
        'student_id',
        'classId',
        'date',
        'status',
        'reason',
        'recorded_by',
        'teacher_id', // allow mass assignment
        'subject',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function class()
    {
        return $this->belongsTo(Classes::class, 'classId');
    }

    public function recordedBy()
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    public function teacher()
    {
        return $this->belongsTo(Teacher::class);
    }

    public function scopeFilter($query, array $filters)
    {
        $query->when($filters['classId'] ?? null, function ($query, $classId) {
            $query->where('classId', $classId);
        })->when($filters['date'] ?? null, function ($query, $date) {
            $query->whereDate('date', $date);
        });
    }
}