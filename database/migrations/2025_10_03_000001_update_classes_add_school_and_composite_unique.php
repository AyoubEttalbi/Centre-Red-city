<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            // Drop global unique on name if it exists
            try {
                $table->dropUnique(['name']);
            } catch (\Throwable $e) {
                // Fallback for named index in some DBs
                try {
                    $table->dropUnique('classes_name_unique');
                } catch (\Throwable $e2) {
                    // Ignore if already dropped
                }
            }

            // Add school_id (nullable to avoid breaking existing rows)
            if (!Schema::hasColumn('classes', 'school_id')) {
                $table->foreignId('school_id')->nullable()->constrained()->nullOnDelete();
            }
        });

        Schema::table('classes', function (Blueprint $table) {
            // Add composite unique on (name, school_id)
            $table->unique(['name', 'school_id']);
        });
    }

    public function down(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            // Drop composite unique
            try {
                $table->dropUnique(['name', 'school_id']);
            } catch (\Throwable $e) {
                try {
                    $table->dropUnique('classes_name_school_id_unique');
                } catch (\Throwable $e2) {
                    // Ignore if already dropped
                }
            }

            // Drop school_id foreign and column if exists
            if (Schema::hasColumn('classes', 'school_id')) {
                try {
                    $table->dropConstrainedForeignId('school_id');
                } catch (\Throwable $e) {
                    try {
                        $table->dropForeign(['school_id']);
                    } catch (\Throwable $e2) {
                        // ignore
                    }
                    $table->dropColumn('school_id');
                }
            }

            // Restore global unique on name
            $table->unique('name');
        });
    }
};


