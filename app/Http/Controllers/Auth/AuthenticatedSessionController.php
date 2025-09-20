<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\Teacher; // Import the Teacher model
use App\Models\Assistant; // Import the Assistant model
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        // Log the login attempt
        Log::info('Login attempt started', [
            'email' => $request->email,
            'ip' => $request->ip(),
            'user_agent' => $request->header('User-Agent'),
            'is_mobile' => strpos($request->header('User-Agent'), 'Mobile') !== false,
            'session_id_before' => $request->session()->getId()
        ]);

        try {
            // Authenticate the user
            $request->authenticate();
        } catch (\Exception $e) {
            Log::error('Authentication failed', [
                'email' => $request->email,
                'error' => $e->getMessage(),
                'is_mobile' => strpos($request->header('User-Agent'), 'Mobile') !== false,
                'user_agent' => $request->header('User-Agent')
            ]);
            throw $e;
        }

        // Regenerate the session
        $request->session()->regenerate();

        // Get the authenticated user
        $user = Auth::user();
        
        // Log successful authentication
        Log::info('User authenticated successfully', [
            'user_id' => $user->id,
            'user_email' => $user->email,
            'user_role' => $user->role,
            'session_id_after' => $request->session()->getId(),
            'is_mobile' => strpos($request->header('User-Agent'), 'Mobile') !== false
        ]);
        
        // Redirect based on the user's role
        if ($user->role === 'teacher') {
            // Find the teacher by email
            $teacher = Teacher::where('email', $user->email)->first();
            
            if ($teacher) {
                return redirect()->route('profiles.select');
            }
        }

        if ($user->role === 'assistant') {
            // Find the assistant by email
            $assistant = Assistant::where('email', $user->email)->first();
            
            if ($assistant) {
                // Check if assistant has multiple schools
                if ($assistant->schools->count() > 1) {
                    return redirect()->route('profiles.select');
                }
                
                // If assistant has only one school, set it automatically
                if ($assistant->schools->count() === 1) {
                    $school = $assistant->schools->first();
                    session([
                        'school_id' => $school->id,
                        'school_name' => $school->name,
                    ]);
                }
                
                return redirect()->route('assistants.show', $assistant->id);
            }
        }

        // Log redirect decision
        Log::info('Redirecting user to dashboard', [
            'user_id' => $user->id,
            'user_role' => $user->role,
            'is_mobile' => strpos($request->header('User-Agent'), 'Mobile') !== false
        ]);

        // Default redirect for other roles (e.g., admin)
        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}