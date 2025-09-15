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
            $table->decimal('total_paid_to_teacher', 10, 2)->default(0.00)->after('immediate_wallet_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('teacher_membership_payments', function (Blueprint $table) {
            $table->dropColumn('total_paid_to_teacher');
        });
    }
};
