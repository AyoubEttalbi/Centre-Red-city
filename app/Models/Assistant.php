<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Assistant extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'phone_number',
        'address',
        'profile_image',
        
        'salary',
        'status',
    ];

    protected $dates = ['deleted_at'];

    // Relationship with schools (many-to-many)
    public function schools()
{
    return $this->belongsToMany(School::class, 'assistant_school')->withTimestamps();
}


public function user()
{
    return $this->belongsTo(User::class, 'email', 'email');
}

    public function transactions()
    {
        return $this->hasMany(AssistantTransaction::class);
    }
}