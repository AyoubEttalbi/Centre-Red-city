<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('attendances', function (Blueprint $table) {
            if (Schema::hasColumn('attendances', 'teacher_name')) {
                $table->dropColumn('teacher_name');
            }
            if (!Schema::hasColumn('attendances', 'teacher_id')) {
                $table->unsignedBigInteger('teacher_id')->nullable()->after('recorded_by');
            }
            if (!Schema::hasColumn('attendances', 'subject')) {
                $table->string('subject')->nullable()->after('teacher_id');
            }
        });
    }

    public function down()
    {
        Schema::table('attendances', function (Blueprint $table) {
            if (Schema::hasColumn('attendances', 'teacher_id')) {
                $table->dropColumn('teacher_id');
            }
            if (Schema::hasColumn('attendances', 'subject')) {
                $table->dropColumn('subject');
            }
            // Optionally re-add teacher_name if needed
            // $table->string('teacher_name')->nullable()->after('recorded_by');
        });
    }
};
