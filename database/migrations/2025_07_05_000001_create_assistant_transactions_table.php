<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('assistant_transactions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('assistant_id');
            $table->decimal('amount', 10, 2);
            $table->string('type')->default('payment'); // payment, salary, etc.
            $table->boolean('is_recurring')->default(false);
            $table->date('payment_date')->nullable();
            $table->string('description')->nullable();
            $table->string('frequency')->nullable();
            $table->string('status')->default('pending');
            $table->timestamps();

            $table->foreign('assistant_id')->references('id')->on('assistants')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('assistant_transactions');
    }
};
