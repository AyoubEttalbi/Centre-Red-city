<?php

namespace App\Http\Controllers;

use App\Models\Membership;
use App\Models\Teacher;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Spatie\Activitylog\Models\Activity;
use App\Models\Student;
use App\Models\Offer;

class MembershipController extends Controller
{
    /**
     * Display a listing of memberships.
     */
    public function index()
    {
        $memberships = Membership::withTrashed()->with(['student', 'offer', 'invoices'])->paginate(10);

        return Inertia::render('Menu/SingleStudentPage', [
            'memberships' => $memberships,
        ]);
    }

    /**
     * Show the form for creating a new membership.
     */
    public function create()
    {
        // Fetch necessary data for creating a membership
        $students = Student::all();
        $offers = Offer::with('subjects')->get();
        $teachers = Teacher::all();

        return Inertia::render('Memberships/Create', [
            'students' => $students,
            'offers' => $offers,
            'teachers' => $teachers,
        ]);
    }

    /**
     * Store a newly created membership in the database.
     */
    public function store(Request $request)
    {
        DB::beginTransaction();

        try {
            // Validate the incoming request
            $validated = $request->validate([
                'student_id' => 'required|integer',
                'offer_id' => 'required|integer',
                'teachers' => 'required|array',
                'teachers.*.subject' => 'required|string',
                'teachers.*.teacherId' => 'required|string',
                'teachers.*.amount' => 'required|numeric',
            ]);

            // Create the membership record with payment_status set to 'pending'
            $membership = Membership::create([
                'student_id' => $validated['student_id'],
                'offer_id' => $validated['offer_id'],
                'teachers' => $validated['teachers'],
                'payment_status' => 'pending', // Add default payment status
                'is_active' => false // Membership is inactive until paid
            ]);

            // Log the activity
            $this->logActivity('created', $membership, null, $membership->toArray());

            DB::commit();

            return redirect()->back()->with('success', 'Membership created successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating membership:', ['error' => $e->getMessage()]);
            return redirect()->back()->withErrors(['error' => 'An error occurred while processing your request.']);
        }
    }

    /**
     * Display the specified membership.
     */
    public function show($id)
    {
        $membership = Membership::withTrashed()->with(['student', 'offer', 'invoices'])->findOrFail($id);

        return Inertia::render('Memberships/Show', [
            'membership' => $membership,
        ]);
    }

    /**
     * Show the form for editing the specified membership.
     */
    public function edit($id)
    {
        $membership = Membership::withTrashed()->findOrFail($id);
        $students = Student::all();
        $offers = Offer::with('subjects')->get();
        $teachers = Teacher::all();

        return Inertia::render('Memberships/Edit', [
            'membership' => $membership,
            'students' => $students,
            'offers' => $offers,
            'teachers' => $teachers,
        ]);
    }

    /**
     * Update the specified membership in the database.
     */
    public function update(Request $request, $id)
    {
        DB::beginTransaction();

        try {
            // Log the incoming request data
            Log::info('Update Membership Request:', $request->all());

            // Validate the incoming request
            $validated = $request->validate([
                'student_id' => 'required|integer',
                'offer_id' => 'required|integer',
                'teachers' => 'required|array',
                'teachers.*.teacherId' => 'required|string',
                'teachers.*.amount' => 'required|numeric',
            ]);

            // Find the membership (including deleted ones)
            $membership = Membership::withTrashed()->findOrFail($id);

            // Capture old data before update
            $oldData = $membership->toArray();

            // Only update teacher membership payments if the membership was previously paid
            if ($membership->payment_status === 'paid') {
                // Reverse old teacher payments
                $paymentService = new \App\Services\TeacherMembershipPaymentService();
                
                // Deactivate old teacher payment records
                \App\Models\TeacherMembershipPayment::where('membership_id', $membership->id)
                    ->where('is_active', true)
                    ->update(['is_active' => false]);
            }

            // Update the membership with new data
            $membership->update([
                'student_id' => $validated['student_id'],
                'offer_id' => $validated['offer_id'],
                'teachers' => $validated['teachers'],
            ]);

            // Log the activity
            $this->logActivity('updated', $membership, $oldData, $membership->toArray());

            DB::commit();
            return redirect()->back()->with('success', 'Membership updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating membership:', ['error' => $e->getMessage()]);
            return redirect()->back()->withErrors(['error' => 'An error occurred while updating the membership.']);
        }
    }

    /**
     * Remove the specified membership from the database.
     */
    public function destroy($id)
    {
        DB::beginTransaction();

        try {
            // Find the membership (including deleted ones)
            $membership = Membership::withTrashed()->findOrFail($id);

            // Log the activity before deletion
            $this->logActivity('deleted', $membership, $membership->toArray(), null);

            // Only deactivate teacher payment records if the membership was paid
            // (but don't reverse wallet payments - that only happens when invoices are deleted)
            if ($membership->payment_status === 'paid') {
                // Deactivate teacher payment records
                \App\Models\TeacherMembershipPayment::where('membership_id', $membership->id)
                    ->where('is_active', true)
                    ->update(['is_active' => false]);
            }

            // Delete the membership
            $membership->delete();

            DB::commit();
            return redirect()->back()->with('success', 'Membership deleted successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error deleting membership:', ['error' => $e->getMessage()]);
            return redirect()->back()->withErrors(['error' => 'An error occurred while deleting the membership.']);
        }
    }

    /**
     * Log activity for a model.
     */
    protected function logActivity($action, $model, $oldData = null, $newData = null)
    {
        $description = ucfirst($action) . ' ' . class_basename($model) . ' (' . $model->id . ')';
        $tableName = $model->getTable();

        // Define the properties to log
        $properties = [
            'TargetName' => $model->student->firstName . ' ' . $model->student->lastName, // Name of the target student
            'action' => $action, // Type of action (created, updated, deleted)
            'table' => $tableName, // Table where the action occurred
            'user' => Auth::user()->name, // User who performed the action
        ];

        // For updates, show only the changed fields
        if ($action === 'updated' && $oldData && $newData) {
            $changedFields = [];
            foreach ($newData as $key => $value) {
                if ($oldData[$key] !== $value) {
                    $changedFields[$key] = [
                        'old' => $oldData[$key],
                        'new' => $value,
                    ];
                }
            }
            $properties['changed_fields'] = $changedFields;
        }

        // For creations, show only the key fields
        if ($action === 'created') {
            $properties['new_data'] = [
                'student_id' => $model->student_id,
                'offer_id' => $model->offer_id,
                'teachers' => $model->teachers,
            ];
        }

        // For deletions, show the key fields of the deleted entity
        if ($action === 'deleted') {
            $properties['deleted_data'] = [
                'student_id' => $oldData['student_id'],
                'offer_id' => $oldData['offer_id'],
                'teachers' => $oldData['teachers'],
            ];
        }

        // Log the activity
        activity()
            ->causedBy(Auth::user())
            ->performedOn($model)
            ->withProperties($properties)
            ->log($description);
    }
}