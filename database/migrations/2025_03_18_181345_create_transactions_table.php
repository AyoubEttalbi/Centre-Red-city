<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTransactionsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('type'); // salary, wallet, expense
            $table->string('user_name')->nullable();
            $table->decimal('amount', 10, 2);
            $table->decimal('rest', 10, 2)->nullable();
            $table->text('description')->nullable();
            $table->timestamp('payment_date');
            $table->boolean('is_recurring')->default(false);
            $table->string('frequency')->nullable(); // monthly, yearly, custom
            $table->timestamp('next_payment_date')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('transactions');
    }
}