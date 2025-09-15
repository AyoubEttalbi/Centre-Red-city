<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use App\Models\School; // Ensure School model is included
use App\Models\Teacher;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Session;
use App\Models\Assistant;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return Redirect::route('profile.edit');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }

    /**
     * Show profile selection page (for teachers and assistants).
     */
    public function select(Request $request)
    {
        $user = auth()->user();
        $force = $request->query('force');

        if ($user->role === 'teacher') {
            $teacher = Teacher::with('schools')->where('email', $user->email)->first();

            if (!$teacher || $teacher->schools->isEmpty()) {
                abort(403, 'No schools found for this teacher.');
            }

            $isAdminInspection = session()->has('admin_user_id');

            // If force param is set, always show selection page
            if ($force) {
                return Inertia::render('Auth/SelectProfile', [
                    'schools' => $teacher->schools->map(fn($school) => [
                        'id' => $school->id,
                        'name' => $school->name,
                    ]),
                    'isAdminInspection' => $isAdminInspection,
                ]);
            }
            // Only redirect if school already selected AND not in admin inspection mode
            if (session('school_id') && !$isAdminInspection) {
                return redirect()->route('teachers.show', $teacher->id);
            }

            return Inertia::render('Auth/SelectProfile', [
                'schools' => $teacher->schools->map(fn($school) => [
                    'id' => $school->id,
                    'name' => $school->name,
                ]),
                'isAdminInspection' => $isAdminInspection,
            ]);
        } 
        elseif ($user->role === 'assistant') {
            $assistant = Assistant::with('schools')->where('email', $user->email)->first();

            if (!$assistant || $assistant->schools->isEmpty()) {
                abort(403, 'No schools found for this assistant.');
            }

            $isAdminInspection = session()->has('admin_user_id');

            // If force param is set, always show selection page
            if ($force) {
                return Inertia::render('Auth/SelectProfile', [
                    'schools' => $assistant->schools->map(fn($school) => [
                        'id' => $school->id,
                        'name' => $school->name,
                    ]),
                    'isAdminInspection' => $isAdminInspection,
                ]);
            }
            // Only redirect if school already selected AND not in admin inspection mode
            if (session('school_id') && !$isAdminInspection) {
                return redirect()->route('assistants.show', $assistant->id);
            }

            return Inertia::render('Auth/SelectProfile', [
                'schools' => $assistant->schools->map(fn($school) => [
                    'id' => $school->id,
                    'name' => $school->name,
                ]),
                'isAdminInspection' => $isAdminInspection,
            ]);
        }
        else {
            return redirect()->route('dashboard');
        }
    }

    /**
     * Store the selected school for the teacher or assistant.
     */
    public function store(Request $request)
    {
        $request->validate([
            'school_id' => 'required|exists:schools,id',
        ]);

        $user = auth()->user();
        
        if ($user->role === 'teacher') {
            $teacher = Teacher::where('email', $user->email)->firstOrFail();

            // Verify the teacher has access to this school
            if (!$teacher->schools()->where('schools.id', $request->school_id)->exists()) {
                abort(403, 'This teacher does not have access to the selected school.');
            }

            // Store in session instead of database
            $school = School::find($request->school_id);
            session([
                'school_id' => $school->id,
                'school_name' => $school->name,
            ]);

            // If this was an admin inspection, redirect to teacher profile
            if (session()->has('admin_user_id')) {
                return redirect()->route('teachers.show', $teacher->id)->with('success', 'School selected successfully.');
            }

            // Otherwise redirect to teacher profile
            return redirect()->route('teachers.show', $teacher->id);
        }
        elseif ($user->role === 'assistant') {
            $assistant = Assistant::where('email', $user->email)->firstOrFail();

            // Verify the assistant has access to this school
            if (!$assistant->schools()->where('schools.id', $request->school_id)->exists()) {
                abort(403, 'This assistant does not have access to the selected school.');
            }

            // Store in session instead of database
            $school = School::find($request->school_id);
            session([
                'school_id' => $school->id,
                'school_name' => $school->name,
            ]);

            // If this was an admin inspection, redirect to assistant profile
            if (session()->has('admin_user_id')) {
                return redirect()->route('assistants.show', $assistant->id)->with('success', 'School selected successfully.');
            }

            // Otherwise redirect to assistant profile
            return redirect()->route('assistants.show', $assistant->id);
        }
        else {
            abort(403, 'Unauthorized role.');
        }
    }
}