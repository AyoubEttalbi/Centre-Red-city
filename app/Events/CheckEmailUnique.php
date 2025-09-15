<?php
namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;

class CheckEmailUnique
{
    use Dispatchable;

    public $email;
    public $ignoreId; // For updates, ignore the current record

    public function __construct($email, $ignoreId = null)
    {
        $this->email = $email;
        $this->ignoreId = $ignoreId;
    }
}