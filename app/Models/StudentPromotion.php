<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentPromotion extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'student_id',
        'class_id',
        'level_id',
        'school_year',
        'is_promoted',
        'notes',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'is_promoted' => 'boolean',
    ];

    /**
     * Get the student that this promotion record belongs to.
     */
    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    /**
     * Get the class that this promotion record refers to.
     */
    public function class()
    {
        return $this->belongsTo(Classes::class, 'class_id');
    }

    /**
     * Get the level that this promotion record refers to.
     */
    public function level()
    {
        return $this->belongsTo(Level::class);
    }
} 