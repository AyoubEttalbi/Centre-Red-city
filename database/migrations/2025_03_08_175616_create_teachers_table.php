<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('teachers', function (Blueprint $table) {
            $table->id();
            $table->string('first_name');
            $table->string('last_name');
            $table->text('address')->nullable();
            $table->string('phone_number')->nullable();
            $table->string('email')->unique();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->decimal('wallet', 10, 2)->default(0);
            $table->string('profile_image')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teachers');
    }
};
?>