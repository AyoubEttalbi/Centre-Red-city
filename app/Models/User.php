<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    public function teacher()
    {
        return $this->hasOne(Teacher::class, 'email', 'email');
    }

    public function assistant()
    {
        return $this->hasOne(Assistant::class, 'email', 'email');
    }

    public function announcementReads()
    {
        return $this->hasMany(\App\Models\AnnouncementRead::class);
    }

    /**
     * Check if the user is an admin.
     *
     * @return bool
     */
    public function getIsAdminAttribute()
    {
        return $this->role === 'admin';
    }

}
