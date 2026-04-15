<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\NotificationRecipient;
use App\Models\NotificationSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;

class NotificationSettingController extends Controller
{
    public function show()
    {
        $settings = NotificationSetting::query()->with('recipients')->first();

        if (!$settings) {
            $settings = NotificationSetting::create([]);
        }

        $settings->load('recipients');

        return response()->json($settings);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'primary_email' => ['nullable', 'email', 'max:255'],
            'primary_phone' => ['nullable', 'string', 'max:50'],
            'channel_email' => ['nullable', 'boolean'],
            'channel_sms' => ['nullable', 'boolean'],
            'channel_whatsapp' => ['nullable', 'boolean'],
            'recipients' => ['nullable', 'array'],
            'recipients.*.id' => ['nullable', 'integer'],
            'recipients.*.channel' => ['required', 'string', 'in:Email,SMS,WhatsApp'],
            'recipients.*.recipient' => ['required', 'string', 'max:255'],
            'recipients.*.label' => ['nullable', 'string', 'max:100'],
            'recipients.*.is_active' => ['nullable', 'boolean'],
        ]);

        $settings = NotificationSetting::query()->first();
        if (!$settings) {
            $settings = NotificationSetting::create([]);
        }

        $settings->update(Arr::except($data, ['recipients']));

        if (array_key_exists('recipients', $data)) {
            $incoming = collect($data['recipients'] ?? []);
            $incomingIds = $incoming->pluck('id')->filter()->all();

            $settings->recipients()
                ->when(count($incomingIds) > 0, function ($query) use ($incomingIds) {
                    $query->whereNotIn('id', $incomingIds);
                }, function ($query) {
                    $query->whereNotNull('id');
                })
                ->delete();

            foreach ($incoming as $recipient) {
                $payload = [
                    'notification_setting_id' => $settings->id,
                    'channel' => $recipient['channel'],
                    'recipient' => $recipient['recipient'],
                    'label' => $recipient['label'] ?? null,
                    'is_active' => $recipient['is_active'] ?? true,
                ];

                if (!empty($recipient['id'])) {
                    NotificationRecipient::query()
                        ->where('notification_setting_id', $settings->id)
                        ->where('id', $recipient['id'])
                        ->update($payload);
                } else {
                    NotificationRecipient::create($payload);
                }
            }
        }

        AuditLog::record([
            'user' => $request->user()?->name ?? 'System',
            'action' => 'Updated Notification Settings',
            'module' => 'Settings',
            'details' => 'Updated notification settings',
            'status' => 'Success',
        ]);

        $settings->load('recipients');

        return response()->json($settings);
    }
}
