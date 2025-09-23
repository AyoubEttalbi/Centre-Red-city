// Check for other invoices with offer mismatches
use App\Models\Invoice;
use App\Models\Membership;
use App\Models\Offer;

echo "=== CHECKING FOR OTHER INVOICES WITH OFFER MISMATCHES ===\n";

// Get all invoices with their memberships
$invoices = Invoice::with(['membership', 'offer'])->get();

$mismatches = [];
foreach ($invoices as $invoice) {
    if (!$invoice->membership) continue;
    
    if ($invoice->offer_id != $invoice->membership->offer_id) {
        $mismatches[] = [
            'invoice_id' => $invoice->id,
            'invoice_offer_id' => $invoice->offer_id,
            'membership_offer_id' => $invoice->membership->offer_id,
            'student_name' => $invoice->membership->student->firstName . ' ' . $invoice->membership->student->lastName,
            'created_at' => $invoice->created_at,
        ];
    }
}

echo "Found " . count($mismatches) . " invoices with offer mismatches:\n\n";

foreach ($mismatches as $mismatch) {
    echo "Invoice ID: " . $mismatch['invoice_id'] . "\n";
    echo "  Student: " . $mismatch['student_name'] . "\n";
    echo "  Invoice Offer ID: " . $mismatch['invoice_offer_id'] . "\n";
    echo "  Membership Offer ID: " . $mismatch['membership_offer_id'] . "\n";
    echo "  Created: " . $mismatch['created_at'] . "\n";
    
    // Get offer details
    $invoiceOffer = Offer::find($mismatch['invoice_offer_id']);
    $membershipOffer = Offer::find($mismatch['membership_offer_id']);
    
    if ($invoiceOffer) {
        echo "  Invoice Offer: " . json_encode($invoiceOffer->percentage) . "\n";
    }
    if ($membershipOffer) {
        echo "  Membership Offer: " . json_encode($membershipOffer->percentage) . "\n";
    }
    echo "\n";
}

if (count($mismatches) == 0) {
    echo "✅ No offer mismatches found! All invoices are correctly linked to their membership offers.\n";
}

echo "\n=== CHECKING FOR PATTERNS ===\n";
echo "Let's check if there are any invoices created around the same time as invoice 286...\n";

$invoice286 = Invoice::find(286);
if ($invoice286) {
    $startDate = $invoice286->created_at->subDays(1);
    $endDate = $invoice286->created_at->addDays(1);
    
    $nearbyInvoices = Invoice::whereBetween('created_at', [$startDate, $endDate])
        ->with(['membership', 'offer'])
        ->get();
    
    echo "Invoices created around invoice 286 (Sept 18, 2025):\n";
    foreach ($nearbyInvoices as $invoice) {
        if (!$invoice->membership) continue;
        
        $hasMismatch = $invoice->offer_id != $invoice->membership->offer_id;
        echo "Invoice " . $invoice->id . ": " . $invoice->membership->student->firstName . " " . $invoice->membership->student->lastName;
        echo " - Offer " . $invoice->offer_id . " vs Membership " . $invoice->membership->offer_id;
        echo $hasMismatch ? " ⚠️ MISMATCH" : " ✅ OK";
        echo "\n";
    }
}

