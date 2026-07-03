<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->string('title', 20)->nullable()->after('id');
            $table->text('address')->nullable()->after('name');
            $table->json('contacts')->nullable()->after('address');
        });

        Schema::table('contracts', function (Blueprint $table) {
            $table->foreignId('assigned_user_id')->nullable()->after('client_id')->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->dropConstrainedForeignId('assigned_user_id');
        });

        Schema::table('clients', function (Blueprint $table) {
            $table->dropColumn(['title', 'address', 'contacts']);
        });
    }
};
