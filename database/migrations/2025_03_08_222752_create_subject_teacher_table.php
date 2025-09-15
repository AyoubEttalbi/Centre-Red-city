<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    // database/migrations/xxxx_xx_xx_xxxxxx_create_subject_teacher_table.php
public function up()
{
    Schema::create('subject_teacher', function (Blueprint $table) {
        $table->id();
        $table->foreignId('teacher_id')->constrained('teachers')->onDelete('cascade');
        $table->foreignId('subject_id')->constrained('subjects')->onDelete('cascade');
        $table->timestamps();
        $table->softDeletes();
    });
}

public function down()
{
    Schema::dropIfExists('subject_teacher');
}

};
