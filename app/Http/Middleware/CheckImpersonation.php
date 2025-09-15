<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Log;

class CheckImpersonation
{
    public function handle(Request $request, Closure $next)
    {
        Log::info('CheckImpersonation called', ['session' => session()->all()]);
        // Check if admin_user_id exists in the session
        if (!Session::has('admin_user_id')) {
            Log::warning('CheckImpersonation blocked: admin_user_id missing', ['session' => session()->all()]);
            abort(403, 'Unauthorized action.');
        }

        return $next($request);
    }
}