<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Models\Teacher;

class CanViewTeacherProfile
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $user = Auth::user();
        $routeName = $request->route()->getName();
        
        // Log middleware execution
        Log::info('CanViewTeacherProfile middleware executed', [
            'user_id' => $user ? $user->id : null,
            'user_role' => $user ? $user->role : null,
            'route' => $routeName,
            'url' => $request->url(),
            'is_mobile' => strpos($request->header('User-Agent'), 'Mobile') !== false,
            'session_id' => $request->session()->getId()
        ]);
        
        // Allow if admin OR if admin is impersonating (admin_user_id in session)
        if ($user && ($user->role === 'admin' || session()->has('admin_user_id'))) {
            Log::info('CanViewTeacherProfile: Admin access granted', [
                'user_id' => $user->id,
                'user_role' => $user->role,
                'is_mobile' => strpos($request->header('User-Agent'), 'Mobile') !== false
            ]);
            return $next($request);
        }

        // For index routes, allow teachers to access their own listing
        if ($routeName === 'teachers.index' && $user && $user->role === 'teacher') {
            return $next($request);
        }

        // For show routes, check if the teacher matches the user
        if ($routeName === 'teachers.show' && $user && $user->role === 'teacher') {
            // Use the user's email to find the teacher instead of route parameter
            $teacher = Teacher::where('email', $user->email)->first();
            
            if ($teacher) {
                // Get the teacher ID from the route parameter
                $teacherId = $request->route('teacher');
                
                // Check if the route parameter matches the teacher's ID
                if ($teacherId && (string)$teacherId === (string)$teacher->id) {
                    return $next($request);
                }
            }
        }

        // Allow access to profile selection route for teachers
        if ($routeName === 'profiles.select' && $user && $user->role === 'teacher') {
            return $next($request);
        }

        // Log the denial
        Log::warning('CanViewTeacherProfile: Access denied', [
            'user_id' => $user ? $user->id : null,
            'user_role' => $user ? $user->role : null,
            'route' => $routeName,
            'url' => $request->url(),
            'is_mobile' => strpos($request->header('User-Agent'), 'Mobile') !== false,
            'session_id' => $request->session()->getId()
        ]);
        
        // Otherwise, deny access
        abort(403, 'Unauthorized');
    }
}
