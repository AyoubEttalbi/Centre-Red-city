<?php

namespace App\Http\Controllers\Auth;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\QueryException;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function show(): Response
{
    $users = User::all()->map(function ($user) {
        $profileImage = null;

        switch ($user->role) {
            case 'assistant':
                $profileImage = DB::table('assistants')
                    ->where('email', $user->email)
                    ->value('profile_image');
                break;
            case 'teacher':
                $profileImage = DB::table('teachers')
                    ->where('email', $user->email)
                    ->value('profile_image');
                break;
        }

        $user->profile_image = $profileImage;
        return $user;
    });

    return Inertia::render('Menu/UserListPage', [
        'users' => $users,
    ]);
}
    public function create(): Response
    {
        return Inertia::render('Menu/UserListPage');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */


public function store(Request $request): RedirectResponse
{
    try {
        // Validate the incoming request data
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:' . User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role' => 'required|in:admin,assistant,teacher',
        ]);

        // Create the user in the database
        $user = User::create([
            'name' => $validatedData['name'],
            'email' => $validatedData['email'],
            'password' => Hash::make($validatedData['password']),
            'role' => $validatedData['role'],
        ]);

        // Dispatch the Registered event
        event(new Registered($user));

        // Redirect with success message
        return redirect()->back()->with('success', 'User created successfully!');

    } catch (ValidationException $e) {
        // Handle validation errors (e.g., missing fields, invalid format)
        return redirect()->back()
            ->withErrors($e->errors())
            ->withInput();
    } catch (QueryException $e) {
        // Handle database-related errors (e.g., duplicate email)
        $errorMessage = 'An error occurred while creating the user. Please try again.';

        // Check if the error is due to a duplicate email
        if ($e->errorInfo[1] === 1062) { // MySQL error code for duplicate entry
            $errorMessage = 'The email address is already in use.';
        }

        return redirect()->back()
            ->withErrors(['email' => $errorMessage])
            ->withInput();
    } catch (\Exception $e) {
        // Handle any other unexpected exceptions
        return redirect()->back()
            ->withErrors(['general' => 'An unexpected error occurred. Please try again later.'])
            ->withInput();
    }
}
}