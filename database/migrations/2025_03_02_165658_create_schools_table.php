<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('schools', function (Blueprint $table) {
            $table->id(); // Auto-incrementing primary key
            $table->string('name'); // School name
            $table->text('address')->nullable(); // School address
            $table->string('phone_number', 20)->nullable(); // School phone number
            $table->string('email')->unique(); // School email
            $table->timestamps(); // created_at and updated_at timestamps
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('schools');
    }
};
?>