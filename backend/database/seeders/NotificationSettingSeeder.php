<?php

namespace Database\Seeders;

use App\Models\NotificationRecipient;
use App\Models\NotificationSetting;
use Illuminate\Database\Seeder;

class NotificationSettingSeeder extends Seeder
{
    /**
     * Seed the notification settings used by the notifications center.
     */
    public function run(): void
    {
        $settings = NotificationSetting::query()->first();

        $payload = [
            'primary_email' => 'admin@straussdaly.co.za',
            'primary_phone' => null,
            'channel_email' => true,
            'channel_sms' => true,
            'channel_whatsapp' => true,
        ];

        if ($settings) {
            $settings->update($payload);
        } else {
            $settings = NotificationSetting::create($payload);
        }

        NotificationRecipient::updateOrCreate(
            [
                'notification_setting_id' => $settings->id,
                'channel' => 'Email',
                'recipient' => 'admin@straussdaly.co.za',
            ],
            [
                'label' => 'Primary Admin',
                'is_active' => true,
            ]
        );
    }
}
