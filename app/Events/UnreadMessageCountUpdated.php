<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UnreadMessageCountUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $userId;
    public $unreadCount;

    public function __construct($userId, $unreadCount)
    {
       
        $this->userId = $userId;
        $this->unreadCount = $unreadCount;
    }

    public function broadcastOn()
    {
        return new Channel("user.{$this->userId}.notifications");
    }

    public function broadcastWith()
    {
        return [
            'unread_count' => $this->unreadCount
        ];
    }
    // In your UnreadMessageCountUpdated event
    public function broadcastAs()
    {
        return 'UnreadMessageCountUpdated'; // Specify a custom event name
    }
}