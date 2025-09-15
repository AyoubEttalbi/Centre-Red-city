<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('membership_id')->nullable()->constrained()->onDelete('set null'); // Change to set null
            $table->foreignId('student_id')->nullable()->constrained()->onDelete('set null');
            $table->date('billDate');
            $table->integer('months');
            $table->date('creationDate')->nullable();
            $table->decimal('totalAmount', 10, 2);
            $table->decimal('amountPaid', 10, 2);
            $table->decimal('rest', 10, 2);
            $table->foreignId('offer_id')->nullable()->constrained()->onDelete('set null'); // Already set to null
            $table->date('endDate')->nullable();
            $table->boolean('includePartialMonth')->default(false);
            $table->decimal('partialMonthAmount', 10, 2)->nullable();
            $table->dateTime('last_payment_date')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down()
    {
        Schema::dropIfExists('invoices');
    }
};