<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
class Invoice extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'membership_id',
        'months',
        'billDate',
        'creationDate',
        'totalAmount',
        'amountPaid',
        'rest',
        'student_id',
        'offer_id',
        'endDate',
        'includePartialMonth',
        'partialMonthAmount',
        'last_payment_date',
        'selected_months',
        'created_by',
        'type',
        'assurance_amount',
    ];

    protected $casts = [
        'billDate' => 'date',
        'creationDate' => 'date',
        'endDate' => 'date',
        'includePartialMonth' => 'boolean',
        'last_payment_date' => 'datetime',
        'selected_months' => 'array',
    ];

    // Relationship with Membership (assuming it exists)
    public function membership()
    {
        return $this->belongsTo(Membership::class , 'membership_id');
    }

    public function creator()
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }
    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id');
    }
    // Relationship with Offer (if applicable)
    public function offer()
    {
        return $this->belongsTo(Offer::class, 'offer_id');
    }
}