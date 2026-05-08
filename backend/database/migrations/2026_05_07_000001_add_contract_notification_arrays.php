<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->json('notification_emails')->nullable()->after('notification_phone');
            $table->json('notification_phones')->nullable()->after('notification_emails');
        });

        DB::table('contracts')
            ->select(['id', 'notification_email', 'notification_phone'])
            ->orderBy('id')
            ->get()
            ->each(function ($contract) {
                $emails = $contract->notification_email ? [trim($contract->notification_email)] : [];
                $phones = $contract->notification_phone ? [trim($contract->notification_phone)] : [];

                DB::table('contracts')
                    ->where('id', $contract->id)
                    ->update([
                        'notification_emails' => count($emails) > 0 ? json_encode($emails) : null,
                        'notification_phones' => count($phones) > 0 ? json_encode($phones) : null,
                    ]);
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->dropColumn(['notification_emails', 'notification_phones']);
        });
    }
};
