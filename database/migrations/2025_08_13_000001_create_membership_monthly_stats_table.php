<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('membership_monthly_stats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->nullable()->constrained('schools')->onDelete('cascade');
            $table->unsignedInteger('year');
            $table->unsignedInteger('month');
            $table->unsignedInteger('total_memberships')->default(0);
            $table->unsignedInteger('paid_count')->default(0);
            $table->unsignedInteger('unpaid_count')->default(0);
            $table->unsignedInteger('expired_count')->default(0);
            $table->unsignedInteger('pending_count')->default(0);
            $table->timestamps();
            
            // Unique constraint to prevent duplicate records for same school/month
            $table->unique(['school_id', 'year', 'month'], 'unique_school_month');
            
            // Indexes for better query performance
            $table->index(['school_id', 'year', 'month'], 'idx_school_month');
            $table->index(['year', 'month'], 'idx_year_month');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('membership_monthly_stats');
    }
};


