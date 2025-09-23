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
        // First, fix any existing inconsistencies
        DB::statement('
            UPDATE invoices 
            SET offer_id = (
                SELECT offer_id 
                FROM memberships 
                WHERE memberships.id = invoices.membership_id
            )
            WHERE offer_id != (
                SELECT offer_id 
                FROM memberships 
                WHERE memberships.id = invoices.membership_id
            )
        ');

        // Add constraint to prevent future inconsistencies
        DB::statement('
            ALTER TABLE invoices 
            ADD CONSTRAINT check_offer_consistency 
            CHECK (
                offer_id = (
                    SELECT offer_id 
                    FROM memberships 
                    WHERE memberships.id = invoices.membership_id
                )
            )
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('ALTER TABLE invoices DROP CONSTRAINT check_offer_consistency');
    }
};