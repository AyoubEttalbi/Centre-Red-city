<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    protected $fillable = [
        'type',
        'user_id',
        'user_name',
        'amount',
        'rest',
        'description',
        'payment_date',
        'is_recurring',
        'frequency',
        'next_payment_date'
    ];

    protected $casts = [
        'payment_date' => 'datetime',
        'next_payment_date' => 'datetime',
        'is_recurring' => 'boolean',
        'amount' => 'decimal:2',
        'rest' => 'decimal:2'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function recurringPayments()
    {
        return $this->hasMany(\App\Models\RecurringTransactionPayment::class, 'recurring_transaction_id');
    }
}
