<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SchoolYear extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'year',
        'name',
        'ended_at',
        'statistics',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'ended_at' => 'datetime',
        'statistics' => 'array',
    ];

    /**
     * Get the student promotion records for this school year.
     */
    public function studentPromotions()
    {
        return $this->hasMany(StudentPromotion::class, 'school_year', 'year');
    }
} 