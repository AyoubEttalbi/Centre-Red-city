<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
class School extends Model
{
    use HasFactory;
    protected $fillable = [
        'name',
        'address',
        'phone_number',
        'email',
    ];

    /**
     * Get the teachers associated with the school.
     */
    public function teachers(): BelongsToMany
    {
        return $this->belongsToMany(Teacher::class, 'school_teacher', 'school_id', 'teacher_id')
            ->select('teachers.*') // Explicitly select all columns from teachers table
            ->withTimestamps();
    }

    /**
     * Get the classes belonging to the school.
     */
    public function classes(): HasMany
    {
        return $this->hasMany(Classes::class, 'school_id');
    }

    public function assistants()
    {
        return $this->belongsToMany(Assistant::class, 'assistant_school')->withTimestamps();
    }
}