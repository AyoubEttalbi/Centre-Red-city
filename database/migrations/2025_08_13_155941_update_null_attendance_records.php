<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update NULL teacher_id records with a default value
        DB::table('attendances')
            ->whereNull('teacher_id')
            ->update(['teacher_id' => 1]); // Assuming teacher ID 1 exists, adjust if needed
        
        // Update NULL subject records with a default value
        DB::table('attendances')
            ->whereNull('subject')
            ->update(['subject' => 'General']); // Default subject name
        
        // Make the columns NOT NULL
        Schema::table('attendances', function (Blueprint $table) {
            $table->unsignedBigInteger('teacher_id')->nullable(false)->change();
            $table->string('subject')->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Make the columns nullable again
        Schema::table('attendances', function (Blueprint $table) {
            $table->unsignedBigInteger('teacher_id')->nullable()->change();
            $table->string('subject')->nullable()->change();
        });
        
        // Revert the NULL values (optional, as this might cause data loss)
        // DB::table('attendances')
        //     ->where('teacher_id', 1)
        //     ->where('subject', 'General')
        //     ->update(['teacher_id' => null, 'subject' => null]);
    }
};
