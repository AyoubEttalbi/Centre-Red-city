<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students');
            $table->unsignedBigInteger('classId');
            $table->date('date');
            $table->enum('status', ['present', 'absent','late']);
            $table->text('reason')->nullable();
            $table->foreignId('recorded_by')->constrained('users');
            $table->timestamps();
            
            // Add foreign key constraint for classId
            $table->foreign('classId')
                  ->references('id')
                  ->on('classes')
                  ->onDelete('cascade');
    
            // Composite unique constraint
            $table->unique(['student_id', 'classId', 'date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};