<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('teacher_membership_payments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('teacher_id');
            $table->unsignedBigInteger('membership_id');
            $table->unsignedBigInteger('invoice_id')->nullable(); // Can be null for multiple invoices
            $table->json('selected_months'); // Array of months like ["2025-01", "2025-02", "2025-03"]
            $table->json('months_rest_not_paid_yet'); // Array of remaining unpaid months
            $table->decimal('total_teacher_amount', 10, 2); // Total amount teacher should earn for this payment
            $table->decimal('monthly_teacher_amount', 10, 2); // Amount teacher gets per month
            $table->decimal('payment_percentage', 5, 2); // What percentage of the invoice was paid
            $table->string('teacher_subject'); // Subject the teacher teaches
            $table->decimal('teacher_percentage', 5, 2); // Teacher's percentage from offer
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // Foreign key constraints
            $table->foreign('student_id')->references('id')->on('students')->onDelete('cascade');
            $table->foreign('teacher_id')->references('id')->on('teachers')->onDelete('cascade');
            $table->foreign('membership_id')->references('id')->on('memberships')->onDelete('cascade');
            $table->foreign('invoice_id')->references('id')->on('invoices')->onDelete('cascade');

            // Indexes for performance
            $table->index(['teacher_id', 'is_active']);
            $table->index(['membership_id', 'is_active']);
            $table->index(['student_id', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('teacher_membership_payments');
    }
};
