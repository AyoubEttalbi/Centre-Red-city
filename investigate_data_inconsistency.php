// Investigate data inconsistency between student membership and teacher invoice views
use App\Models\Invoice;
use App\Models\Membership;
use App\Models\Teacher;
use App\Models\Offer;

// Get invoice 286
$invoice = Invoice::with(['membership.student', 'offer'])->find(286);
if (!$invoice) {
    echo "Invoice 286 not found\n";
    exit;
}

echo "=== INVESTIGATING DATA INCONSISTENCY FOR INVOICE 286 ===\n";
echo "Invoice ID: " . $invoice->id . "\n";
echo "Student: " . $invoice->membership->student->firstName . " " . $invoice->membership->student->lastName . "\n";

$membership = $invoice->membership;
$offer = $invoice->offer;

echo "\n=== MEMBERSHIP DATA ===\n";
echo "Membership ID: " . $membership->id . "\n";
echo "Membership Offer ID: " . $membership->offer_id . "\n";
echo "Membership Teachers: " . json_encode($membership->teachers) . "\n";

echo "\n=== INVOICE DATA ===\n";
echo "Invoice Offer ID: " . $invoice->offer_id . "\n";
echo "Invoice Amount Paid: " . $invoice->amountPaid . "\n";
echo "Invoice Partial Month Amount: " . $invoice->partialMonthAmount . "\n";

echo "\n=== OFFER DATA ===\n";
echo "Offer ID: " . $offer->id . "\n";
echo "Offer Name: " . $offer->name . "\n";
echo "Offer Percentage: " . json_encode($offer->percentage) . "\n";

echo "\n=== CHECKING FOR OFFER MISMATCH ===\n";
if ($membership->offer_id != $invoice->offer_id) {
    echo "⚠️  MISMATCH: Membership uses offer " . $membership->offer_id . " but invoice uses offer " . $invoice->offer_id . "\n";
    
    // Get the membership's offer
    $membershipOffer = Offer::find($membership->offer_id);
    if ($membershipOffer) {
        echo "Membership Offer Name: " . $membershipOffer->name . "\n";
        echo "Membership Offer Percentage: " . json_encode($membershipOffer->percentage) . "\n";
    }
} else {
    echo "✅ Offer IDs match: " . $membership->offer_id . "\n";
}

echo "\n=== CHECKING ALL OFFERS WITH MATH ===\n";
$offersWithMath = Offer::whereRaw("JSON_EXTRACT(percentage, '$.math') IS NOT NULL")->get();
echo "Found " . $offersWithMath->count() . " offers with 'math' subject:\n";
foreach ($offersWithMath as $offer) {
    echo "Offer ID: " . $offer->id . " - Name: " . $offer->name . " - Percentage: " . json_encode($offer->percentage) . "\n";
}

echo "\n=== CHECKING ALL OFFERS WITH ENG ===\n";
$offersWithEng = Offer::whereRaw("JSON_EXTRACT(percentage, '$.ENG') IS NOT NULL")->get();
echo "Found " . $offersWithEng->count() . " offers with 'ENG' subject:\n";
foreach ($offersWithEng as $offer) {
    echo "Offer ID: " . $offer->id . " - Name: " . $offer->name . " - Percentage: " . json_encode($offer->percentage) . "\n";
}

echo "\n=== TEACHER DETAILS ===\n";
foreach ($membership->teachers as $teacherData) {
    $teacher = Teacher::find($teacherData['teacherId']);
    if (!$teacher) continue;
    
    echo "Teacher " . $teacher->firstName . " " . $teacher->lastName . ":\n";
    echo "  Subject: " . $teacherData['subject'] . "\n";
    echo "  Amount: " . $teacherData['amount'] . " DH\n";
    echo "  Email: " . $teacher->email . "\n";
}

echo "\n=== RECOMMENDATION ===\n";
echo "Based on the student view showing 'Math + PC +SVT +FR', we need to:\n";
echo "1. Find the correct offer that has 'math' subject\n";
echo "2. Update either the membership or invoice to use the correct offer\n";
echo "3. Ensure the teacher subjects match the offer percentages\n";

