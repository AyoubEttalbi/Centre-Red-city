<?php

namespace App\Http\Controllers;

use App\Models\Subject;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Teacher;
class SubjectController extends Controller
{
    /**
     * Display a listing of the subjects.
     */
    public function index()
    {
        $subjects = Subject::all();
    
            return Inertia::render('Menu/Othersettings', [
                'subjects' => $subjects,
            ]);
        // } elseif ($view === 'teachers') {
        //     return Inertia::render('Menu/TeacherListPage', [
        //         'subjects' => $subjects,
        //     ]);
        
           
       
    }

    /**
     * Store a newly created subject in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|unique:subjects',
            'icon' => 'nullable|string',
            'color' => 'nullable|string',
        ]);

        $subject = Subject::create($request->all());
        return redirect()->route('othersettings.index')->with('success', 'Subject created successfully.');
    }

    /**
     * Update the specified subject in storage.
     */
    public function update(Request $request, Subject $subject)
    {
        $request->validate([
            'name' => 'sometimes|required|string|unique:subjects,name,' . $subject->id,
            'icon' => 'nullable|string',
            'color' => 'nullable|string',
        ]);

        $subject->update($request->all());
        return redirect()->route('othersettings.index')->with('success', 'Subject updated successfully.');
    }

    /**
     * Remove the specified subject from storage.
     */
    public function destroy(Subject $subject)
    {
        $subject->delete();
        return redirect()->route('othersettings.index')->with('success', 'Subject deleted successfully.');
    }
}