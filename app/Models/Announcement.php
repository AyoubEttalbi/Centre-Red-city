<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Announcement extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'content',
        'date_announcement',
        'date_start',
        'date_end',
        'visibility',
    ];

    protected $dates = [
        'date_start',
        'date_end',
        'created_at',
        'updated_at',
    ];

    public function reads()
    {
        return $this->hasMany(\App\Models\AnnouncementRead::class);
    }
}