<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\NotificationLog;
use App\Models\NotificationSetting;
use Illuminate\Http\Request;

class NotificationLogController extends Controller
{
    public function index()
    {
        $logs = NotificationLog::query()
            ->orderByDesc('created_at')
            ->get();

        return response()->json($logs);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'recipient' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'max:50'],
            'status' => ['required', 'string', 'max:50'],
            'subject' => ['required', 'string', 'max:255'],
            'contract_id' => ['nullable', 'integer'],
            'trigger_day' => ['nullable', 'integer', 'min:1'],
        ]);

        $log = NotificationLog::create($data);

        return response()->json($log, 201);
    }

    public function test(Request $request)
    {
        $settings = NotificationSetting::query()->with('recipients')->first();
        $fallbackRecipient = $settings?->primary_email ?? 'notifications@example.com';
        $recipient = $request->input('recipient');
        if (!$recipient && $settings) {
            $recipient = $settings->recipients
                ->where('channel', 'Email')
                ->where('is_active', true)
                ->pluck('recipient')
                ->first();
        }
        $recipient = $recipient ?? $fallbackRecipient;

        $log = NotificationLog::create([
            'recipient' => $recipient,
            'type' => 'Email',
            'status' => 'Sent',
            'subject' => 'Test notification',
        ]);

        AuditLog::record([
            'user' => $request->user()?->name ?? 'System',
            'action' => 'Sent Test Notification',
            'module' => 'System',
            'details' => sprintf('Sent test notification to %s', $recipient),
            'status' => 'Success',
        ]);

        return response()->json($log, 201);
    }
}
