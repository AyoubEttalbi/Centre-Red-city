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
            // Normalize membership_id and student_id before validation
            $incomingMembershipId = $request->input('membership_id', $request->input('membershipId'));
            if ($incomingMembershipId !== null && $incomingMembershipId !== '') {
                if (is_string($incomingMembershipId) && is_numeric($incomingMembershipId)) {
                    $incomingMembershipId = (int) $incomingMembershipId;
                }
                $request->merge(['membership_id' => $incomingMembershipId]);
            }

            // If student_id is missing but membership_id is provided, infer student_id from membership
            if (!$request->filled('student_id') && $request->filled('membership_id')) {
                $membershipForStudent = Membership::withTrashed()->find($request->input('membership_id'));
                if ($membershipForStudent) {
                    $request->merge(['student_id' => $membershipForStudent->student_id]);
                }
            }

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
            ], [
                'membership_id.required' => 'Adhésion manquante: veuillez sélectionner une adhésion valide.',
                'student_id.required' => 'Étudiant manquant: veuillez sélectionner un étudiant.',
                'months.required' => 'Le nombre de mois est obligatoire.',
                'billDate.required' => 'La date de facturation est obligatoire.',
                'totalAmount.required' => 'Le montant total est obligatoire.',
                'amountPaid.required' => 'Le montant payé est obligatoire.',
                'rest.required' => 'Le reste à payer est obligatoire.',
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

            // Pré-vérifications bloquantes pour éviter des factures invalides
            if (!$membership->offer) {
                throw new \Exception('Offre introuvable pour cette adhésion. Veuillez vérifier l\'offre.');
            }
            if (!is_array($membership->teachers) || count($membership->teachers) === 0) {
                throw new \Exception('Aucun enseignant n\'est associé à cette adhésion. Veuillez ajouter au moins un enseignant.');
            }
            if (!is_array($membership->offer->percentage)) {
                throw new \Exception('L\'offre sélectionnée n\'a pas de pourcentages valides.');
            }
            // Always set offer_id from membership
            $validated['offer_id'] = $membership->offer_id;

            // Create the invoice
            $invoice = Invoice::create($validated);
            Log::info('Invoice created successfully', ['invoice_id' => $invoice->id, 'data' => $validated]);
            // Log the activity
            $this->logActivity('created', $invoice, null, $invoice->toArray());

            // Process teacher membership payments using the new service with validation
            $paymentService = new \App\Services\TeacherMembershipPaymentService();
            $paymentResult = $paymentService->processInvoicePayment($invoice, $validated);
            
            // Validate that payment records were created successfully
            if (!$paymentResult || !$paymentResult['success'] || (($paymentResult['created_records'] ?? 0) + ($paymentResult['updated_records'] ?? 0)) === 0) {
                Log::error('No payment records created', ['invoice_id' => $invoice->id, 'result' => $paymentResult]);
                
                // NEW: Create user-friendly error messages
                $userFriendlyErrors = $this->convertToUserFriendlyErrors($paymentResult['errors'] ?? ['Unknown error occurred']);
                
                throw new \Exception($userFriendlyErrors[0]); // Show first error to user
            }
            
            Log::info('Payment records created successfully', [
                'invoice_id' => $invoice->id,
                'created_records' => $paymentResult['created_records'] ?? 0,
                'updated_records' => $paymentResult['updated_records'] ?? 0
            ]);

            // NEW: Reconcile teacher payouts for initial invoice creation
            if ($validated['amountPaid'] > 0) {
                $reconcileResult = $paymentService->reconcilePaidMonthsForInvoice($invoice);
                if (!$reconcileResult['success']) {
                    Log::warning('Initial reconciliation reported issues', [
                        'invoice_id' => $invoice->id,
                        'errors' => $reconcileResult['errors']
                    ]);
                } else {
                    Log::info('Initial reconciliation completed', [
                        'invoice_id' => $invoice->id,
                        'adjusted_records' => $reconcileResult['adjusted_records'],
                        'total_delta' => $reconcileResult['total_delta']
                    ]);
                }
            }

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
            return redirect()->back()->with('success', 'Facture créée avec succès.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating invoice:', ['error' => $e->getMessage()]);
            
            // NEW: Return proper error response
            if (request()->expectsJson() || request()->header('Accept') === 'application/json') {
                return $this->createErrorResponse([$e->getMessage()], [
                    'invoice_data' => $request->except(['_token']),
                    'validation_data' => $validated ?? []
                ]);
            }
            
            return redirect()->back()->withErrors([
                'error' => $this->convertSingleError($e->getMessage()) ?: 'Création de facture annulée: ' . $e->getMessage()
            ])->withInput();
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

        // Ensure creationDate is returned as 'Y-m-d' (no timezone) to make client parsing deterministic
        $creationDateFormatted = null;
        if ($invoice->creationDate) {
            try {
                $creationDateFormatted = $invoice->creationDate->format('Y-m-d');
            } catch (\Exception $e) {
                $creationDateFormatted = (string) $invoice->creationDate;
            }
        }

        $data = [
            'id' => $invoice->id,
            'membership_id' => $invoice->membership_id,
            'months' => $invoice->months,
            'billDate' => $invoice->billDate,
            'creationDate' => $creationDateFormatted,
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
            // Normalize membership_id and student_id before validation
            $incomingMembershipId = $request->input('membership_id', $request->input('membershipId'));
            if ($incomingMembershipId !== null && $incomingMembershipId !== '') {
                if (is_string($incomingMembershipId) && is_numeric($incomingMembershipId)) {
                    $incomingMembershipId = (int) $incomingMembershipId;
                }
                $request->merge(['membership_id' => $incomingMembershipId]);
            }

            // If student_id is missing but membership_id is provided, infer student_id from membership
            if (!$request->filled('student_id') && $request->filled('membership_id')) {
                $membershipForStudent = Membership::withTrashed()->find($request->input('membership_id'));
                if ($membershipForStudent) {
                    $request->merge(['student_id' => $membershipForStudent->student_id]);
                }
            }

            // Validate the incoming request
            $validated = $request->validate([
                'membership_id' => 'nullable|integer',
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
            ], [
                'student_id.required' => 'Étudiant manquant: veuillez sélectionner un étudiant.',
                'months.required' => 'Le nombre de mois est obligatoire.',
                'billDate.required' => 'La date de facturation est obligatoire.',
                'totalAmount.required' => 'Le montant total est obligatoire.',
                'amountPaid.required' => 'Le montant payé est obligatoire.',
                'rest.required' => 'Le reste à payer est obligatoire.',
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

            // Ensure membership_id exists: default to the invoice's current membership when not provided
            if (empty($validated['membership_id'])) {
                $validated['membership_id'] = $invoice->membership_id;
            }

            // Fetch the membership (including deleted ones)
            $membership = Membership::withTrashed()->findOrFail($validated['membership_id']);

            // Pré-vérifications bloquantes pour éviter des factures invalides
            if (!$membership->offer) {
                throw new \Exception('Offre introuvable pour cette adhésion. Veuillez vérifier l\'offre.');
            }
            if (!is_array($membership->teachers) || count($membership->teachers) === 0) {
                throw new \Exception('Aucun enseignant n\'est associé à cette adhésion. Veuillez ajouter au moins un enseignant.');
            }
            if (!is_array($membership->offer->percentage)) {
                throw new \Exception('L\'offre sélectionnée n\'a pas de pourcentages valides.');
            }
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
            
            // Log warning if payment processing has issues but don't fail the update
            if (!$paymentResult || !$paymentResult['success'] || (($paymentResult['created_records'] ?? 0) + ($paymentResult['updated_records'] ?? 0)) === 0) {
                Log::error('Failed to process teacher payment records during invoice update', [
                    'invoice_id' => $invoice->id,
                    'errors' => $paymentResult['errors'] ?? ['Unknown error']
                ]);
                throw new \Exception('Failed to process teacher payment records during invoice update');
            }
            
            // NEW: Reconcile deltas whenever amountPaid changes (not only when fully paid)
            if (round((float)($validated['amountPaid']), 2) != round((float)($previousAmountPaid), 2)) {
                $reconcileResultAny = $paymentService->reconcilePaidMonthsForInvoice($invoice);
                if (!$reconcileResultAny['success']) {
                    Log::warning('Reconciliation (any change) reported issues', [
                        'invoice_id' => $invoice->id,
                        'errors' => $reconcileResultAny['errors']
                    ]);
                } else {
                    Log::info('Reconciled teacher payouts after amount change', [
                        'invoice_id' => $invoice->id,
                        'adjusted_records' => $reconcileResultAny['adjusted_records'],
                        'total_delta' => $reconcileResultAny['total_delta']
                    ]);
                }
            }

            // If invoice is fully paid, reactivate any inactive payment records
            if ($invoice->amountPaid >= $invoice->totalAmount) {
                $reactivationResult = $paymentService->reactivatePaymentRecords($invoice);
                if ($reactivationResult['success'] && $reactivationResult['reactivated_records'] > 0) {
                    Log::info('Reactivated payment records for fully paid invoice', [
                        'invoice_id' => $invoice->id,
                        'reactivated_count' => $reactivationResult['reactivated_records']
                    ]);
                }

                // Keep reconciliation for fully paid case as well (already handled above if amount changed)
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
            return redirect()->back()->with('success', 'Facture mise à jour avec succès.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating invoice:', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            
            // NEW: Return proper error response
            if (request()->expectsJson() || request()->header('Accept') === 'application/json') {
                return $this->createErrorResponse([$e->getMessage()], [
                    'invoice_id' => $id,
                    'invoice_data' => $request->except(['_token', '_method']),
                    'validation_data' => $validated ?? []
                ]);
            }
            
            return redirect()->back()->withErrors([
                'error' => $this->convertSingleError($e->getMessage()) ?: 'Mise à jour de facture annulée: ' . $e->getMessage()
            ])->withInput();
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
     * NEW METHOD: Validate and fix invoice payment states
     * Use this to diagnose and fix payment issues like invoice #837
     */
    public function validateInvoice($id)
    {
        try {
            $invoice = Invoice::findOrFail($id);
            $paymentService = new \App\Services\TeacherMembershipPaymentService();
            
            // Run comprehensive validation
            $validationResult = $paymentService->validateInvoicePaymentState($invoice);
            
            // Run reconciliation to fix any issues
            $reconcileResult = $paymentService->reconcilePaidMonthsForInvoice($invoice);
            
            $data = [
                'invoice' => $invoice,
                'validation' => $validationResult,
                'reconciliation' => $reconcileResult,
                'summary' => [
                    'invoice_total' => $invoice->totalAmount,
                    'amount_paid' => $invoice->amountPaid,
                    'payment_percentage' => round(($invoice->amountPaid / $invoice->totalAmount) * 100, 2),
                    'bill_date' => $invoice->billDate,
                    'selected_months' => $invoice->selected_months,
                ]
            ];
            
            Log::info('Invoice validation completed', [
                'invoice_id' => $invoice->id,
                'validation_valid' => $validationResult['valid'],
                'validation_errors' => $validationResult['errors'],
                'validation_warnings' => $validationResult['warnings'],
                'reconciliation_success' => $reconcileResult['success'],
                'reconciliation_adjusted_records' => $reconcileResult['adjusted_records']
            ]);
            
            return response()->json($data);
            
        } catch (\Exception $e) {
            Log::error('Error validating invoice', [
                'invoice_id' => $id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'error' => 'Failed to validate invoice: ' . $e->getMessage()
            ], 500);
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

    /**
     * Convert technical validation errors to user-friendly messages
     */
    private function convertToUserFriendlyErrors(array $technicalErrors): array
    {
        $userFriendlyMessages = [];
        
        foreach ($technicalErrors as $error) {
            $message = $this->convertSingleError($error);
            if ($message) {
                $userFriendlyMessages[] = $message;
            }
        }
        
        // If no specific conversion found, return generic message
        if (empty($userFriendlyMessages)) {
            $userFriendlyMessages[] = 'Une erreur s\'est produite lors de la création de la facture. Veuillez réessayer.';
        }
        
        return $userFriendlyMessages;
    }

    /**
     * Convert a single technical error to user-friendly message
     */
    private function convertSingleError(string $error): ?string
    {
        // Map technical errors to user-friendly messages
        $errorMappings = [
            // Offer percentage errors
            'percentages don\'t sum to 100%' => 'La configuration des pourcentages enseignants n\'est pas complète. Veuillez vérifier les pourcentages dans l\'offre.',
            'percentages exceed 100%' => 'Les pourcentages enseignants dépassent 100%. Veuillez ajuster les pourcentages dans l\'offre.',
            'has invalid percentage configuration' => 'La configuration des pourcentages est invalide. Contactez l\'administrateur.',
            'has no teachers assigned' => 'Aucun enseignant n\'est assigné à cette adhésion. Veuillez sélectionner des enseignants.',
            'has no associated offer' => 'Aucune offre associée à cette adhésion. Veuillez sélectionner une offre valide.',
            
            // Membership errors
            'No membership or teachers found' => 'Impossible de créer la facture: aucune information d\'adhésion trouvée.',
            'has no teachers assigned' => 'Cette adhésion n\'a pas d\'enseignants assignés. Veuillez ajouter des enseignants.',
            
            // Data validation errors
            'Math validation failed' => 'Les montants ne sont pas cohérents. Vérifiez le montant total, payé et le reste.',
            'no selected months' => 'Aucun mois sélectionné pour cette facture. Veuillez sélectionner au moins un mois.',
            
            // Generic patterns
            'Offer' => 'Problème avec la configuration de l\'offre. Vérifiez les paramètres de l\'offre.',
            'Membership' => 'Problème avec la configuration de l\'adhésion. Vérifiez les paramètres de l\'adhésion.',
            'Teacher' => 'Problème avec la configuration des enseignants. Vérifiez les enseignants assignés.',
            'validation failed' => 'Les données saisies ne sont pas valides. Vérifiez tous les champs obligatoires.',
            'permission denied' => 'Vous n\'avez pas les permissions pour effectuer cette action.',
            'not found' => 'La ressource demandée est introuvable.',
        ];
        
        // Check for exact matches first
        foreach ($errorMappings as $technicalPattern => $userMessage) {
            if (strpos($error, $technicalPattern) !== false) {
                return $userMessage;
            }
        }
        
        // If no mapping found, return a default message
        return 'Erreur lors du traitement: ' . substr($error, 0, 100) . (strlen($error) > 100 ? '...' : '');
    }

    /**
     * Create detailed error response for frontend
     */
    private function createErrorResponse(array $errors, array $additionalData = [])
    {
        $userFriendlyErrors = $this->convertToUserFriendlyErrors($errors);
        
        return response()->json([
            'success' => false,
            'message' => 'Erreur lors de la création de la facture',
            'errors' => $userFriendlyErrors,
            'technical_errors' => $errors, // Keep technical errors for debugging
            'data' => $additionalData,
            'suggestions' => $this->getErrorSuggestions($errors)
        ], 422);
    }

    /**
     * Get helpful suggestions based on errors
     */
    private function getErrorSuggestions(array $errors): array
    {
        $suggestions = [];
        
        foreach ($errors as $error) {
            if (strpos($error, 'percentages') !== false) {
                $suggestions[] = 'Allez dans Gestion des Offres pour vérifier les pourcentages enseignants';
            } elseif (strpos($error, 'teachers') !== false) {
                $suggestions[] = 'Ajoutez des enseignants à cette adhésion dans la configuration';
            } elseif (strpos($error, 'offer') !== false) {
                $suggestions[] = 'Vérifiez que l\'offre est correctement configurée';
            } elseif (strpos($error, 'validation failed') !== false) {
                $suggestions[] = 'Vérifiez que tous les champs obligatoires sont remplis';
            }
        }
        
        return array_unique($suggestions);
    }
}