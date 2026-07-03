<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->json('documents')->nullable()->after('notification_days');
        });

        DB::table('contracts')
            ->select('id', 'file_name', 'file_path')
            ->orderBy('id')
            ->get()
            ->each(function ($contract): void {
                $documents = [];

                if (!empty($contract->file_name) && !empty($contract->file_path)) {
                    $documents[] = [
                        'name' => $contract->file_name,
                        'path' => $contract->file_path,
                    ];
                }

                DB::table('contracts')
                    ->where('id', $contract->id)
                    ->update(['documents' => empty($documents) ? null : json_encode($documents)]);
            });
    }

    public function down(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->dropColumn('documents');
        });
    }
};
