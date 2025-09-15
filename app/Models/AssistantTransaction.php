<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AssistantTransaction extends Model
{
    protected $fillable = [
        'assistant_id',
        'amount',
        'type',
        'is_recurring',
        'payment_date',
        'description',
        'frequency',
        'status',
    ];

    public function assistant()
    {
        return $this->belongsTo(Assistant::class);
    }
}
