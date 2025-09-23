// Check Offer ID 2 details
use App\Models\Offer;

// Get offer 2
$offer = Offer::find(2);
if (!$offer) {
    echo "Offer 2 not found\n";
    exit;
}

echo "=== OFFER 2 DETAILS ===\n";
echo "Offer ID: " . $offer->id . "\n";
echo "Offer Name: " . $offer->name . "\n";
echo "Offer Percentage: " . json_encode($offer->percentage) . "\n";

// Also check if there are other offers that might be correct
echo "\n=== CHECKING OTHER OFFERS ===\n";
$allOffers = Offer::all();
foreach ($allOffers as $offerItem) {
    if (strpos($offerItem->name, 'Math') !== false || strpos($offerItem->name, 'math') !== false) {
        echo "Offer ID: " . $offerItem->id . " - Name: " . $offerItem->name . "\n";
        echo "Percentage: " . json_encode($offerItem->percentage) . "\n";
    }
}

echo "\n=== CHECKING INVOICE 286 MEMBERSHIP AGAIN ===\n";
$invoice = \App\Models\Invoice::find(286);
$membership = $invoice->membership;
echo "Membership Offer ID: " . $membership->offer_id . "\n";
echo "Membership Teachers: " . json_encode($membership->teachers) . "\n";

// Check if the membership is using the wrong offer
echo "\n=== CHECKING IF MEMBERSHIP HAS WRONG OFFER ===\n";
$correctOffer = Offer::where('name', 'like', '%Math%')->orWhere('name', 'like', '%math%')->first();
if ($correctOffer) {
    echo "Found correct offer: ID " . $correctOffer->id . " - " . $correctOffer->name . "\n";
    echo "Correct offer percentage: " . json_encode($correctOffer->percentage) . "\n";
    
    echo "\n=== CALCULATING WITH CORRECT OFFER ===\n";
    foreach ($membership->teachers as $teacherData) {
        $subject = $teacherData['subject'];
        $percentage = $correctOffer->percentage[$subject] ?? 0;
        $totalAmount = $invoice->amountPaid * ($percentage / 100);
        $immediateAmount = $invoice->partialMonthAmount * ($percentage / 100);
        
        echo "Teacher " . $teacherData['teacherId'] . " (" . $subject . "):\n";
        echo "  Percentage: " . $percentage . "%\n";
        echo "  Total Amount: " . $totalAmount . " DH\n";
        echo "  Immediate Amount: " . $immediateAmount . " DH\n";
    }
}

