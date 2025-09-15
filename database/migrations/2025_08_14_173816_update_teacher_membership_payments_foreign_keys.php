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
        Schema::table('teacher_membership_payments', function (Blueprint $table) {
            // Drop the existing foreign key constraint - use the actual constraint name
            $table->dropForeign('teacher_membership_payments_membership_id_foreign');
            
            // Make the column nullable
            $table->unsignedBigInteger('membership_id')->nullable()->change();
            
            // Add the new foreign key constraint with set null on delete
            $table->foreign('membership_id')->references('id')->on('memberships')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('teacher_membership_payments', function (Blueprint $table) {
            // Drop the new foreign key constraint
            $table->dropForeign('teacher_membership_payments_membership_id_foreign');
            
            // Make the column not nullable again
            $table->unsignedBigInteger('membership_id')->nullable(false)->change();
            
            // Restore the original foreign key constraint with cascade on delete
            $table->foreign('membership_id')->references('id')->on('memberships')->onDelete('cascade');
        });
    }
};
