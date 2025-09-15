<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    // database/migrations/xxxx_xx_xx_xxxxxx_create_group_teacher_table.php
public function up()
{
    Schema::create('classes_teacher', function (Blueprint $table) {
        $table->id();
        $table->foreignId('teacher_id')->constrained('teachers')->onDelete('cascade');
        $table->foreignId('classes_id')->constrained('classes')->onDelete('cascade');
        $table->timestamps();
        $table->softDeletes();
    });
}

public function down()
{
    Schema::dropIfExists('classes_teacher');
}

};