<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Membership;
use App\Models\Teacher;
use App\Models\Classes;
use App\Models\School;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;
use Spatie\Activitylog\Models\Activity;
use Carbon\Carbon;

class InvoiceController extends Controller
{
    /**
     * Display a listing of invoices.
     */
    public function index()
    {
        $invoices = Invoice::with(['membership' => function($membershipQuery) {
            $membershipQuery->withTrashed()->with(['student', 'offer']);
        }])->paginate(10);

        // Always decode selected_months and add selectedMonths as array for each invoice
        $invoices->getCollection()->transform(function ($invoice) {
            if (isset($invoice->selected_months)) {
                $selectedMonths = $invoice->selected_months;
                if (is_string($selectedMonths)) {
                    $decoded = json_decode($selectedMonths, true);
                    if (is_array($decoded)) {
                        $invoice->selectedMonths = $decoded;
                    } else {
                        $invoice->selectedMonths = [];
                    }
                } elseif (is_array($selectedMonths)) {
                    $invoice->selectedMonths = $selectedMonths;
                } else {
                    $invoice->selectedMonths = [];
                }
            } else {
                $invoice->selectedMonths = [];
            }
            return $invoice;
        });

        return Inertia::render('Menu/SingleStudentPage', [
            'invoices' => $invoices,
        ]);
    }

    /**
     * Show the form for creating a new invoice.
     */
    public function create(Request $request)
    {
        $membership_id = $request->input('membership_id');
        $membership = null;

        if ($membership_id) {
            $membership = Membership::withTrashed()->with(['student', 'offer'])->findOrFail($membership_id);
        }

        $studentMemberships = Membership::withTrashed()->with(['student', 'offer'])
            ->where('payment_status', 'pending')
            ->get()
            ->map(function ($membership) {
                return [
                    'id' => $membership->id,
                    'offer_name' => $membership->student->name . ' - ' . $membership->offer->name,
                    'price' => $membership->offer->price,
                    'offer_id' => $membership->offer_id
                ];
            });

        return Inertia::render('Menu/SingleStudentPage', [
            'StudentMemberships' => $studentMemberships,
            'selectedMembership' => $membership,
        ]);
    }

    /**
     * Store a newly created invoice in the database.
     */
    public function store(Request $request)
    {
        DB::beginTransaction();

        try {
            // Validate the incoming request


            $validated = $request->validate([
                'membership_id' => 'required|integer',
                'student_id' => 'required|integer',
                'months' => [
                    'required',
                    'integer',
                    function ($attribute, $value, $fail) use ($request) {
                        if ($value === 0 && !$request->input('includePartialMonth')) {
                            $fail('Le champ mois doit être supérieur à 0 si le mois partiel n\'est pas sélectionné.');
                        }
                    }
                ],
                'selected_months' => 'nullable', // Accept array or stringified JSON
                'billDate' => 'required|date',
                'creationDate' => 'nullable|date',
                'totalAmount' => 'required|numeric',
                'amountPaid' => 'required|numeric',
                'rest' => 'required|numeric',
                'offer' => 'nullable|string',
                'offer_id' => 'nullable|integer',
                'endDate' => 'nullable|date',
                'includePartialMonth' => 'nullable|boolean',
                'partialMonthAmount' => 'nullable|numeric',
                'last_payment_date' => 'nullable|date',
            ]);



            // Always accept both selectedMonths and selected_months from frontend
            $selectedMonths = $request->input('selectedMonths');
            if (is_null($selectedMonths)) {
                $selectedMonths = $request->input('selected_months');
            }
            if (is_string($selectedMonths)) {
                $decoded = json_decode($selectedMonths, true);
                if (is_array($decoded)) {
                    $selectedMonths = $decoded;
                } else {
                    $selectedMonths = [];
                }
            }
            if (!is_array($selectedMonths)) {
                $selectedMonths = [];
            }

            $validated['selected_months'] = json_encode($selectedMonths);
            // Set the creator
            $validated['created_by'] = auth()->email ?? auth()->id(); // Fallback to ID if email is not available

            // Fetch the membership (including deleted ones)
            $membership = Membership::withTrashed()->findOrFail($validated['membership_id']);
            // Always set offer_id from membership
            $validated['offer_id'] = $membership->offer_id;
            
            // Additional validation: Ensure offer_id matches membership
            if (isset($validated['offer_id']) && $validated['offer_id'] != $membership->offer_id) {
                Log::warning('Offer ID mismatch detected during invoice creation', [
                    'invoice_offer_id' => $validated['offer_id'],
                    'membership_offer_id' => $membership->offer_id,
                    'membership_id' => $membership->id,
                    'student_id' => $membership->student_id
                ]);
                // Force correct offer_id from membership
                $validated['offer_id'] = $membership->offer_id;
            }

            // Create the invoice
            $invoice = Invoice::create($validated);
            Log::info('Invoice created successfully', ['invoice_id' => $invoice->id, 'data' => $validated]);
            // Log the activity
            $this->logActivity('created', $invoice, null, $invoice->toArray());

            // Process teacher membership payments using the new service with validation
            $paymentService = new \App\Services\TeacherMembershipPaymentService();
            $paymentResult = $paymentService->processInvoicePayment($invoice, $validated);
            
            // Validate that payment records were created successfully
            if (!$paymentResult || !$paymentResult['success']) {
                throw new \Exception('Failed to create teacher payment records: ' . implode(', ', $paymentResult['errors'] ?? ['Unknown error']));
            }
            
            Log::info('Payment records created successfully', [
                'invoice_id' => $invoice->id,
                'created_records' => $paymentResult['created_records'] ?? 0,
                'updated_records' => $paymentResult['updated_records'] ?? 0
            ]);

            // Always update start_date. Update end_date based on actual paid period
            $updateData = [
                'start_date' => $validated['billDate'],
                'payment_status' => ($validated['amountPaid'] >= $validated['totalAmount']) ? 'paid' : 'pending',
                'is_active' => ($validated['amountPaid'] >= $validated['totalAmount']),
            ];
            
            // Update end_date: use invoice end_date if it's more recent than current membership end_date
            // This ensures the membership reflects the actual paid period
            if (empty($membership->end_date) || (isset($validated['endDate']) && $validated['endDate'] > $membership->end_date)) {
                $updateData['end_date'] = $validated['endDate'];
            }
            $membership->update($updateData);

            DB::commit();
            return redirect()->back()->with('success', 'Invoice created successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating invoice:', ['error' => $e->getMessage()]);
            return redirect()->back()->withErrors(['error' => 'An error occurred while creating the invoice.']);
        }
    }

    /**
     * Display the specified invoice.
     */
    public function show($id)
    {
        $invoice = Invoice::with([
            'membership' => function($membershipQuery) {
                $membershipQuery->withTrashed()->with(['student', 'student.class', 'student.school', 'offer']);
            },
            'student',
            'student.class',
            'student.school',
            'offer'
        ])->findOrFail($id);

        $invoiceData = $invoice->toArray();
        // Always send selectedMonths as array if present
        if (isset($invoiceData['selected_months'])) {
            $selectedMonths = $invoiceData['selected_months'];
            if (is_string($selectedMonths)) {
                $decoded = json_decode($selectedMonths, true);
                if (is_array($decoded)) {
                    $invoiceData['selectedMonths'] = $decoded;
                } else {
                    $invoiceData['selectedMonths'] = [];
                }
            } elseif (is_array($selectedMonths)) {
                $invoiceData['selectedMonths'] = $selectedMonths;
            } else {
                $invoiceData['selectedMonths'] = [];
            }
        } else {
            $invoiceData['selectedMonths'] = [];
        }

        return Inertia::render('Invoices/InvoiceViewer', [
            'invoice' => $invoiceData
        ]);
    }

    /**
     * API: Get a single invoice as JSON (for modal details)
     */
    public function apiShow($id)
    {
        $invoice = Invoice::with([
            'membership' => function($membershipQuery) {
                $membershipQuery->withTrashed()->with(['student', 'student.class', 'student.school', 'offer']);
            },
            'student',
            'student.class',
            'student.school',
            'offer'
        ])->findOrFail($id);

        // Prefer membership.student, fallback to invoice.student
        $student = $invoice->membership && $invoice->membership->student ? $invoice->membership->student : $invoice->student;
        $student_name = $student ? trim(($student->firstName ?? '') . ' ' . ($student->lastName ?? '')) : null;
        $student_class = $student && $student->class ? $student->class->name : null;
        $student_school = $student && $student->school ? $student->school->name : null;
        $student_id = $student ? $student->id : null;

        // Prefer membership.offer, fallback to invoice.offer
        $offer = $invoice->membership && $invoice->membership->offer ? $invoice->membership->offer : $invoice->offer;
        $offer_name = $offer ? $offer->offer_name : null;

        // Payments: if amountPaid > 0, show a single payment (for now)
        $payments = [];
        if ($invoice->amountPaid > 0) {
            $payments[] = [
                'date' => $invoice->last_payment_date ? $invoice->last_payment_date->format('Y-m-d') : ($invoice->creationDate ? $invoice->creationDate->format('Y-m-d') : null),
                'amount' => (float) $invoice->amountPaid,
                'method' => 'Cash',
            ];
        }

        // Teachers: from membership.teachers (array of {teacherId, name, amount})
        $teachers = [];
        if ($invoice->membership && is_array($invoice->membership->teachers)) {
            foreach ($invoice->membership->teachers as $teacher) {
                $teachers[] = [
                    'teacherId' => $teacher['teacherId'] ?? null,
                    'name' => $teacher['name'] ?? null,
                    'amount' => $teacher['amount'] ?? null,
                ];
            }
        }

        // selectedMonths
        $selectedMonths = [];
        if (isset($invoice->selected_months)) {
            if (is_string($invoice->selected_months)) {
                $decoded = json_decode($invoice->selected_months, true);
                if (is_array($decoded)) {
                    $selectedMonths = $decoded;
                }
            } elseif (is_array($invoice->selected_months)) {
                $selectedMonths = $invoice->selected_months;
            }
        }

        $data = [
            'id' => $invoice->id,
            'membership_id' => $invoice->membership_id,
            'months' => $invoice->months,
            'billDate' => $invoice->billDate,
            'creationDate' => $invoice->creationDate,
            'totalAmount' => is_numeric($invoice->totalAmount) ? floatval($invoice->totalAmount) : 0,
            'amountPaid' => is_numeric($invoice->amountPaid) ? floatval($invoice->amountPaid) : 0,
            'rest' => is_numeric($invoice->rest) ? floatval($invoice->rest) : 0,
            'student_id' => $student_id,
            'student_name' => $student_name,
            'student_class' => $student_class,
            'student_school' => $student_school,
            'offer_id' => $invoice->offer_id,
            'offer_name' => $offer_name,
            'endDate' => $invoice->endDate,
            'includePartialMonth' => $invoice->includePartialMonth,
            'partialMonthAmount' => $invoice->partialMonthAmount,
            'last_payment' => $invoice->last_payment_date,
            'created_at' => $invoice->created_at,
            'selectedMonths' => $selectedMonths,
            'payments' => $payments,
            'teachers' => $teachers,
        ];

        return response()->json(['invoice' => $data]);
    }

    /**
     * Show the form for editing the specified invoice.
     */
    public function edit($id)
    {
        $invoice = Invoice::findOrFail($id);
        $studentMemberships = Membership::withTrashed()->with(['student', 'offer'])
            ->get()
            ->map(function ($membership) {
                return [
                    'id' => $membership->id,
                    'offer_name' => $membership->student->name . ' - ' . $membership->offer->name,
                    'price' => $membership->offer->price,
                    'offer_id' => $membership->offer_id
                ];
            });

        // Always send selected_months as an array if present
        $invoiceData = $invoice->toArray();
        if (isset($invoiceData['selected_months'])) {
            $selectedMonths = $invoiceData['selected_months'];
            if (is_string($selectedMonths)) {
                $decoded = json_decode($selectedMonths, true);
                if (is_array($decoded)) {
                    $invoiceData['selectedMonths'] = $decoded;
                } else {
                    $invoiceData['selectedMonths'] = [];
                }
            } elseif (is_array($selectedMonths)) {
                $invoiceData['selectedMonths'] = $selectedMonths;
            } else {
                $invoiceData['selectedMonths'] = [];
            }
        } else {
            $invoiceData['selectedMonths'] = [];
        }

        return Inertia::render('Menu/SingleStudentPage', [
            'invoice' => $invoiceData,
            'StudentMemberships' => $studentMemberships,
        ]);
    }

    /**
     * Update the specified invoice in the database.
     */
    public function update(Request $request, $id)
    {
        DB::beginTransaction();

        try {
            // Validate the incoming request
            $validated = $request->validate([
                'membership_id' => 'integer',
                'student_id' => 'required|integer',
                'months' => [
                    'required',
                    'integer',
                    function ($attribute, $value, $fail) use ($request) {
                        if ($value === 0 && !$request->input('includePartialMonth')) {
                            $fail('Le champ mois doit être supérieur à 0 si le mois partiel n\'est pas sélectionné.');
                        }
                    }
                ],
                'selected_months' => 'nullable', // Accept array or stringified JSON
                'billDate' => 'required|date',
                'creationDate' => 'nullable|date',
                'totalAmount' => 'required|numeric',
                'amountPaid' => 'required|numeric',
                'rest' => 'required|numeric',
                'offer' => 'nullable|string',
                'offer_id' => 'nullable|integer',
                'endDate' => 'nullable|date',
                'includePartialMonth' => 'nullable|boolean',
                'partialMonthAmount' => 'nullable|numeric',
                'last_payment_date' => 'nullable|date',
            ]);

            $invoice = Invoice::findOrFail($id);
            $previousAmountPaid = $invoice->amountPaid;

            // Capture old data before update
            $oldData = $invoice->toArray(); // Keep this for activity log if needed

            // Update last_payment_date only if amountPaid has changed
            if (round((float)($validated['amountPaid']), 2) != round((float)($previousAmountPaid), 2)) {
                $validated['last_payment_date'] = now()->toDateTimeString();
            } else {
                // Keep the existing last_payment_date if amountPaid hasn't changed
                $validated['last_payment_date'] = $invoice->last_payment_date;
            }

            // Always accept both selectedMonths and selected_months from frontend
            $selectedMonths = $request->input('selectedMonths');
            if (is_null($selectedMonths)) {
                $selectedMonths = $request->input('selected_months');
            }
            if (is_string($selectedMonths)) {
                $decoded = json_decode($selectedMonths, true);
                if (is_array($decoded)) {
                    $selectedMonths = $decoded;
                } else {
                    $selectedMonths = [];
                }
            }
            if (!is_array($selectedMonths)) {
                $selectedMonths = [];
            }
            $validated['selected_months'] = json_encode($selectedMonths);

            // Fetch the membership (including deleted ones)
            $membership = Membership::withTrashed()->findOrFail($validated['membership_id']);
            // Always set offer_id from membership
            $validated['offer_id'] = $membership->offer_id;

            // Update the invoice
            $invoice->update($validated);

            // Log the activity
            $this->logActivity('updated', $invoice, $oldData, $invoice->toArray());

            // --- TEACHER MEMBERSHIP PAYMENT LOGIC ---
            // The payment service now handles updates incrementally without full reversal
            $paymentService = new \App\Services\TeacherMembershipPaymentService();
            $paymentResult = $paymentService->processInvoicePayment($invoice, $validated);
            
            // Validate payment processing
            if (!$paymentResult || !$paymentResult['success']) {
                Log::warning('Payment processing had issues', [
                    'invoice_id' => $invoice->id,
                    'errors' => $paymentResult['errors'] ?? ['Unknown error']
                ]);
            }
            
            // Reactivate payment records if invoice is fully paid
            if ($invoice->amountPaid >= $invoice->totalAmount) {
                $reactivationResult = $paymentService->reactivatePaymentRecords($invoice);
                if ($reactivationResult['success'] && $reactivationResult['reactivated_records'] > 0) {
                    Log::info('Reactivated payment records for fully paid invoice', [
                        'invoice_id' => $invoice->id,
                        'reactivated_count' => $reactivationResult['reactivated_records']
                    ]);
                }
            }
            // --- END TEACHER MEMBERSHIP PAYMENT LOGIC ---

            // Always update start_date. Update end_date based on actual paid period
            $updateData = [
                'start_date' => $validated['billDate'],
                'payment_status' => (round((float)($validated['amountPaid']), 2) >= round((float)($validated['totalAmount']), 2)) ? 'paid' : 'pending',
                'is_active' => (round((float)($validated['amountPaid']), 2) >= round((float)($validated['totalAmount']), 2)),
            ];
            
            // Update end_date: use invoice end_date if it's more recent than current membership end_date
            // This ensures the membership reflects the actual paid period
            if (empty($membership->end_date) || (isset($validated['endDate']) && Carbon::parse($validated['endDate']) > Carbon::parse($membership->end_date))) {
                $updateData['end_date'] = $validated['endDate'];
            }
            $membership->update($updateData);

            DB::commit();
            return redirect()->back()->with('success', 'Invoice updated successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating invoice:', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return redirect()->back()->withErrors(['error' => 'An error occurred while updating the invoice.']);
        }
    }

    /**
     * Remove the specified invoice from the database.
     */
    public function destroy($id)
    {
        try {
            $invoice = Invoice::findOrFail($id);

            // Log the activity before deletion
            $this->logActivity('deleted', $invoice, $invoice->toArray(), null);

            // --- NEW LOGIC: Update membership and reverse teacher payments ---
            $membership = $invoice->membership;
            if ($membership) {
                // Find the latest active invoice for this membership (excluding the one being deleted)
                $latestActiveInvoice = Invoice::where('membership_id', $membership->id)
                    ->where('id', '!=', $invoice->id)
                    ->orderBy('endDate', 'desc')
                    ->first();

                if ($latestActiveInvoice) {
                    // Update membership based on the latest active invoice
                    $membership->end_date = $latestActiveInvoice->endDate;
                    $membership->payment_status = 'paid';
                    $membership->is_active = true;
                } else {
                    // No other active invoices, set to expired
                    $membership->payment_status = 'expired';
                    $membership->is_active = false;
                }
                $membership->save();

                // Reverse teacher payments using the new service
                $paymentService = new \App\Services\TeacherMembershipPaymentService();
                $paymentService->reverseInvoicePayments($invoice);
            }
            // --- END NEW LOGIC ---

            $invoice->delete();
            return redirect()->back()->with('success', 'Invoice deleted successfully.');
        } catch (\Exception $e) {
            Log::error('Error deleting invoice:', ['error' => $e->getMessage()]);
            return redirect()->back()->withErrors(['error' => 'An error occurred while deleting the invoice.']);
        }
    }

    /**
     * Generate and download the invoice as a PDF.
     */
    public function generateInvoicePdf($id)
    {
        $invoice = Invoice::with(['membership' => function($membershipQuery) {
            $membershipQuery->withTrashed()->with('offer');
        }, 'student'])
            ->findOrFail($id);

        // Extract membership, student, and offer details
        $membership = $invoice->membership;
        $student = $invoice->student;
        $offerName = $membership?->offer?->offer_name ?? 'No offer available';

        // Load the view for the invoice
        $pdf = Pdf::loadView('invoices.invoice_pdf', [
            'invoice' => $invoice,
            'membership' => $membership,
            'student' => $student,
            'offerName' => $offerName,
        ]);

        // Return the PDF as a downloadable file
        return $pdf->download('invoice_' . $invoice->id . '.pdf');
    }

    /**
     * Download the invoice as a PDF.
     */
    public function download($id)
    {
        // Fetch the invoice by ID
        $invoice = Invoice::with(['student.class', 'offer'])->findOrFail($id);
        $className = $invoice->student->class->name;

        // Add the class name to the invoice object
        $invoice->className = $className;

        // Generate the PDF
        $pdf = Pdf::loadView('invoices.teacher_invoicePdf', compact('invoice'));

        // Download the PDF
        return $pdf->download("TeacherInvoice-{$invoice->id}.pdf");
    }

    /**
     * Bulk download invoices as a PDF.
     */
    public function bulkDownload(Request $request)
    {
        // Get the selected invoice IDs from the request
        $invoiceIds = $request->input('invoiceIds', []);

        if (empty($invoiceIds)) {
            return redirect()->back()->with('error', 'No invoices selected for download');
        }

        // Log for debugging
        Log::info('Selected Invoice IDs:', $invoiceIds);

        $invoices = Invoice::with(['student', 'offer'])
            ->whereIn('id', $invoiceIds)
            ->get();

        if ($invoices->isEmpty()) {
            return redirect()->back()->with('error', 'No invoices found');
        }

        // Fetch class names for each invoice
        $invoices->each(function ($invoice) {
            $invoice->className = Classes::find($invoice->student->classId)->name;
        });

        // Generate the PDF with proper headers
        $pdf = Pdf::loadView('invoices.teacher-bulk-invoices', compact('invoices'));

        // Make sure proper headers are set for download
        return $pdf->download("teacher-bulk-invoices-" . date('Y-m-d') . ".pdf", [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="teacher-bulk-invoices-' . date('Y-m-d') . '.pdf"'
        ]);
    }

    /**
     * Bulk download teacher income report as a PDF.
     */
    public function teacherBulkDownload(Request $request)
    {
        // Get the selected invoice IDs and summary data from the request (works for both GET and POST)
        $invoiceIds = $request->input('invoiceIds', $request->query('invoiceIds', []));
        
        // Handle JSON string if invoiceIds is passed as JSON
        if (is_string($invoiceIds)) {
            $invoiceIds = json_decode($invoiceIds, true) ?? [];
        }
        $totalIncome = $request->input('totalIncome', $request->query('totalIncome', 0));
        $totalInvoices = $request->input('totalInvoices', $request->query('totalInvoices', 0));
        $teacherName = $request->input('teacherName', $request->query('teacherName', 'Teacher'));
        $dateRange = $request->input('dateRange', $request->query('dateRange', 'All time'));

        if (empty($invoiceIds)) {
            return redirect()->back()->with('error', 'No invoices selected for download');
        }

        // Get the selected invoices with their details
        $invoices = Invoice::with(['student', 'student.class', 'student.school', 'offer'])
            ->whereIn('id', $invoiceIds)
            ->get();

        if ($invoices->isEmpty()) {
            return redirect()->back()->with('error', 'No invoices found');
        }

        // Prepare data for the PDF
        $summaryData = [
            'totalIncome' => $totalIncome,
            'totalInvoices' => $totalInvoices,
            'teacherName' => $teacherName,
            'dateRange' => $dateRange,
            'generatedDate' => now()->format('Y-m-d H:i:s')
        ];

        // Generate the PDF
        $pdf = Pdf::loadView('invoices.teacher-income-report', compact('invoices', 'summaryData'));

        // Return the PDF as a response with proper headers
        return response($pdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="teacher-income-report-' . date('Y-m-d') . '.pdf"',
            'Content-Length' => strlen($pdf->output()),
        ]);
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
            'TargetName' => $model->student->name, // Name of the target student
            'action' => $action, // Type of action (created, updated, deleted)
            'table' => $tableName, // Table where the action occurred
            'user' => auth()->user()->name, // User who performed the action
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
                'membership_id' => $model->membership_id,
                'student_id' => $model->student_id,
                'totalAmount' => $model->totalAmount,
                'amountPaid' => $model->amountPaid,
            ];
        }

        // For deletions, show the key fields of the deleted entity
        if ($action === 'deleted') {
            $properties['deleted_data'] = [
                'membership_id' => $oldData['membership_id'],
                'student_id' => $oldData['student_id'],
                'totalAmount' => $oldData['totalAmount'],
                'amountPaid' => $oldData['amountPaid'],
            ];
        }

        // Log the activity
        activity()
            ->causedBy(auth()->user())
            ->performedOn($model)
            ->withProperties($properties)
            ->log($description);
    }
}