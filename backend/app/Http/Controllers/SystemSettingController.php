<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\SystemSetting;
use Illuminate\Http\Request;

class SystemSettingController extends Controller
{
    public function show()
    {
        $settings = SystemSetting::query()->first();

        if (!$settings) {
            $settings = SystemSetting::create([
                'categories' => ['Service', 'Employment', 'Vendor', 'Lease', 'NDA'],
            ]);
        }

        return response()->json($settings);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'company_name' => ['nullable', 'string', 'max:255'],
            'registration_number' => ['nullable', 'string', 'max:255'],
            'system_language' => ['nullable', 'string', 'max:255'],
            'default_currency' => ['nullable', 'string', 'max:10'],
            'two_factor_enabled' => ['nullable', 'boolean'],
            'session_timeout_enabled' => ['nullable', 'boolean'],
            'categories' => ['nullable', 'array'],
            'categories.*' => ['string', 'max:50'],
        ]);

        $settings = SystemSetting::query()->first();
        if (!$settings) {
            $settings = SystemSetting::create([
                'categories' => ['Service', 'Employment', 'Vendor', 'Lease', 'NDA'],
            ]);
        }

        $settings->update($data);

        AuditLog::record([
            'user' => $request->user()?->name ?? 'System',
            'action' => 'Updated System Settings',
            'module' => 'Settings',
            'details' => 'Updated system settings',
            'status' => 'Success',
        ]);

        return response()->json($settings);
    }
}
