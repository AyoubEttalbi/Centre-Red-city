<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

class Teacher extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'first_name',
        'last_name',
        'address',
        'phone_number',
        'email',
        'status',
        'wallet',
        'profile_image',
    ];

    protected static function boot()
    {
        parent::boot();

        // Update class teacher count when a teacher is created
        static::created(function ($teacher) {
            $teacher->classes->each(function ($class) {
                static::updateClassTeacherCount($class->id); // Use $class->id
            });
        });

        // Update class teacher count when a teacher is updated (e.g., attached/detached from classes)
        static::updated(function ($teacher) {
            $teacher->classes->each(function ($class) {
                static::updateClassTeacherCount($class->id); // Use $class->id
            });
        });

        // Update class teacher count when a teacher is deleted
        static::deleted(function ($teacher) {
            $teacher->classes->each(function ($class) {
                static::updateClassTeacherCount($class->id); // Use $class->id
            });
        });
    }

    /**
     * Update the number_of_teachers field for a specific class.
     *
     * @param int $classId
     */
    protected static function updateClassTeacherCount($classId)
    {
        $class = Classes::find($classId);
        if ($class) {
            $class->update([
                'number_of_teachers' => DB::table('classes_teacher')
                    ->where('classes_id', $classId)
                    ->count(),
            ]);
        }
    }

    // Relationships
    public function subjects(): BelongsToMany
    {
        return $this->belongsToMany(Subject::class, 'subject_teacher')->withTimestamps();
    }

    public function classes(): BelongsToMany
    {
        return $this->belongsToMany(Classes::class, 'classes_teacher', 'teacher_id', 'classes_id')
        ->withTimestamps();
    }

    public function schools(): BelongsToMany
    {
        return $this->belongsToMany(School::class, 'school_teacher')
            ->select('schools.*') // Explicitly select all columns from schools table
            ->withTimestamps();
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'email', 'email');
    }
}
