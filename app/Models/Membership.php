<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
class Membership extends Model
{
    use HasFactory,SoftDeletes;

    protected $fillable = [
        'student_id',
        'offer_id',
        'teachers',
        'payment_status',
        'is_active',
        'start_date',
        'end_date'
    ];

    protected $casts = [
        'teachers' => 'array', // Ensure the JSON column is cast to an array
    ];

    // Relationships
    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function offer()
    {
        return $this->belongsTo(Offer::class, 'offer_id');
    }

    public function invoices()
{
    return $this->hasMany(Invoice::class );
}
}