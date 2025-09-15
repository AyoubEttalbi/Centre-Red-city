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
        // Drop the existing results table if it exists
        Schema::dropIfExists('results');

        // Create a new results table with simplified structure
        Schema::create('results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->foreignId('subject_id')->constrained('subjects')->onDelete('cascade');
            $table->foreignId('class_id')->constrained('classes')->onDelete('cascade');
            $table->string('grade1')->nullable();
            $table->string('grade2')->nullable();
            $table->string('grade3')->nullable();
            $table->string('final_grade')->nullable();
            $table->string('notes')->nullable();
            $table->date('exam_date')->nullable();
            $table->timestamps();
            
            // Add a unique constraint to prevent duplicate entries
            $table->unique(['student_id', 'subject_id', 'class_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('results');
    }
};
