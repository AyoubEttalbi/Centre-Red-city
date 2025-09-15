<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Offer extends Model
{
    use HasFactory;

    protected $fillable = [
        'offer_name',
        'price',
        'levelId',
        'subjects',
        'percentage',
    ];

    protected $casts = [
        'subjects' => 'array',
        'percentage' => 'array',
    ];

    // Define the relationship to Level
    public function level()
    {
        return $this->belongsTo(Level::class, 'levelId');
    }
}