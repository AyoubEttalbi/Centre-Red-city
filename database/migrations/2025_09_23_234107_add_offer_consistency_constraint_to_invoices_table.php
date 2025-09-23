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

        // Create a trigger to enforce offer consistency
        // This approach works with MySQL as it doesn't use subqueries in constraints
        DB::statement('
            CREATE TRIGGER check_offer_consistency_before_insert
            BEFORE INSERT ON invoices
            FOR EACH ROW
            BEGIN
                DECLARE membership_offer_id INT;
                
                SELECT offer_id INTO membership_offer_id
                FROM memberships 
                WHERE id = NEW.membership_id;
                
                IF NEW.offer_id IS NOT NULL AND NEW.offer_id != membership_offer_id THEN
                    SIGNAL SQLSTATE "45000" 
                    SET MESSAGE_TEXT = "Invoice offer_id must match membership offer_id";
                END IF;
            END
        ');

        DB::statement('
            CREATE TRIGGER check_offer_consistency_before_update
            BEFORE UPDATE ON invoices
            FOR EACH ROW
            BEGIN
                DECLARE membership_offer_id INT;
                
                SELECT offer_id INTO membership_offer_id
                FROM memberships 
                WHERE id = NEW.membership_id;
                
                IF NEW.offer_id IS NOT NULL AND NEW.offer_id != membership_offer_id THEN
                    SIGNAL SQLSTATE "45000" 
                    SET MESSAGE_TEXT = "Invoice offer_id must match membership offer_id";
                END IF;
            END
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DROP TRIGGER IF EXISTS check_offer_consistency_before_insert');
        DB::statement('DROP TRIGGER IF EXISTS check_offer_consistency_before_update');
    }
};