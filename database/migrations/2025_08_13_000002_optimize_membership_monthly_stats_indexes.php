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
        Schema::table('membership_monthly_stats', function (Blueprint $table) {
            // Add composite index for common queries
            $table->index(['school_id', 'year', 'month'], 'idx_school_year_month');
            
            // Add index for date range queries
            $table->index(['year', 'month'], 'idx_year_month_performance');
            
            // Add index for current month queries
            $table->index(['school_id', 'year', 'month'], 'idx_current_month_lookup');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('membership_monthly_stats', function (Blueprint $table) {
            $table->dropIndex('idx_school_year_month');
            $table->dropIndex('idx_year_month_performance');
            $table->dropIndex('idx_current_month_lookup');
        });
    }
};
