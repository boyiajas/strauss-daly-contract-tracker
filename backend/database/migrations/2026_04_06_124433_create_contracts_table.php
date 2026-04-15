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
        Schema::create('contracts', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('party_name');
            $table->date('start_date');
            $table->date('end_date');
            $table->decimal('value', 15, 2)->default(0);
            $table->string('status')->default('Draft');
            $table->string('category')->default('Service');
            $table->text('description')->nullable();
            $table->json('tags')->nullable();
            $table->string('notification_email')->nullable();
            $table->string('notification_phone')->nullable();
            $table->string('file_name')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contracts');
    }
};
