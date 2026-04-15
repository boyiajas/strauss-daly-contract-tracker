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
        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('company_name')->default('Strauss Daly');
            $table->string('registration_number')->default('');
            $table->string('system_language')->default('English (South Africa)');
            $table->string('default_currency')->default('ZAR');
            $table->boolean('two_factor_enabled')->default(true);
            $table->boolean('session_timeout_enabled')->default(true);
            $table->json('categories')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};
