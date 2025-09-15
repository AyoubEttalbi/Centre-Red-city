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
        Schema::create('memberships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->foreignId('offer_id')->constrained('offers')->onDelete('cascade');
            $table->json('teachers'); 
            $table->timestamps();
            $table->enum('payment_status', ['pending', 'paid', 'expired'])->default('pending');
            $table->boolean('is_active')->default(false);
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->softDeletes();
        });
    }



    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('memberships');
    }

};
