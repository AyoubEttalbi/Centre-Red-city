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
        Schema::create('recurring_transaction_payments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('recurring_transaction_id'); // references the recurring template (transactions.id)
            $table->unsignedBigInteger('transaction_id'); // references the actual payment (transactions.id)
            $table->string('period', 7); // e.g. '2025-06' for June 2025
            $table->timestamps();

            $table->foreign('recurring_transaction_id')->references('id')->on('transactions')->onDelete('cascade');
            $table->foreign('transaction_id')->references('id')->on('transactions')->onDelete('cascade');
            $table->unique(['recurring_transaction_id', 'period'], 'recurring_period_unique');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('recurring_transaction_payments');
    }
};
