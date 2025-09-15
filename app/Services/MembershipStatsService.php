<?php

namespace App\Services;

use App\Models\Membership;
use App\Models\MembershipMonthlyStats;
use App\Models\School;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MembershipStatsService
{
    /**
     * Calculate and update membership stats for a specific month and school.
     */
    public function updateMonthlyStats($schoolId = null, $year = null, $month = null): MembershipMonthlyStats
    {
        $year = $year ?? now()->year;
        $month = $month ?? now()->month;
        
        // Calculate stats
        $stats = $this->calculateStats($schoolId, $year, $month);
        
        // Update or create record
        $monthlyStats = MembershipMonthlyStats::updateOrCreate(
            [
                'school_id' => $schoolId,
                'year' => $year,
                'month' => $month
            ],
            $stats
        );
        
        Log::info("Membership stats updated for {$month}/{$year}" . ($schoolId ? " (School: {$schoolId})" : " (All schools)"));
        
        return $monthlyStats;
    }

    /**
     * Calculate membership statistics for a specific month and school.
     */
    public function calculateStats($schoolId = null, $year = null, $month = null): array
    {
        $year = $year ?? now()->year;
        $month = $month ?? now()->month;
        
        // Debug logging
        Log::info("Calculating stats for {$month}/{$year}" . ($schoolId ? " (School: {$schoolId})" : " (All schools)"));
        
        // Base query for memberships
        $query = Membership::whereNull('deleted_at');
        
        // Filter by school if specified
        if ($schoolId && $schoolId !== 'all') {
            $query->whereHas('student', function($q) use ($schoolId) {
                $q->where('schoolId', $schoolId);
            });
        }
        
        // Filter by month and year - memberships that were active during this month
        $startOfMonth = Carbon::create($year, $month, 1)->startOfMonth();
        $endOfMonth = Carbon::create($year, $month, 1)->endOfMonth();
        
        Log::info("Filtering memberships between {$startOfMonth->format('Y-m-d')} and {$endOfMonth->format('Y-m-d')}");
        
        $query->where(function($q) use ($startOfMonth, $endOfMonth) {
            $q->where(function($subQ) use ($startOfMonth, $endOfMonth) {
                // Memberships that started before or during this month AND ended after or during this month
                $subQ->where('start_date', '<=', $endOfMonth)
                     ->where('end_date', '>=', $startOfMonth);
            });
            
            // OR memberships that were created during this month (for pending memberships without dates)
            $q->orWhere(function($subQ) use ($startOfMonth, $endOfMonth) {
                $subQ->whereNull('start_date')
                     ->whereNull('end_date')
                     ->whereBetween('created_at', [$startOfMonth, $endOfMonth]);
            });
        });
        
        // Get all memberships for the period
        $memberships = $query->get();
        
        Log::info("Found {$memberships->count()} memberships for {$month}/{$year}");
        
        // Initialize counters
        $totalMemberships = $memberships->count();
        $paidCount = 0;
        $unpaidCount = 0;
        $expiredCount = 0;
        $pendingCount = 0;
        
        // Count by status
        foreach ($memberships as $membership) {
            switch ($membership->payment_status) {
                case 'paid':
                    if ($membership->is_active) {
                        $paidCount++;
                    } else {
                        $expiredCount++;
                    }
                    break;
                case 'pending':
                    $pendingCount++;
                    break;
                case 'expired':
                    $expiredCount++;
                    break;
                default:
                    $unpaidCount++;
                    break;
            }
        }
        
        // Calculate total unpaid (includes expired, pending, and unpaid)
        $totalUnpaidCount = $unpaidCount + $expiredCount + $pendingCount;
        
        $result = [
            'total_memberships' => $totalMemberships,
            'paid_count' => $paidCount,
            'unpaid_count' => $totalUnpaidCount,
            'expired_count' => $expiredCount,
            'pending_count' => $pendingCount,
        ];
        
        Log::info("Calculated stats for {$month}/{$year}: " . json_encode($result));
        
        return $result;
    }

    /**
     * Get membership stats for a specific month and school.
     */
    public function getMonthlyStats($schoolId = null, $year = null, $month = null): ?MembershipMonthlyStats
    {
        $year = $year ?? now()->year;
        $month = $month ?? now()->month;
        
        return MembershipMonthlyStats::forSchool($schoolId)
            ->forPeriod($year, $month)
            ->first();
    }

    /**
     * Get or create membership stats for a specific month and school.
     */
    public function getOrCreateMonthlyStats($schoolId = null, $year = null, $month = null): MembershipMonthlyStats
    {
        $year = $year ?? now()->year;
        $month = $month ?? now()->month;
        
        // Debug logging
        Log::info("Getting or creating stats for {$month}/{$year}" . ($schoolId ? " (School: {$schoolId})" : " (All schools)"));
        
        // For dashboard requests, always calculate fresh stats to ensure accuracy
        // This ensures that month filtering works correctly
        Log::info("Calculating fresh stats for {$month}/{$year}");
        $stats = $this->updateMonthlyStats($schoolId, $year, $month);
        
        return $stats;
    }

    /**
     * Update stats for all schools for a specific month.
     */
    public function updateAllSchoolsStats($year = null, $month = null): array
    {
        $year = $year ?? now()->year;
        $month = $month ?? now()->month;
        
        $schools = School::all();
        $updatedStats = [];
        
        // Update stats for each school
        foreach ($schools as $school) {
            $updatedStats[] = $this->updateMonthlyStats($school->id, $year, $month);
        }
        
        // Update stats for all schools combined
        $updatedStats[] = $this->updateMonthlyStats(null, $year, $month);
        
        Log::info("Updated membership stats for all schools for {$month}/{$year}");
        
        return $updatedStats;
    }

    /**
     * Update stats for the current month.
     */
    public function updateCurrentMonthStats($schoolId = null): MembershipMonthlyStats
    {
        return $this->updateMonthlyStats($schoolId, now()->year, now()->month);
    }

    /**
     * Update stats for the previous month.
     */
    public function updatePreviousMonthStats($schoolId = null): MembershipMonthlyStats
    {
        $previousMonth = now()->subMonth();
        return $this->updateMonthlyStats($schoolId, $previousMonth->year, $previousMonth->month);
    }

    /**
     * Get historical stats for a school (last 12 months).
     */
    public function getHistoricalStats($schoolId = null, $months = 12): array
    {
        $stats = [];
        
        for ($i = 0; $i < $months; $i++) {
            $date = now()->subMonths($i);
            $year = $date->year;
            $month = $date->month;
            
            $monthStats = $this->getOrCreateMonthlyStats($schoolId, $year, $month);
            $stats[] = $monthStats;
        }
        
        return $stats;
    }

    /**
     * Recalculate all stats for a specific period.
     */
    public function recalculateAllStats($startYear = null, $endYear = null): array
    {
        $startYear = $startYear ?? now()->subYear()->year;
        $endYear = $endYear ?? now()->year;
        
        $updatedStats = [];
        
        for ($year = $startYear; $year <= $endYear; $year++) {
            for ($month = 1; $month <= 12; $month++) {
                // Skip future months
                if ($year > now()->year || ($year === now()->year && $month > now()->month)) {
                    continue;
                }
                
                $updatedStats[] = $this->updateAllSchoolsStats($year, $month);
            }
        }
        
        Log::info("Recalculated all membership stats from {$startYear} to {$endYear}");
        
        return $updatedStats;
    }

    /**
     * Clean up old stats (older than specified years).
     */
    public function cleanupOldStats($yearsToKeep = 2): int
    {
        $cutoffYear = now()->subYears($yearsToKeep)->year;
        
        // Delete old stats
        $deletedCount = MembershipMonthlyStats::where('year', '<', $cutoffYear)->delete();
        
        // Also clean up empty records (schools with 0 memberships)
        $emptyRecordsDeleted = MembershipMonthlyStats::where('total_memberships', 0)
            ->where('year', '<', now()->subMonths(6)->year) // Keep last 6 months of empty records
            ->delete();
        
        $totalDeleted = $deletedCount + $emptyRecordsDeleted;
        
        Log::info("Cleaned up {$totalDeleted} old membership stats records (older than {$cutoffYear} + empty records)");
        
        return $totalDeleted;
    }

    /**
     * Optimize table performance.
     */
    public function optimizeTable(): void
    {
        // This would run OPTIMIZE TABLE in MySQL
        DB::statement('OPTIMIZE TABLE membership_monthly_stats');
        Log::info('Optimized membership_monthly_stats table');
    }

    /**
     * Get performance metrics for the stats table.
     */
    public function getPerformanceMetrics(): array
    {
        $totalRecords = MembershipMonthlyStats::count();
        $totalSchools = MembershipMonthlyStats::distinct('school_id')->count();
        $totalMonths = MembershipMonthlyStats::distinct('year', 'month')->count();
        
        // Get table size info (MySQL specific)
        $tableSize = DB::select("
            SELECT 
                ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size_MB'
            FROM information_schema.tables 
            WHERE table_schema = DATABASE() 
            AND table_name = 'membership_monthly_stats'
        ");
        
        return [
            'total_records' => $totalRecords,
            'total_schools' => $totalSchools,
            'total_months' => $totalMonths,
            'table_size_mb' => $tableSize[0]->Size_MB ?? 0,
            'records_per_month' => $totalRecords / max($totalMonths, 1),
            'estimated_yearly_growth' => ($totalSchools * 12) // 12 months per school per year
        ];
    }
}


