<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RecurringTransactionPayment extends Model
{
    protected $fillable = [
        'recurring_transaction_id',
        'transaction_id',
        'period',
    ];

    public function recurringTransaction()
    {
        return $this->belongsTo(Transaction::class, 'recurring_transaction_id');
    }

    public function transaction()
    {
        return $this->belongsTo(Transaction::class, 'transaction_id');
    }
}
