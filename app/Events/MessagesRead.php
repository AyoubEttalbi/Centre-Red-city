<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessagesRead implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $readerId;
    public $senderId;
    public $messageIds;

    public function __construct($readerId, $senderId, $messageIds = [])
    {
        $this->readerId = $readerId;
        $this->senderId = $senderId;
        $this->messageIds = $messageIds;
    }

    public function broadcastOn()
    {
        // Broadcast to both users' channels using consistent naming
        return [
            new PrivateChannel('message.'.$this->senderId), // Changed to match frontend
            new PrivateChannel('message.'.$this->readerId)  // Changed to match frontend
        ];
    }

    public function broadcastAs()
    {
        return 'MessagesRead';
    }

    public function broadcastWith(){
        return [
            'reader_id' => $this->readerId, // Consistent naming
            'sender_id' => $this->senderId, // Consistent naming
            'message_ids' => $this->messageIds,
            'is_read' => true,
            'timestamp' => now()->toISOString()
        ];
    }
}