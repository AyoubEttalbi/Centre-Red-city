<?php

namespace App\Http\Controllers;

use App\Models\Offer;
use App\Http\Requests\StoreOfferRequest;
use App\Http\Requests\UpdateOfferRequest;
use Inertia\Inertia;
use App\Models\Level;
use App\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
class OfferController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
{
    $query = Offer::query();
    $levels = Level::all();
    $subjects = Subject::all();
    
    // Apply search filter if search term is provided
    if ($request->has('search') && !empty($request->search)) {
        $searchTerm = strtolower($request->search); // Convert search term to lowercase

        $query->where(function ($q) use ($searchTerm) {
            // Search by offer name (case-insensitive)
            $q->whereRaw('LOWER(offer_name) LIKE ?', ["%{$searchTerm}%"])
              ->orWhereRaw('LOWER(price) LIKE ?', ["%{$searchTerm}%"])
              ->orWhereRaw('LOWER(subjects) LIKE ?', ["%{$searchTerm}%"]);

            // Search by level name (case-insensitive)
            $q->orWhereHas('level', function ($levelQuery) use ($searchTerm) {
                $levelQuery->whereRaw('LOWER(name) LIKE ?', ["%{$searchTerm}%"]);
            });
        });
    }

    // Apply subject filter if provided
    if ($request->has('subject') && !empty($request->subject)) {
        $subject = $request->subject;
        $query->whereJsonContains('subjects', $subject);
    }

    // Fetch paginated and filtered offers, newest first
    $offers = $query->orderBy('created_at', 'desc')->paginate(8)->withQueryString()->through(function ($offer) {
        return [
            'id' => $offer->id,
            'offer_name' => $offer->offer_name,
            'price' => $offer->price,
            'levelId' => $offer->levelId,
            'subjects' => $offer->subjects,
            'percentage' => $offer->percentage,
            'created_at' => $offer->created_at,
            'updated_at' => $offer->updated_at,
        ];
    });

    return Inertia::render('Menu/OffersPage', [
        'offers' => $offers,
        'Alllevels' => $levels,
        'Allsubjects' => $subjects,
        'search' => $request->search
    ]);
}
    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Validate request data
        $validatedData = $request->validate([
            'offer_name' => 'required|string|max:255|unique:offers,offer_name',
            'price' => 'required|numeric|min:0',
            'levelId' => 'required|exists:levels,id', // Use 'levelId' instead of 'level_id'
            'subjects' => 'required|array|min:1',
            'subjects.*' => 'string',
            'percentage' => 'required|array',
            'percentage.*' => 'numeric|min:0|max:100',
        ]);
    
        // Store the offer with subjects & percentages as JSON
        Offer::create([
            'offer_name' => $validatedData['offer_name'],
            'price' => $validatedData['price'],
            'levelId' => $validatedData['levelId'],
            'subjects' => $validatedData['subjects'],
            'percentage' => $validatedData['percentage'],
        ]);
    
        // Redirect with success message
        return redirect()->route('offers.index')->with('success', 'Offer created successfully.');
    }
    


    /**
     * Display the specified resource.
     */
    public function show(Offer $offer)
    {
        $levels = Level::all();
        $offer = Offer::with('level')->get();

    return Inertia::render('Menu/OffersPage', [
        'offer' => [
            'offer_name' => $offer->offer_name,
            'price' => $offer->price,
            'level_id' => $offer->level_id,
            'subjects' => $offer->subjects,
            'percentage' => $offer->percentage,
        ],
    ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Offer $offer)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Offer $offer)
{
    // Validate the request data
    $validatedData = $request->validate([
        'offer_name' => 'required|string|max:255|unique:offers,offer_name,' . $offer->id,
        'price' => 'required|numeric|min:0',
        'subjects' => 'required|array|min:1',
        'subjects.*' => 'string',
        'percentage' => 'required|array',
        'percentage.*' => 'numeric|min:0|max:100',
    ]);

    // Update the offer with the validated data
    $offer->update([
        'offer_name' => $validatedData['offer_name'],
        'price' => $validatedData['price'],
        'subjects' => $validatedData['subjects'],
        'percentage' => $validatedData['percentage'],
    ]);

    // Redirect with a success message
    return redirect()->route('offers.index')->with('success', 'Offer updated successfully.');
}

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Offer $offer)
    {
        $offer->delete();

        return redirect()->route('offers.index')->with('success', 'offer deleted successfully.');
    }
}
