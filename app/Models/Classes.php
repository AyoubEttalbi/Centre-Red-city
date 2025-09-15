<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Classes extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'level_id',
        'number_of_students',
        'number_of_teachers',
        'school_id',
    ];

    // Boot method to handle events
    protected static function boot()
    {
        parent::boot();
        
        // Update counts when a class is retrieved
        static::retrieved(function ($class) {
            // Only update the counts if they haven't been updated recently to avoid unnecessary queries
            $class->updateStudentCount();
        });
        
        // Update number_of_teachers when a teacher is attached or detached
        static::saved(function ($class) {
            $class->number_of_teachers = $class->teachers()->count();
            $class->saveQuietly(); // Save without triggering events again
        });
    }

    // Relationship to Level
    public function level()
    {
        return $this->belongsTo(Level::class);
    }

    // Relationship to School
    public function school()
    {
        return $this->belongsTo(School::class, 'school_id');
    }

    // Relationship to Students (if applicable)
    public function students()
    {
        return $this->hasMany(Student::class, 'classId');
    }

    // Relationship to Teachers (if applicable)
    public function teachers()
    {
        return $this->belongsToMany(Teacher::class, 'classes_teacher', 'classes_id', 'teacher_id')
        ->withTimestamps();
    }

    // Method to update the number_of_teachers field
    public function updateTeacherCount()
    {
        $this->number_of_teachers = $this->teachers()->count();
        $this->saveQuietly();
        return $this;
    }
    
    // Method to update the number_of_students field
    public function updateStudentCount()
    {
        $studentCount = $this->students()->count();
        
        // Only update if the count has changed
        if ($this->number_of_students !== $studentCount) {
            $this->number_of_students = $studentCount;
            $this->saveQuietly();
        }
        
        return $this;
    }
    
    // Update both teacher and student counts in one method
    public function updateCounts()
    {
        $this->updateTeacherCount();
        $this->updateStudentCount();
        return $this;
    }
}