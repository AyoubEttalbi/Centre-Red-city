<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $user = Auth::user();
        
        // Log middleware execution
        Log::info('AdminMiddleware executed', [
            'user_id' => $user ? $user->id : null,
            'user_role' => $user ? $user->role : null,
            'is_authenticated' => Auth::check(),
            'route' => $request->route() ? $request->route()->getName() : null,
            'url' => $request->url(),
            'is_mobile' => strpos($request->header('User-Agent'), 'Mobile') !== false,
            'session_id' => $request->session()->getId()
        ]);
        
        // Check if user is logged in and is an admin
        if (!Auth::check() || $user->role !== 'admin') {
            Log::warning('AdminMiddleware blocked access', [
                'user_id' => $user ? $user->id : null,
                'user_role' => $user ? $user->role : null,
                'is_authenticated' => Auth::check(),
                'is_mobile' => strpos($request->header('User-Agent'), 'Mobile') !== false
            ]);
            return redirect('/dashboard')->with('error', 'Access Denied');
        }

        return $next($request);
    }
}
