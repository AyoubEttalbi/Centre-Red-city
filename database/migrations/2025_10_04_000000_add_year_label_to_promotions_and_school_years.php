<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

return new class extends Migration
{
    /**
     * Moroccan school year: Sept (9) – Jun (8)
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

    public function up(): void
    {
        Schema::table('student_promotions', function (Blueprint $table) {
            $table->string('year_label')->nullable()->after('school_year');
        });

        Schema::table('school_years', function (Blueprint $table) {
            $table->string('year_label')->nullable()->after('year');
        });

        // Backfill existing rows from their updated_at month using same rule
        DB::table('student_promotions')->orderBy('id')->chunkById(500, function ($rows) {
            foreach ($rows as $row) {
                $label = $this->academicYearLabel($row->updated_at ?? $row->created_at ?? now());
                DB::table('student_promotions')->where('id', $row->id)->update(['year_label' => $label]);
            }
        });

        DB::table('school_years')->orderBy('id')->chunkById(500, function ($rows) {
            foreach ($rows as $row) {
                $src = $row->updated_at ?? $row->ended_at ?? $row->created_at ?? now();
                $label = $this->academicYearLabel($src);
                // name was previously "School Year {year}-{year+1}" — keep but also set label
                DB::table('school_years')->where('id', $row->id)->update(['year_label' => $label]);
            }
        });
    }

    public function down(): void
    {
        Schema::table('student_promotions', function (Blueprint $table) {
            $table->dropColumn('year_label');
        });
        Schema::table('school_years', function (Blueprint $table) {
            $table->dropColumn('year_label');
        });
    }
};
