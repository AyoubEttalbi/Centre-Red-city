<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Teacher;
use App\Models\Invoice;
use App\Models\Membership;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class FixTeacherWalletsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'teachers:fix-wallets {--month=2025-09 : The month to fix wallets for} {--dry-run : Show what would be changed without making changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix teacher wallet balances based on correct includePartialMonth logic for a specific month';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $month = $this->option('month');
        $dryRun = $this->option('dry-run');
        
        $this->info("=== Fixing Teacher Wallets for {$month} ===");
        
        if ($dryRun) {
            $this->warn("DRY RUN MODE - No changes will be made");
        }
        
        $this->newLine();
        
        // Get all teachers
        $teachers = Teacher::all();
        $totalCorrections = 0;
        $teachersFixed = 0;
        $corrections = [];
        
        foreach ($teachers as $teacher) {
            $this->info("Processing Teacher: {$teacher->first_name} {$teacher->last_name} (ID: {$teacher->id})");
            
            $originalWallet = $teacher->wallet;
            $this->line("  Original Wallet Balance: {$originalWallet} DH");
            
            // Calculate what the wallet SHOULD be based on correct logic for the specified month
            $expectedAmount = $this->calculateCorrectWalletAmount($teacher, $month);
            
            $this->line("  Expected Amount for {$month}: {$expectedAmount} DH");
            
            // Calculate the difference
            $difference = $expectedAmount - $originalWallet;
            
            if (abs($difference) > 0.01) { // Only update if there's a meaningful difference
                $this->line("  Difference: {$difference} DH");
                
                if (!$dryRun) {
                    // Start database transaction
                    DB::beginTransaction();
                    
                    try {
                        // Update the teacher's wallet
                        $teacher->wallet = $expectedAmount;
                        $teacher->save();
                        
                        // Create a transaction record to track this correction
                        $this->createCorrectionTransaction($teacher, $difference, $month);
                        
                        DB::commit();
                        
                        $this->info("  ✅ Updated wallet to: {$expectedAmount} DH");
                        $totalCorrections += $difference;
                        $teachersFixed++;
                        
                        $corrections[] = [
                            'teacher' => $teacher->first_name . ' ' . $teacher->last_name,
                            'original' => $originalWallet,
                            'expected' => $expectedAmount,
                            'difference' => $difference
                        ];
                        
                    } catch (\Exception $e) {
                        DB::rollback();
                        $this->error("  ❌ Failed to update wallet: " . $e->getMessage());
                    }
                } else {
                    $this->warn("  [DRY RUN] Would update wallet to: {$expectedAmount} DH");
                    $totalCorrections += $difference;
                    $teachersFixed++;
                }
            } else {
                $this->line("  No correction needed (difference: {$difference} DH)");
            }
            
            $this->newLine();
        }
        
        // Summary
        $this->info("=== Summary ===");
        $this->line("Teachers processed: " . $teachers->count());
        $this->line("Teachers fixed: {$teachersFixed}");
        $this->line("Total corrections: {$totalCorrections} DH");
        
        if ($dryRun) {
            $this->warn("DRY RUN - No actual changes were made");
        } else {
            $this->info("Fix completed successfully!");
            
            if (!empty($corrections)) {
                $this->newLine();
                $this->info("Detailed Corrections:");
                $this->table(
                    ['Teacher', 'Original', 'Expected', 'Difference'],
                    collect($corrections)->map(function($correction) {
                        return [
                            $correction['teacher'],
                            number_format($correction['original'], 2) . ' DH',
                            number_format($correction['expected'], 2) . ' DH',
                            number_format($correction['difference'], 2) . ' DH'
                        ];
                    })
                );
            }
        }
        
        return Command::SUCCESS;
    }
    
    /**
     * Calculate the correct wallet amount for a teacher for a specific month
     */
    private function calculateCorrectWalletAmount(Teacher $teacher, string $month): float
    {
        // Get memberships for this teacher
        $memberships = Membership::withTrashed()
            ->whereIn('payment_status', ['paid', 'pending'])
            ->whereJsonContains('teachers', [['teacherId' => (string) $teacher->id]])
            ->with(['invoices' => function($query) {
                $query->whereNull('deleted_at');
            }, 'student', 'offer'])
            ->get();

        $expectedAmount = 0;

        foreach ($memberships as $membership) {
            foreach ($membership->invoices as $invoice) {
                if (!is_array($membership->teachers)) continue;
                
                foreach ($membership->teachers as $teacherData) {
                    if ((string)$teacherData['teacherId'] !== (string) $teacher->id) continue;
                    
                    $offer = $invoice->offer;
                    $teacherSubject = $teacherData['subject'] ?? 'Unknown';
                    
                    if (!$offer || !$teacherSubject || !is_array($offer->percentage)) {
                        continue;
                    }
                    
                    $teacherPercentage = $offer->percentage[$teacherSubject] ?? 0;
                    $totalTeacherAmount = $invoice->amountPaid * ($teacherPercentage / 100);
                    
                    // Check if this invoice has includePartialMonth for the specified month
                    $includePartialMonth = $invoice->includePartialMonth ?? false;
                    $partialMonthAmount = $invoice->partialMonthAmount ?? 0;
                    
                    // Get selected months for this invoice (same logic as frontend)
                    $selectedMonths = $invoice->selected_months ?? [];
                    if (is_string($selectedMonths)) {
                        $selectedMonths = json_decode($selectedMonths, true) ?? [];
                    }
                    if (empty($selectedMonths)) {
                        // Fallback: if no selected_months, use the billDate month (same as frontend)
                        $selectedMonths = [$invoice->billDate ? $invoice->billDate->format('Y-m') : null];
                    }
                    
                    // Check if the target month is in selected_months (same logic as frontend)
                    $isTargetMonth = in_array($month, $selectedMonths);
                    
                    if ($isTargetMonth) {
                        $monthlyAmount = 0;
                        
                        if ($includePartialMonth && $partialMonthAmount > 0) {
                            // Use partial month amount
                            $monthlyAmount = $partialMonthAmount * ($teacherPercentage / 100);
                        } else {
                            // Use full amount
                            $monthlyAmount = $totalTeacherAmount;
                        }
                        
                        $expectedAmount += $monthlyAmount;
                    }
                }
            }
        }
        
        return round($expectedAmount, 2);
    }
    
    /**
     * Create a transaction record to track the correction
     */
    private function createCorrectionTransaction(Teacher $teacher, float $difference, string $month): void
    {
        // Find the teacher's user account
        $user = $teacher->user;
        if (!$user) {
            return;
        }
        
        // Create a transaction record for the correction
        Transaction::create([
            'user_id' => $user->id,
            'type' => 'wallet_correction',
            'amount' => abs($difference),
            'description' => "Wallet correction for {$month} - " . ($difference > 0 ? 'Added' : 'Deducted') . " " . abs($difference) . " DH",
            'payment_date' => now(),
            'status' => 'completed',
            'reference' => "WALLET_CORRECTION_{$month}_" . now()->format('YmdHis'),
            'metadata' => [
                'teacher_id' => $teacher->id,
                'teacher_name' => $teacher->first_name . ' ' . $teacher->last_name,
                'correction_month' => $month,
                'correction_type' => 'includePartialMonth_logic_fix',
                'difference' => $difference
            ]
        ]);
    }
}
