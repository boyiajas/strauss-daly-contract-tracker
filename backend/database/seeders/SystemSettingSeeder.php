<?php

namespace Database\Seeders;

use App\Models\SystemSetting;
use Illuminate\Database\Seeder;

class SystemSettingSeeder extends Seeder
{
    /**
     * Seed the system settings row used by the settings screen.
     */
    public function run(): void
    {
        $settings = SystemSetting::query()->first();

        $payload = [
            'company_name' => 'Strauss Daly',
            'registration_number' => '',
            'system_language' => 'English (South Africa)',
            'default_currency' => 'ZAR',
            'two_factor_enabled' => true,
            'session_timeout_enabled' => true,
            'categories' => ['Service', 'Employment', 'Vendor', 'Lease', 'NDA'],
        ];

        if ($settings) {
            $settings->update($payload);
            return;
        }

        SystemSetting::create($payload);
    }
}
