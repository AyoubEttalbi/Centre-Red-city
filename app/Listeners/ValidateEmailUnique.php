<?php
namespace App\Listeners;

use App\Events\CheckEmailUnique;
use Illuminate\Validation\ValidationException;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\DB;

class ValidateEmailUnique
{
    public function handle(CheckEmailUnique $event)
    {
        $existsInTeachers = DB::table('teachers')
            ->where('email', $event->email)
            ->when($event->ignoreId, function ($query, $ignoreId) {
                return $query->where('id', '!=', $ignoreId);
            })
            ->exists();

        $existsInAssistants = DB::table('assistants')
            ->where('email', $event->email)
            ->when($event->ignoreId, function ($query, $ignoreId) {
                return $query->where('id', '!=', $ignoreId);
            })
            ->exists();

            if ($existsInTeachers || $existsInAssistants) {
                throw ValidationException::withMessages([
                    'email' => 'The email is already in use by another teacher or assistant.',
                ]);
            }
    }
}