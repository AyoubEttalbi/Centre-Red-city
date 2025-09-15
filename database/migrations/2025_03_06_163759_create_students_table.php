<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->string('firstName', 100); // Updated
            $table->string('lastName', 100); // Updated
            $table->date('dateOfBirth'); // Updated
            $table->date('billingDate'); // Updated
            $table->text('address')->nullable();
            $table->string('guardianNumber', 255)->nullable(); // Updated
            $table->string('CIN', 50)->unique()->nullable(); // Updated
            $table->string('phoneNumber', 20)->nullable(); // Updated
            $table->string('email', 255)->unique()->nullable(); // Updated
            $table->string('massarCode', 50)->unique()->nullable() ; // Updated
            $table->unsignedBigInteger('levelId')->nullable(); // Updated
            $table->unsignedBigInteger('classId')->nullable();
            $table->unsignedBigInteger('schoolId')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->boolean('assurance')->default(false);
            $table->string('profile_image')->nullable();
            $table->boolean('hasDisease')->default(false);
            $table->string('diseaseName', 255)->nullable();
            $table->text('medication')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->foreign('levelId')->references('id')->on('levels')->onDelete('set null'); 
            $table->foreign('classId')->references('id')->on('classes')->onDelete('set null'); 
            $table->foreign('schoolId')->references('id')->on('schools')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};