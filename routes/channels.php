<?php
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('message.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('presence-online-users', function ($user) {
    return [
        'id' => $user->id,
        'name' => $user->name,
        'status' => 'online' // Initial status
    ];
});

// New channel for user-specific notifications
Broadcast::channel('user.{id}.notifications', function ($user, $id) {
    return (int) $user->id === (int) $id;
});
Broadcast::channel('user.{userId}.notifications', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});