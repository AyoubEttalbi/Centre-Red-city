<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;
use App\Models\Teacher;
use App\Models\Assistant;
class AdminController extends Controller
{
    /**
     * Allow the admin to view the application as another user.
     *
     * @param Request $request
     * @param User $user The user to view as
     * @return \Illuminate\Http\RedirectResponse
     */
    public function viewAs(Request $request, User $user)
    {
        // Store values in temp vars BEFORE login
        $adminUserId = Auth::id();
        $originalRole = $user->role;
        $originalSchoolId = session('school_id');
        $originalSchoolName = session('school_name');

        // Login as the impersonated user (this regenerates the session)
        Auth::login($user);

        // Restore session values AFTER login
        Session::put('admin_user_id', $adminUserId);
        Session::put('original_role', $originalRole);
        if ($originalSchoolId) {
            Session::put('original_school_id', $originalSchoolId);
            Session::put('original_school_name', $originalSchoolName);
        }
        // Clear current school session for impersonated user
        Session::forget(['school_id', 'school_name']);

        // If inspecting a teacher, always check for schools and redirect to selection page
        if ($user->role === 'teacher') {
            $teacher = Teacher::with('schools')->where('email', $user->email)->first();
            if ($teacher && !$teacher->schools->isEmpty()) {
                return redirect()->route('profiles.select');
            }
        }
        // If inspecting an assistant, check for schools and redirect to selection page
        if ($user->role === 'assistant') {
            $assistant = Assistant::with('schools')->where('email', $user->email)->first();
            if ($assistant && !$assistant->schools->isEmpty()) {
                return redirect()->route('profiles.select');
            }
        }
        return redirect()->route('dashboard')->with('success', 'You are now viewing as ' . $user->name);
    }
    /**
     * Allow the admin to switch back to their own account.
     *
     * @param Request $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function switchBack(Request $request)
    {
        $adminUserId = Session::get('admin_user_id');
        if (!$adminUserId) abort(403, 'No admin session found.');
        $adminUser = User::find($adminUserId);
        if (!$adminUser) abort(404, 'Admin user not found.');
        Auth::login($adminUser);
        if (Session::has('original_school_id')) {
            Session::put('school_id', Session::pull('original_school_id'));
            Session::put('school_name', Session::pull('original_school_name'));
        } else {
            Session::forget(['school_id', 'school_name']);
        }
        Session::forget(['admin_user_id', 'original_role']);
        return redirect()->route('dashboard')->with('success', 'Switched back.');
    }
    /**
     * Check if the current user is an admin.
     *
     * @return bool
     */
    protected function isAdmin()
    {
        return Auth::user()->role === 'admin';
    }
}