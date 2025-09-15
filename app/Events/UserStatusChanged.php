<?php
namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserStatusChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $user;
    public $status;

    public function __construct($user, $status)
    {
        $this->user = $user;
        $this->status = $status;
    }

    public function broadcastOn()
    {
        // Use PresenceChannel instead of PrivateChannel for online/offline tracking
        return new channel('presence-online-users');
    }

    public function broadcastWith()
    {
        return [
            'user' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
            ],
            'status' => $this->status,
            'timestamp' => now()->toDateTimeString()
        ];
    }
}