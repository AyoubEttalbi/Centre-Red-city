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

    protected static function boot()
    {
        parent::boot();

        // When a membership is deleted, also delete its invoices (soft or force accordingly)
        static::deleting(function ($membership) {
            $isForceDeleting = method_exists($membership, 'isForceDeleting') && $membership->isForceDeleting();

            $membership->invoices()->withTrashed()->get()->each(function ($invoice) use ($isForceDeleting) {
                // Apply teacher wallet reversal rules before deleting the invoice
                try {
                    $service = new \App\Services\TeacherMembershipPaymentService();
                    $service->reverseInvoicePayments($invoice);
                } catch (\Exception $e) {
                    // continue even if reversal fails
                }
                if ($isForceDeleting) {
                    $invoice->forceDelete();
                } else {
                    if ($invoice->trashed()) return;
                    $invoice->delete();
                }
            });
        });
    }
}