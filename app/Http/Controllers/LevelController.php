<?php

namespace App\Http\Controllers;

use App\Models\Level;
use Illuminate\Http\Request;
use Inertia\Inertia; // Import Inertia
use App\Models\Subject;
use App\Models\School;
use Illuminate\Support\Facades\Log;

class LevelController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $levels = Level::all();
        $subjects = Subject::all();
        $schools = School::all();
       
        return Inertia::render('Menu/Othersettings', [
            'levels' => $levels,
            'subjects' => $subjects,
            'schools' => $schools
        ]);
    }
    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('othersettings/Create'); // Return the create form view
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Validate the request data
        $validatedData = $request->validate([
            'name' => 'required|string|max:255|unique:levels,name',
        ]);

        // Create a new level
        Level::create($validatedData);

        // Redirect to the levels index page with a success message
        return redirect()->route('othersettings.index')->with('success', 'Level created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Level $level)
    {
        return Inertia::render('othersettings/Show', [
            'level' => $level, // Pass the level to the frontend
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Level $level)
    {
        return Inertia::render('othersettings/Edit', [
            'level' => $level, // Pass the level to the frontend
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Level $level)
    {
        // Validate the request data
        $validatedData = $request->validate([
            'name' => 'required|string|max:255|unique:levels,name,' . $level->id,
        ]);

        // Update the level
        $level->update($validatedData);

        // Redirect to the levels index page with a success message
        return redirect()->route('othersettings.index')->with('success', 'Level updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Level $level)
    {
        // Delete the level
        $level->delete();

        // Redirect to the levels index page with a success message
        return redirect()->route('othersettings.index')->with('success', 'Level deleted successfully.');
    }
}