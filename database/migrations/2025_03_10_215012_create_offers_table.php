<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateOffersTable extends Migration
{
    public function up()
    {
        Schema::create('offers', function (Blueprint $table) {
            $table->id();
            $table->string('offer_name')->unique();
            $table->decimal('price', 8, 2); // Price with 8 digits total and 2 decimal places
            $table->foreignId('levelId')->constrained('levels')->onDelete('cascade'); // Foreign key to levels table
            $table->json('subjects'); // Store subjects as JSON
            $table->json('percentage'); // Store percentages as JSON
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down()
    {
        Schema::dropIfExists('offers');
    }
}
