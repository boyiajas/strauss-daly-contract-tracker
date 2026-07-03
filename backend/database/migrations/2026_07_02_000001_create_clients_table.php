<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
        });

        Schema::table('contracts', function (Blueprint $table) {
            $table->foreignId('client_id')->nullable()->after('party_name')->constrained('clients')->nullOnDelete();
        });

        $names = DB::table('contracts')
            ->select('party_name')
            ->distinct()
            ->pluck('party_name')
            ->filter(fn ($name) => filled($name));

        foreach ($names as $name) {
            $clientId = DB::table('clients')->insertGetId([
                'name' => $name,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('contracts')
                ->where('party_name', $name)
                ->update(['client_id' => $clientId]);
        }
    }

    public function down(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->dropConstrainedForeignId('client_id');
        });

        Schema::dropIfExists('clients');
    }
};
