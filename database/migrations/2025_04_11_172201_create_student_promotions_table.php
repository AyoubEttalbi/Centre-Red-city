<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('student_promotions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('class_id')->nullable();
            $table->unsignedBigInteger('level_id')->nullable();
            $table->integer('school_year');
            $table->boolean('is_promoted')->default(1); // Default to promoted
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->foreign('student_id')->references('id')->on('students');
            $table->foreign('class_id')->references('id')->on('classes');
            $table->foreign('level_id')->references('id')->on('levels');
            
            // Each student can only have one promotion record per school year
            $table->unique(['student_id', 'school_year']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_promotions');
    }
};
