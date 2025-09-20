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

        // For show routes, allow teachers to access their own profile
        if ($routeName === 'teachers.show' && $user && $user->role === 'teacher') {
            // Use the user's email to find the teacher
            $teacher = Teacher::where('email', $user->email)->first();
            
            Log::info('Teacher lookup result', [
                'teacher_found' => $teacher ? 'yes' : 'no',
                'teacher_id' => $teacher ? $teacher->id : null,
                'email_used' => $user->email
            ]);
            
            if ($teacher) {
                // Get the teacher ID from the route parameter
                $teacherId = $request->route('teacher');
                
                Log::info('Teacher ID comparison', [
                    'route_teacher_id' => $teacherId,
                    'db_teacher_id' => $teacher->id,
                    'route_teacher_type' => gettype($teacherId),
                    'db_teacher_type' => gettype($teacher->id),
                    'strict_match' => $teacherId && (string)$teacherId === (string)$teacher->id,
                    'loose_match' => $teacherId && $teacherId == $teacher->id
                ]);
                
                // Allow access if teacher exists (simplified logic)
                Log::info('CanViewTeacherProfile: Teacher access granted (simplified)', [
                    'user_id' => $user->id,
                    'teacher_id' => $teacher->id,
                    'is_mobile' => strpos($request->header('User-Agent'), 'Mobile') !== false
                ]);
                return $next($request);
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
