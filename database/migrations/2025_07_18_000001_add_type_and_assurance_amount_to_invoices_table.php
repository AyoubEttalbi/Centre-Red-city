<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('type')->default('invoice')->after('id');
            $table->decimal('assurance_amount', 10, 2)->nullable()->after('amountPaid');
        });
    }

    public function down()
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn('type');
            $table->dropColumn('assurance_amount');
        });
    }
}; 