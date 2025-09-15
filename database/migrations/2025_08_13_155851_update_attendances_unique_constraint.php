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
        Schema::table('attendances', function (Blueprint $table) {
            // Check if the old unique constraint exists before dropping it
            $constraintExists = DB::select("
                SELECT COUNT(*) as count 
                FROM information_schema.TABLE_CONSTRAINTS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'attendances' 
                AND CONSTRAINT_TYPE = 'UNIQUE' 
                AND CONSTRAINT_NAME = 'attendances_student_id_classid_date_unique'
            ")[0]->count > 0;
            
            if ($constraintExists) {
                $table->dropUnique(['student_id', 'classId', 'date']);
            }
            
            // Check if the new unique constraint already exists
            $newConstraintExists = DB::select("
                SELECT COUNT(*) as count 
                FROM information_schema.TABLE_CONSTRAINTS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'attendances' 
                AND CONSTRAINT_TYPE = 'UNIQUE' 
                AND CONSTRAINT_NAME = 'attendances_student_class_date_teacher_subject_unique'
            ")[0]->count > 0;
            
            if (!$newConstraintExists) {
                // Add new unique constraint that includes teacher_id and subject
                $table->unique(['student_id', 'classId', 'date', 'teacher_id', 'subject'], 'attendances_student_class_date_teacher_subject_unique');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            // Check if the new unique constraint exists before dropping it
            $newConstraintExists = DB::select("
                SELECT COUNT(*) as count 
                FROM information_schema.TABLE_CONSTRAINTS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'attendances' 
                AND CONSTRAINT_TYPE = 'UNIQUE' 
                AND CONSTRAINT_NAME = 'attendances_student_class_date_teacher_subject_unique'
            ")[0]->count > 0;
            
            if ($newConstraintExists) {
                $table->dropUnique('attendances_student_class_date_teacher_subject_unique');
            }
            
            // Check if the old unique constraint exists before restoring it
            $oldConstraintExists = DB::select("
                SELECT COUNT(*) as count 
                FROM information_schema.TABLE_CONSTRAINTS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'attendances' 
                AND CONSTRAINT_TYPE = 'UNIQUE' 
                AND CONSTRAINT_NAME = 'attendances_student_id_classid_date_unique'
            ")[0]->count > 0;
            
            if (!$oldConstraintExists) {
                $table->unique(['student_id', 'classId', 'date']);
            }
        });
    }
};
