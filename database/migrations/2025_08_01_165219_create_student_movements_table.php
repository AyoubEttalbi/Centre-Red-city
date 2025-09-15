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
        Schema::create('student_movements', function (Blueprint $table) {
            $table->id();
            
            // Basic movement info
            $table->unsignedBigInteger('student_id');
            $table->enum('movement_type', ['inscribed', 'abandoned']);
            $table->date('movement_date');
            $table->string('month_year', 7); // Format: YYYY-MM
            
            // School and class info
            $table->unsignedBigInteger('school_id')->nullable();
            $table->unsignedBigInteger('class_id')->nullable();
            $table->unsignedBigInteger('level_id')->nullable();
            
            // Student details at time of movement
            $table->string('student_first_name');
            $table->string('student_last_name');
            $table->string('student_full_name');
            $table->string('guardian_name')->nullable();
            $table->string('guardian_number')->nullable();
            
            // Movement details
            $table->text('reason')->nullable(); // For abandoned students
            $table->string('previous_status')->nullable(); // For abandoned students
            $table->string('new_status')->nullable();
            
            // Billing info (for inscribed students)
            $table->date('billing_date')->nullable();
            $table->decimal('assurance_amount', 10, 2)->nullable();
            $table->boolean('has_assurance')->default(false);
            
            // Tracking info
            $table->unsignedBigInteger('recorded_by')->nullable(); // User who recorded this movement
            $table->text('notes')->nullable();
            
            // Indexes for better performance
            $table->index(['month_year', 'school_id']);
            $table->index(['student_id', 'movement_date']);
            $table->index(['movement_type', 'month_year']);
            
            // Foreign key constraints
            $table->foreign('student_id')->references('id')->on('students')->onDelete('cascade');
            $table->foreign('school_id')->references('id')->on('schools')->onDelete('set null');
            $table->foreign('class_id')->references('id')->on('classes')->onDelete('set null');
            $table->foreign('level_id')->references('id')->on('levels')->onDelete('set null');
            $table->foreign('recorded_by')->references('id')->on('users')->onDelete('set null');
            
            $table->timestamps();
           
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_movements');
    }
};
