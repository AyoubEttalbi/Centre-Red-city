<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Teacher;
use App\Models\Classes;
use App\Models\Level;
use App\Models\Membership;
use App\Models\SchoolYear;
use App\Models\Assistant;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SchoolYearController extends Controller
{
    /**
     * Moroccan school year label: Sept (9) – Jun (8)
     * month 9–12 → "{Y}/{Y+1}", month 1–8 → "{Y-1}/{Y}"
     */
    private function academicYearLabel($date): string
    {
        $d = Carbon::parse($date);
        $m = (int) $d->format('n');
        $y = (int) $d->format('Y');
        if ($m >= 9 && $m <= 12) {
            return $y . '/' . ($y + 1);
        }
        return ($y - 1) . '/' . $y;
    }

    /**
     * Handle the school year transition process
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function transition(Request $request)
    {
        try {
            // Calendar year of this transition execution — used consistently for
            // SchoolYear.year and student_promotions.school_year.
            // This is the calendar year, not the pedagogical 20XX/20XX+1 label (name/year_label holds label).
            $transitionYear = Carbon::now()->year;
            $transitionLabel = $this->academicYearLabel(Carbon::now());

            // Idempotency guard: Inertia redirect flow — do not abort(422)
            if (Student::where('status', 'active')->count() === 0) {
                return redirect()->back()->with('error', 'Aucun élève actif — la transition a déjà été effectuée pour cette année.');
            }

            DB::beginTransaction();

            // Create a record of the completed school year (snapshot BEFORE mutations)
            $archivedYear = $this->archiveSchoolYearData($transitionYear, $transitionLabel);

            // Hook for rollback regression test (testing only): when ?force_fail=1 the TRUNCATE vs delete bug would previously leave orphaned archive row
            if ($request->input('force_fail') && app()->environment('testing')) {
                throw new \Exception('Forced failure for rollback test');
            }

            // 1. Snapshot + reset student level/class assignments (levelId + classId -> null) + bulk movements
            $clearedCount = $this->resetStudentAssignments($transitionYear, $transitionLabel);

            // 2. Reset all teacher class assignments and remove from their profiles
            $teacherCount = $this->resetTeacherAssignments();

            // 3. Soft delete all current memberships (archive them)
            $membershipCount = $this->archiveMemberships();

            // 4. Deactivate teacher membership payments (is_active => false) for dashboard/stat correctness.
            $deactivatedPaymentCount = $this->deactivateTeacherPayments();

            // 5. Set all students to inactive — bulk (movements already inserted in step 1)
            $inactiveStudentCount = $this->setStudentsInactive();

            // 6. Set all teachers to inactive
            $inactiveTeacherCount = $this->setTeachersInactive();

            // 7. Set all assistants to inactive
            $inactiveAssistantCount = $this->setAssistantsInactive();

            DB::commit();

            $message = "Année scolaire {$transitionLabel} clôturée : "
                . "{$clearedCount} élèves réinitialisés (niveau et classe retirés), "
                . "{$teacherCount} affectations enseignants réinitialisées, "
                . "{$membershipCount} abonnements archivés, "
                . "{$deactivatedPaymentCount} paiements enseignants désactivés, "
                . "{$inactiveStudentCount} élèves passés en inactif, "
                . "{$inactiveTeacherCount} enseignants passés en inactif, "
                . "{$inactiveAssistantCount} assistants passés en inactif. "
                . "Toutes les données ont été conservées pour l'historique (promotions enregistrées en {$transitionYear}, label {$transitionLabel}).";

            return redirect()->back()->with('success', $message);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('School year transition failed: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);

            return redirect()->back()->with('error', 'School year transition failed: ' . $e->getMessage());
        }
    }

    /**
     * Snapshot + reset student level/class assignments for the new school year (batched).
     * Chunked to keep query count independent of N. Upsert keeps admin is_promoted/notes on conflict.
     *
     * @param int $transitionYear Calendar year
     * @param string $transitionLabel Academic label e.g. "2025/2026"
     * @return int Number of students reset
     */
    private function resetStudentAssignments(int $transitionYear, string $transitionLabel): int
    {
        $recordedBy = Auth::id();
        $now = Carbon::now();
        $nowStr = $now->toDateTimeString();
        $nowDate = $now->toDateString();
        $monthYear = $now->format('Y-m');
        $clearedCount = 0;

        Student::where('status', 'active')
            ->select(['id', 'firstName', 'lastName', 'classId', 'levelId', 'schoolId', 'guardianName', 'guardianNumber', 'billingDate', 'assuranceAmount', 'assurance'])
            ->chunkById(500, function ($students) use ($transitionYear, $transitionLabel, $recordedBy, $now, $nowStr, $nowDate, $monthYear, &$clearedCount) {
                $promotionRows = [];
                $movementRows = [];
                foreach ($students as $s) {
                    $promotionRows[] = [
                        'student_id' => $s->id,
                        'school_year' => $transitionYear,
                        'class_id' => $s->classId,
                        'level_id' => $s->levelId,
                        'year_label' => $transitionLabel,
                        'is_promoted' => 1,
                        'notes' => null,
                        'created_at' => $nowStr,
                        'updated_at' => $nowStr,
                    ];
                    $movementRows[] = [
                        'student_id' => $s->id,
                        'movement_type' => 'abandoned',
                        'movement_date' => $nowDate,
                        'month_year' => $monthYear,
                        'school_id' => $s->schoolId,
                        'class_id' => $s->classId,
                        'level_id' => $s->levelId,
                        'student_first_name' => $s->firstName,
                        'student_last_name' => $s->lastName,
                        'student_full_name' => $s->firstName . ' ' . $s->lastName,
                        'guardian_name' => $s->guardianName,
                        'guardian_number' => $s->guardianNumber,
                        'reason' => "Année scolaire clôturée {$transitionLabel}",
                        'previous_status' => 'active',
                        'new_status' => 'inactive',
                        'billing_date' => $s->billingDate,
                        'assurance_amount' => $s->assuranceAmount,
                        'has_assurance' => (bool) $s->assurance,
                        'recorded_by' => $recordedBy,
                        'notes' => "Transition année scolaire {$transitionLabel}",
                        'created_at' => $nowStr,
                        'updated_at' => $nowStr,
                        'deleted_at' => null,
                    ];
                    $clearedCount++;
                }
                if (!empty($promotionRows)) {
                    DB::table('student_promotions')->upsert(
                        $promotionRows,
                        ['student_id', 'school_year'],
                        ['class_id', 'level_id', 'year_label', 'updated_at']
                    );
                }
                if (!empty($movementRows)) {
                    DB::table('student_movements')->insert($movementRows);
                }
            });

        if ($clearedCount > 0) {
            Student::where('status', 'active')->update(['classId' => null, 'levelId' => null]);
        }

        Log::info("School year transition: {$clearedCount} student assignments reset (level + class nulled) + movements inserted for year {$transitionYear}/{$transitionLabel}");

        return $clearedCount;
    }

    /**
     * Reset teacher class assignments for the new school year
     * 
     * @return int Number of teacher-class relationships reset
     */
    private function resetTeacherAssignments()
    {
        $pivotCount = DB::table('classes_teacher')->count();
        DB::table('classes_teacher')->delete();
        Classes::query()->update(['number_of_teachers' => 0]);
        Log::info("School year transition: {$pivotCount} teacher-class assignments reset, number_of_teachers=0 (subject_teacher preserved)");

        return $pivotCount;
    }

    /**
     * Archive (soft delete) current memberships — batched (2 bulk queries, no per-row logs)
     * 
     * @return int Number of memberships archived
     */
    private function archiveMemberships()
    {
        $now = Carbon::now()->toDateTimeString();
        $baseQuery = Membership::whereNull('deleted_at')
            ->where(function($query) {
                $query->whereNull('end_date')->orWhere('end_date', '>', now());
            });

        $ids = (clone $baseQuery)->pluck('id')->toArray();
        $count = count($ids);

        if ($count > 0) {
            // Two bulk queries on explicit IDs — safe, Membership::deleting hook is empty
            Membership::whereIn('id', $ids)->update(['end_date' => $now, 'is_active' => false]);
            Membership::whereIn('id', $ids)->update(['deleted_at' => $now]);
        }

        Classes::query()->update(['number_of_students' => 0]);

        Log::info("School year transition: {$count} memberships archived, number_of_students=0");

        return $count;
    }

    /**
     * Archive completed school year data
     *
     * @param int|null $transitionYear Calendar year of transition (defaults to now()->year)
     * @param string|null $transitionLabel Academic label e.g. "2025/2026"
     * @return SchoolYear The archived school year record
     */
    private function archiveSchoolYearData(?int $transitionYear = null, ?string $transitionLabel = null)
    {
        $transitionYear = $transitionYear ?? Carbon::now()->year;
        $transitionLabel = $transitionLabel ?? $this->academicYearLabel(Carbon::now());
        $schoolYear = new SchoolYear();
        $schoolYear->year = $transitionYear;
        $schoolYear->year_label = $transitionLabel;
        $schoolYear->ended_at = Carbon::now();
        $schoolYear->name = 'Année scolaire ' . $transitionLabel;
        
        $statistics = [
            'active_students' => Student::where('status', 'active')->count(),
            'teachers' => Teacher::count(),
            'classes' => Classes::count(),
            'active_memberships' => Membership::whereNull('deleted_at')
                ->where(function($query) {
                    $query->whereNull('end_date')->orWhere('end_date', '>', now());
                })
                ->count(),
            'levels' => Level::count(),
        ];
        
        $statistics['students_per_level'] = $this->getStudentsPerLevel();
        $statistics['teachers_per_subject'] = $this->getTeachersPerSubject();
        $statistics['classes_per_level'] = $this->getClassesPerLevel();
        
        $schoolYear->statistics = json_encode($statistics);
        $schoolYear->save();
        
        Log::info("School year {$schoolYear->name} archived successfully with detailed statistics");
        
        return $schoolYear;
    }
    
    /**
     * Get count of students per level
     * 
     * @return array
     */
    private function getStudentsPerLevel()
    {
        $result = [];
        $levels = Level::all();
        
        foreach ($levels as $level) {
            $result[$level->id] = [
                'name' => $level->name,
                'count' => Student::where('levelId', $level->id)->where('status', 'active')->count()
            ];
        }
        
        return $result;
    }
    
    /**
     * Get count of teachers per subject
     * 
     * @return array
     */
    private function getTeachersPerSubject()
    {
        return DB::table('subject_teacher')
            ->select('subject_id', DB::raw('count(*) as teacher_count'))
            ->groupBy('subject_id')
            ->get()
            ->mapWithKeys(function ($item) {
                $subjectName = DB::table('subjects')->where('id', $item->subject_id)->value('name') ?? 'Unknown';
                return [$item->subject_id => [
                    'name' => $subjectName,
                    'count' => $item->teacher_count
                ]];
            })
            ->toArray();
    }
    
    /**
     * Get count of classes per level
     * 
     * @return array
     */
    private function getClassesPerLevel()
    {
        $result = [];
        $levels = Level::all();
        
        foreach ($levels as $level) {
            $result[$level->id] = [
                'name' => $level->name,
                'count' => Classes::where('level_id', $level->id)->count()
            ];
        }
        
        return $result;
    }
    
    /**
     * Set up initial student promotion records for the current school year
     * Process promotion data from the form
     * 
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function setupPromotions(Request $request)
    {
        try {
            Log::info('setupPromotions method called');
            
            if ($request->has('promotions')) {
                Log::info('Processing promotion data from form submission');
                $promotionsData = $request->input('promotions');
                $count = 0;
                
                foreach ($promotionsData as $promotion) {
                    if (!isset($promotion['student_id'])) {
                        continue;
                    }
                    
                    $studentId = $promotion['student_id'];
                    $isPromoted = isset($promotion['is_promoted']) ? (bool)$promotion['is_promoted'] : true;
                    $notes = $promotion['notes'] ?? '';
                    
                    $student = Student::find($studentId);
                    if (!$student) {
                        Log::warning("Student ID {$studentId} not found");
                        continue;
                    }
                    
                    Log::info("Processing student ID: {$student->id}, Name: {$student->firstName} {$student->lastName}, Promotion Status: " . ($isPromoted ? 'Promoted' : 'Not Promoted'));
                    
                    $label = $this->academicYearLabel(Carbon::now());
                    DB::table('student_promotions')
                        ->updateOrInsert(
                            [
                                'student_id' => $studentId,
                                'school_year' => Carbon::now()->year
                            ],
                            [
                                'class_id' => $student->classId,
                                'level_id' => $student->levelId,
                                'year_label' => $label,
                                'is_promoted' => $isPromoted ? 1 : 0,
                                'notes' => $notes,
                                'created_at' => now(),
                                'updated_at' => now()
                            ]
                        );
                    $count++;
                }
                
                Log::info("Processed promotion records for {$count} students");
                
                return redirect()->back()->with('success', "Successfully set up promotion records for {$count} students.");
            }
            
            $students = Student::where('status', 'active')->get();
            
            Log::info('Found ' . $students->count() . ' active students');
            
            $studentsWithPromotions = Student::with(['promotions' => function($query) {
                $query->where('school_year', Carbon::now()->year);
            }])->where('status', 'active')->get();
            
            $promotionData = [];
            foreach ($studentsWithPromotions as $student) {
                if ($student->promotions->isNotEmpty()) {
                    $promotionData[] = $student->promotions->first();
                }
            }
            
            return redirect()->back()->with([
                'success' => "Please set up promotion status for each student.",
                'promotionData' => $promotionData
            ]);
        } catch (\Exception $e) {
            Log::error('Setup promotions failed: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return redirect()->back()->with('error', 'Failed to set up promotion records: ' . $e->getMessage());
        }
    }
    
    /**
     * Update a student's promotion status
     * 
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function updatePromotion(Request $request)
    {
        try {
            $validated = $request->validate([
                'student_id' => 'required|integer|exists:students,id',
                'is_promoted' => 'required|boolean',
                'notes' => 'nullable|string|max:500'
            ]);
            
            $existing = DB::table('student_promotions')
                ->where('student_id', $validated['student_id'])
                ->where('school_year', Carbon::now()->year)
                ->first();
            $label = $existing->year_label ?? $this->academicYearLabel(Carbon::now());
            DB::table('student_promotions')
                ->updateOrInsert(
                    [
                        'student_id' => $validated['student_id'],
                        'school_year' => Carbon::now()->year
                    ],
                    [
                        'year_label' => $label,
                        'is_promoted' => $validated['is_promoted'],
                        'notes' => $validated['notes'] ?? '',
                        'updated_at' => now()
                    ]
                );
            
            $studentName = Student::find($validated['student_id'])->firstName . ' ' . Student::find($validated['student_id'])->lastName;
            $status = $validated['is_promoted'] ? 'promoted' : 'not promoted';
            
            return redirect()->back()->with('success', "Student {$studentName} marked as {$status}.");
        } catch (\Exception $e) {
            Log::error('Update promotion failed: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to update promotion status: ' . $e->getMessage());
        }
    }
    
    /**
     * Deactivate teacher membership payments for new-year stat correctness.
     *
     * @return int Number of payments deactivated
     */
    private function deactivateTeacherPayments(): int
    {
        $count = \App\Models\TeacherMembershipPayment::where('is_active', true)->count();
        \App\Models\TeacherMembershipPayment::where('is_active', true)->update(['is_active' => false]);
        Log::info("School year transition: {$count} teacher_membership_payments deactivated (is_active => false)");
        return $count;
    }

    /**
     * Set all students to inactive status — bulk (movements already inserted in resetStudentAssignments).
     *
     * @return int Number of students set to inactive
     */
    private function setStudentsInactive(): int
    {
        $count = Student::where('status', 'active')->count();
        if ($count > 0) {
            Student::where('status', 'active')->update(['status' => 'inactive']);
        }
        Log::info("School year transition: {$count} students set to inactive status");

        return $count;
    }
    
    /**
     * Set all teachers to inactive status — Teacher boot has created/updated/deleted hooks for number_of_teachers,
     * but we bulk-set number_of_teachers=0 in resetTeacherAssignments, so bulk update here is safe (no meaningful hook).
     * 
     * @return int Number of teachers set to inactive
     */
    private function setTeachersInactive()
    {
        $count = Teacher::where('status', 'active')->count();
        if ($count > 0) {
            Teacher::where('status', 'active')->update(['status' => 'inactive']);
        }
        Log::info("School year transition: {$count} teachers set to inactive status");
        
        return $count;
    }
    
    /**
     * Set all assistants to inactive status — Assistant has no boot hooks, bulk update is safe.
     * 
     * @return int Number of assistants set to inactive
     */
    private function setAssistantsInactive()
    {
        $count = Assistant::where('status', 'active')->count();
        if ($count > 0) {
            Assistant::where('status', 'active')->update(['status' => 'inactive']);
        }
        
        Log::info("School year transition: {$count} assistants set to inactive status");
        
        return $count;
    }
} 
