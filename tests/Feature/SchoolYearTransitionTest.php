<?php

use App\Models\Assistant;
use App\Models\Classes;
use App\Models\Level;
use App\Models\Membership;
use App\Models\Offer;
use App\Models\School;
use App\Models\SchoolYear;
use App\Models\Student;
use App\Models\StudentMovement;
use App\Models\Teacher;
use App\Models\TeacherMembershipPayment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

// Helper to create an admin user
function createAdminUser(array $overrides = []): User
{
    return User::factory()->create(array_merge([
        'role' => 'admin',
    ], $overrides));
}

test('guard blocks transition when no active students', function () {
    $admin = createAdminUser();

    // Ensure no active students exist (RefreshDatabase starts empty, but create one inactive)
    $level = Level::factory()->create();
    $school = School::factory()->create();
    $class = Classes::factory()->create(['level_id' => $level->id, 'school_id' => $school->id]);
    Student::factory()->create([
        'levelId' => $level->id,
        'classId' => $class->id,
        'schoolId' => $school->id,
        'status' => 'inactive',
    ]);

    $response = $this->actingAs($admin)->post(route('schoolyear.transition'));

    $response->assertRedirect();
    $response->assertSessionHas('error', 'Aucun élève actif — la transition a déjà été effectuée pour cette année.');
    expect(SchoolYear::count())->toBe(0);
});

test('transition success resets students levels classes snapshots pivot teachers memberships payments school_year and movements carry old class level', function () {
    $admin = createAdminUser();
    $transitionYear = Carbon::now()->year;
    $now = Carbon::now();
    $m = (int) $now->format('n'); $y = (int) $now->format('Y');
    $expectedLabel = $m >= 9 && $m <= 12 ? "$y/".($y+1) : ($y-1)."/$y";

    $level = Level::factory()->create(['name' => 'Niveau Test']);
    $school = School::factory()->create();
    $class = Classes::factory()->create([
        'level_id' => $level->id,
        'school_id' => $school->id,
        'number_of_students' => 2,
        'number_of_teachers' => 1,
    ]);

    // Two active students with known level/class
    $student1 = Student::factory()->create([
        'levelId' => $level->id,
        'classId' => $class->id,
        'schoolId' => $school->id,
        'status' => 'active',
        'firstName' => 'Ali',
        'lastName' => 'Ben',
        'billingDate' => Carbon::now()->subMonths(2)->toDateString(),
        'assurance' => 1,
        'assuranceAmount' => 150,
    ]);
    $student2 = Student::factory()->create([
        'levelId' => $level->id,
        'classId' => $class->id,
        'schoolId' => $school->id,
        'status' => 'active',
        'firstName' => 'Sara',
        'lastName' => 'Ahmed',
        'billingDate' => Carbon::now()->subMonths(1)->toDateString(),
        'assurance' => 0,
    ]);

    // Seeded INACTIVE student — must remain untouched (locked decision 1+2)
    $inactiveLevel = Level::factory()->create(['name' => 'Niveau Inactive']);
    $inactiveClass = Classes::factory()->create(['level_id' => $inactiveLevel->id, 'school_id' => $school->id]);
    $inactiveStudent = Student::factory()->create([
        'levelId' => $inactiveLevel->id,
        'classId' => $inactiveClass->id,
        'schoolId' => $school->id,
        'status' => 'inactive',
    ]);

    // Pre-set is_promoted for student1 — must survive upsert (notes NOT in update list)
    DB::table('student_promotions')->insert([
        'student_id' => $student1->id,
        'school_year' => $transitionYear,
        'class_id' => $class->id,
        'level_id' => $level->id,
        'year_label' => 'OLD_LABEL_SHOULD_STAY',
        'is_promoted' => 0,
        'notes' => 'keep me',
        'created_at' => $now->copy()->subDay(),
        'updated_at' => $now->copy()->subDay(),
    ]);

    // Teacher active with pivot
    $teacher = Teacher::factory()->create(['status' => 'active']);
    DB::table('classes_teacher')->insert([
        'teacher_id' => $teacher->id,
        'classes_id' => $class->id,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    // Refresh counter to known value (controller will reset to 0)
    $class->update(['number_of_teachers' => 1]);

    // Active assistant (model lacks HasFactory)
    $assistant = Assistant::create([
        'first_name' => 'Assist',
        'last_name' => 'Test',
        'email' => 'assistant.test.' . uniqid() . '@example.com',
        'status' => 'active',
        'salary' => 3000,
    ]);

    // Offer for membership
    $offer = Offer::factory()->create(['levelId' => $level->id]);

    // Active memberships (is_active true, not soft-deleted, end_date in future)
    $membership1 = Membership::factory()->create([
        'student_id' => $student1->id,
        'offer_id' => $offer->id,
        'teachers' => [['teacherId' => $teacher->id, 'subject' => 'Math', 'amount' => 200]],
        'is_active' => true,
        'payment_status' => 'paid',
        'start_date' => Carbon::now()->subMonths(1)->toDateString(),
        'end_date' => Carbon::now()->addMonths(2)->toDateString(),
    ]);
    $membership2 = Membership::factory()->create([
        'student_id' => $student2->id,
        'offer_id' => $offer->id,
        'teachers' => [['teacherId' => $teacher->id, 'subject' => 'Math', 'amount' => 200]],
        'is_active' => true,
        'payment_status' => 'paid',
        'start_date' => Carbon::now()->subMonths(1)->toDateString(),
        'end_date' => null,
    ]);

    // Teacher membership payments active
    TeacherMembershipPayment::create([
        'student_id' => $student1->id,
        'teacher_id' => $teacher->id,
        'membership_id' => $membership1->id,
        'invoice_id' => null,
        'selected_months' => [Carbon::now()->format('Y-m')],
        'months_rest_not_paid_yet' => [],
        'total_teacher_amount' => 200,
        'monthly_teacher_amount' => 100,
        'payment_percentage' => 100,
        'teacher_subject' => 'Math',
        'teacher_percentage' => 20,
        'is_active' => true,
    ]);
    TeacherMembershipPayment::create([
        'student_id' => $student2->id,
        'teacher_id' => $teacher->id,
        'membership_id' => $membership2->id,
        'invoice_id' => null,
        'selected_months' => [Carbon::now()->format('Y-m')],
        'months_rest_not_paid_yet' => [],
        'total_teacher_amount' => 200,
        'monthly_teacher_amount' => 100,
        'payment_percentage' => 100,
        'teacher_subject' => 'Math',
        'teacher_percentage' => 20,
        'is_active' => true,
    ]);

    // Ensure pre-state
    expect(DB::table('classes_teacher')->count())->toBe(1);
    expect(Membership::whereNull('deleted_at')->count())->toBe(2);
    expect(TeacherMembershipPayment::where('is_active', true)->count())->toBe(2);
    expect(SchoolYear::count())->toBe(0);

    $response = $this->actingAs($admin)->post(route('schoolyear.transition'));

    $response->assertRedirect();
    $response->assertSessionHas('success');

    // 1. Students levelId + classId nulled and status inactive
    $student1->refresh();
    $student2->refresh();
    expect($student1->levelId)->toBeNull();
    expect($student1->classId)->toBeNull();
    expect($student1->status)->toBe('inactive');
    expect($student2->levelId)->toBeNull();
    expect($student2->classId)->toBeNull();
    expect($student2->status)->toBe('inactive');

    // 2. Snapshot rows written to student_promotions with OLD values
    $promo1 = DB::table('student_promotions')->where('student_id', $student1->id)->where('school_year', $transitionYear)->first();
    $promo2 = DB::table('student_promotions')->where('student_id', $student2->id)->where('school_year', $transitionYear)->first();
    expect($promo1)->not->toBeNull();
    expect($promo2)->not->toBeNull();
    expect((int) $promo1->level_id)->toBe($level->id);
    expect((int) $promo1->class_id)->toBe($class->id);
    expect((int) $promo2->level_id)->toBe($level->id);
    expect((int) $promo2->class_id)->toBe($class->id);

    // 3. classes_teacher emptied (DML delete, rollback-safe)
    expect(DB::table('classes_teacher')->count())->toBe(0);

    // 4. number_of_teachers reset to 0 (F) and number_of_students reset to 0
    $class->refresh();
    expect((int) $class->number_of_teachers)->toBe(0);
    expect((int) $class->number_of_students)->toBe(0);

    // 5. Memberships soft-deleted and is_active false
    $membership1->refresh();
    $membership2->refresh();
    // withTrashed to check deleted_at
    $m1Trashed = Membership::withTrashed()->find($membership1->id);
    $m2Trashed = Membership::withTrashed()->find($membership2->id);
    expect($m1Trashed->deleted_at)->not->toBeNull();
    expect($m2Trashed->deleted_at)->not->toBeNull();
    expect((int) $m1Trashed->is_active)->toBe(0);
    expect((int) $m2Trashed->is_active)->toBe(0);

    // 6. Teacher membership payments deactivated
    expect(TeacherMembershipPayment::where('is_active', true)->count())->toBe(0);
    expect(TeacherMembershipPayment::where('is_active', false)->count())->toBe(2);

    // 7. SchoolYear row created with correct year, year_label and without graduated_students
    expect(SchoolYear::count())->toBe(1);
    $sy = SchoolYear::first();
    expect((int) $sy->year)->toBe($transitionYear);
    // Compute expected label like SchoolYearController::academicYearLabel
    $now = Carbon::now();
    $m = (int) $now->format('n'); $y = (int) $now->format('Y');
    $expectedLabel = $m >= 9 && $m <= 12 ? "$y/".($y+1) : ($y-1)."/$y";
    expect($sy->name)->toBe("Année scolaire {$expectedLabel}");
    expect($sy->year_label)->toBe($expectedLabel);
    $stats = is_string($sy->statistics) ? json_decode($sy->statistics, true) : $sy->statistics;
    expect($stats)->toHaveKey('active_students');
    expect($stats)->not->toHaveKey('graduated_students');
    expect($stats['active_students'])->toBe(2);

    // 8. Teacher and assistant set to inactive
    $teacher->refresh();
    expect($teacher->status)->toBe('inactive');
    $assistant->refresh();
    expect($assistant->status)->toBe('inactive');

    // 2b. Snapshot rows carry year_label
    expect($promo1->year_label)->toBe($expectedLabel);
    expect($promo2->year_label)->toBe($expectedLabel);

    // 9. Movements carry OLD class_id/level_id, not null, with correct reason (label)
    $mov1 = StudentMovement::where('student_id', $student1->id)->where('movement_type', 'abandoned')->orderByDesc('id')->first();
    $mov2 = StudentMovement::where('student_id', $student2->id)->where('movement_type', 'abandoned')->orderByDesc('id')->first();
    expect($mov1)->not->toBeNull();
    expect($mov2)->not->toBeNull();
    expect((int) $mov1->class_id)->toBe($class->id);
    expect((int) $mov1->level_id)->toBe($level->id);
    expect((int) $mov2->class_id)->toBe($class->id);
    expect((int) $mov2->level_id)->toBe($level->id);
    expect($mov1->reason)->toBe("Année scolaire clôturée {$expectedLabel}");
    expect($mov1->notes)->toBe("Transition année scolaire {$expectedLabel}");

    // 10. Seeded INACTIVE student remains untouched (locked decision 1+2)
    $inactiveStudent->refresh();
    expect((int) $inactiveStudent->levelId)->toBe($inactiveLevel->id);
    expect((int) $inactiveStudent->classId)->toBe($inactiveClass->id);
    expect($inactiveStudent->status)->toBe('inactive');

    // 11. Pre-set is_promoted/notes preserved on conflict (upsert does NOT overwrite)
    expect((int) $promo1->is_promoted)->toBe(0);
    expect($promo1->notes)->toBe('keep me');

    // 12. Memberships have end_date set to now
    expect($m1Trashed->end_date)->not->toBeNull();
    expect($m2Trashed->end_date)->not->toBeNull();
});

test('rollback on exception leaves nothing mutated', function () {
    $admin = createAdminUser();
    $level = Level::factory()->create();
    $school = School::factory()->create();
    $class = Classes::factory()->create(['level_id' => $level->id, 'school_id' => $school->id, 'number_of_teachers' => 0]);
    $student = Student::factory()->create(['levelId' => $level->id, 'classId' => $class->id, 'schoolId' => $school->id, 'status' => 'active']);
    $teacher = Teacher::factory()->create(['status' => 'active']);
    DB::table('classes_teacher')->insert(['teacher_id' => $teacher->id, 'classes_id' => $class->id, 'created_at' => now(), 'updated_at' => now()]);
    // Ensure number_of_teachers reflects pivot (factory's saved hook resets it to 0)
    $class->update(['number_of_teachers' => DB::table('classes_teacher')->where('classes_id', $class->id)->count()]);
    $offer = Offer::factory()->create(['levelId' => $level->id]);
    $membership = Membership::factory()->create([
        'student_id' => $student->id,
        'offer_id' => $offer->id,
        'teachers' => [['teacherId' => $teacher->id, 'subject' => 'Math']],
        'payment_status' => 'paid',
        'is_active' => true,
        'end_date' => Carbon::now()->addMonth()->toDateString(),
    ]);
    TeacherMembershipPayment::create([
        'student_id' => $student->id,
        'teacher_id' => $teacher->id,
        'membership_id' => $membership->id,
        'invoice_id' => null,
        'selected_months' => [Carbon::now()->format('Y-m')],
        'months_rest_not_paid_yet' => [],
        'total_teacher_amount' => 100,
        'monthly_teacher_amount' => 100,
        'payment_percentage' => 100,
        'teacher_subject' => 'Math',
        'teacher_percentage' => 10,
        'is_active' => true,
    ]);

    $preSchoolYearCount = SchoolYear::count();
    $prePivotCount = DB::table('classes_teacher')->count();
    $prePromoCount = DB::table('student_promotions')->count();
    $preMovementCount = StudentMovement::count();

    // Force failure mid-transaction (hook after archiveSchoolYearData)
    $response = $this->actingAs($admin)->post(route('schoolyear.transition'), ['force_fail' => 1]);

    $response->assertRedirect();
    $response->assertSessionHas('error');

    // Nothing mutated — regression for old TRUNCATE orphan bug
    expect(SchoolYear::count())->toBe($preSchoolYearCount);
    expect(DB::table('classes_teacher')->count())->toBe($prePivotCount);
    expect(DB::table('student_promotions')->count())->toBe($prePromoCount);
    expect(StudentMovement::count())->toBe($preMovementCount);
    $student->refresh();
    expect($student->levelId)->toBe($level->id);
    expect($student->classId)->toBe($class->id);
    expect($student->status)->toBe('active');
    $membershipFresh = Membership::withTrashed()->find($membership->id);
    expect($membershipFresh->deleted_at)->toBeNull();
    expect(TeacherMembershipPayment::where('is_active', true)->count())->toBe(1);
    $class->refresh();
    expect((int) $class->number_of_teachers)->toBe(1);
});

test('promotionsHistory returned by StudentsController show', function () {
    $admin = createAdminUser();
    $level = Level::factory()->create(['name' => 'Niveau A']);
    $levelOld = Level::factory()->create(['name' => 'Niveau Old']);
    $school = School::factory()->create();
    $class = Classes::factory()->create(['level_id' => $level->id, 'school_id' => $school->id]);
    $classOld = Classes::factory()->create(['level_id' => $levelOld->id, 'school_id' => $school->id, 'name' => 'Classe Old X']);
    $student = Student::factory()->create([
        'levelId' => $level->id,
        'classId' => $class->id,
        'schoolId' => $school->id,
        'status' => 'active',
    ]);

    // Create two year snapshots manually
    DB::table('student_promotions')->insert([
        [
            'student_id' => $student->id,
            'class_id' => $classOld->id,
            'level_id' => $levelOld->id,
            'school_year' => 2023,
            'is_promoted' => 1,
            'notes' => 'Note 2023',
            'created_at' => Carbon::create(2023, 6, 15),
            'updated_at' => Carbon::create(2023, 6, 15),
        ],
        [
            'student_id' => $student->id,
            'class_id' => $class->id,
            'level_id' => $level->id,
            'school_year' => 2024,
            'is_promoted' => 1,
            'notes' => null,
            'created_at' => Carbon::create(2024, 6, 15),
            'updated_at' => Carbon::create(2024, 6, 15),
        ],
    ]);

    $response = $this->actingAs($admin)->get(route('students.show', $student->id));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Menu/SingleStudentPage')
        ->has('promotionsHistory', 2)
        ->where('promotionsHistory.0.school_year', 2024) // desc order
        ->where('promotionsHistory.0.level_name', $level->name)
        ->where('promotionsHistory.0.class_name', $class->name)
        ->where('promotionsHistory.1.school_year', 2023)
        ->where('promotionsHistory.1.level_name', $levelOld->name)
        ->where('promotionsHistory.1.class_name', 'Classe Old X')
        ->has('promotionsHistory.0.created_at')
        ->has('promotionsHistory.0.updated_at')
    );
});

test('query count invariant for 1000 students stays constant (batch)', function () {
    $admin = createAdminUser();
    $level = Level::factory()->create();
    $school = School::factory()->create();
    $class = Classes::factory()->create(['level_id' => $level->id, 'school_id' => $school->id]);

    // Seed 1000 active students
    Student::factory()->count(1000)->create([
        'levelId' => $level->id,
        'classId' => $class->id,
        'schoolId' => $school->id,
        'status' => 'active',
    ]);

    // Create minimal supporting data for other steps
    $teacher = Teacher::factory()->create(['status' => 'active']);
    DB::table('classes_teacher')->insert(['teacher_id' => $teacher->id, 'classes_id' => $class->id, 'created_at' => now(), 'updated_at' => now()]);
    $offer = Offer::factory()->create(['levelId' => $level->id]);
    // A few memberships/payments to ensure those bulk paths are exercised but not dominate
    $sampleStudents = Student::where('status','active')->limit(5)->get();
    foreach ($sampleStudents as $s) {
        $m = Membership::factory()->create([
            'student_id' => $s->id,
            'offer_id' => $offer->id,
            'teachers' => [['teacherId' => $teacher->id, 'subject' => 'Math']],
            'payment_status' => 'paid',
            'is_active' => true,
            'end_date' => Carbon::now()->addMonth()->toDateString(),
        ]);
        TeacherMembershipPayment::create([
            'student_id' => $s->id,
            'teacher_id' => $teacher->id,
            'membership_id' => $m->id,
            'invoice_id' => null,
            'selected_months' => [Carbon::now()->format('Y-m')],
            'months_rest_not_paid_yet' => [],
            'total_teacher_amount' => 100,
            'monthly_teacher_amount' => 100,
            'payment_percentage' => 100,
            'teacher_subject' => 'Math',
            'teacher_percentage' => 10,
            'is_active' => true,
        ]);
    }

    DB::enableQueryLog();
    $resp = $this->actingAs($admin)->post(route('schoolyear.transition'));
    $resp->assertRedirect();
    $resp->assertSessionHas('success');
    $raw1000 = DB::getQueryLog();
    // Filter out middleware/redirect noise (announcements, users) to count only transition work
    $filtered1000 = array_filter($raw1000, fn($q) => !str_contains($q['query'], 'announcements') && !str_contains($q['query'], '`users`'));
    $count1000 = count($filtered1000);
    DB::flushQueryLog();
    DB::disableQueryLog();
    expect($count1000)->toBeLessThan(60);

    // Small run: reactivate 10 students + new transition (should stay in same band)
    // After first run all 1000 are inactive, so create 10 new active
    Student::factory()->count(10)->create([
        'levelId' => $level->id,
        'classId' => $class->id,
        'schoolId' => $school->id,
        'status' => 'active',
    ]);

    DB::enableQueryLog();
    $resp2 = $this->actingAs($admin)->post(route('schoolyear.transition'));
    $resp2->assertRedirect();
    $resp2->assertSessionHas('success');
    $raw10 = DB::getQueryLog();
    $filtered10 = array_filter($raw10, fn($q) => !str_contains($q['query'], 'announcements') && !str_contains($q['query'], '`users`'));
    $count10 = count($filtered10);
    DB::flushQueryLog();
    DB::disableQueryLog();
    expect($count10)->toBeLessThan(60);
    expect(abs($count1000 - $count10))->toBeLessThan(30);
});
