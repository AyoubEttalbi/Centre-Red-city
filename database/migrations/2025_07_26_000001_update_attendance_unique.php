<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->unique(['student_id', 'classId', 'teacher_id', 'subject', 'date'], 'attendances_unique_full');
        });
    }

    public function down()
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropUnique('attendances_unique_full');

                    });
    }
};
