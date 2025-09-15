<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('classes', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique(); // Matches the `name` field in the data
            $table->foreignId('level_id')->constrained()->onDelete('cascade');
            $table->integer('number_of_students')->default(0);
            $table->integer('number_of_teachers')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('classes');
    }
};
