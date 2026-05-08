<?php

use App\Models\AuditLog;
use App\Models\Contract;
use App\Models\NotificationLog;
use App\Models\NotificationSetting;
use Carbon\Carbon;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('contracts:send-notifications', function () {
    $today = Carbon::today();
    $settings = NotificationSetting::query()->with('recipients')->first();
    $channels = [
        'Email' => $settings?->channel_email ?? true,
        'SMS' => $settings?->channel_sms ?? true,
        'WhatsApp' => $settings?->channel_whatsapp ?? true,
    ];
    $recipientsByChannel = collect($settings?->recipients ?? [])
        ->where('is_active', true)
        ->groupBy('channel')
        ->map(fn ($group) => $group->pluck('recipient')->filter()->values()->all())
        ->all();

    $contracts = Contract::query()
        ->whereNotNull('end_date')
        ->whereDate('end_date', '>=', $today)
        ->whereNotIn('status', ['Expired', 'Terminated'])
        ->get();

    $sentCount = 0;

    foreach ($contracts as $contract) {
        $endDate = Carbon::parse($contract->end_date)->startOfDay();
        $daysUntil = $today->diffInDays($endDate, false);
        $contractNotificationEmails = collect(Arr::wrap($contract->notification_emails))
            ->map(fn ($recipient) => is_string($recipient) ? trim($recipient) : '')
            ->filter()
            ->values()
            ->all();
        $contractNotificationPhones = collect(Arr::wrap($contract->notification_phones))
            ->map(fn ($recipient) => is_string($recipient) ? trim($recipient) : '')
            ->filter()
            ->values()
            ->all();

        if ($daysUntil < 0) {
            continue;
        }

        $notificationDays = $contract->notification_days ?: [90, 60, 30];
        if (!in_array($daysUntil, $notificationDays, true)) {
            continue;
        }

        foreach ($channels as $type => $enabled) {
            if (!$enabled) {
                continue;
            }

            $channelRecipients = $recipientsByChannel[$type] ?? [];
            if ($type === 'Email' && $settings?->primary_email) {
                $channelRecipients[] = $settings->primary_email;
            }
            if (in_array($type, ['SMS', 'WhatsApp'], true) && $settings?->primary_phone) {
                $channelRecipients[] = $settings->primary_phone;
            }
            if ($type === 'Email') {
                $channelRecipients = array_merge($channelRecipients, $contractNotificationEmails);
            }
            if (in_array($type, ['SMS', 'WhatsApp'], true)) {
                $channelRecipients = array_merge($channelRecipients, $contractNotificationPhones);
            }
            if ($type === 'Email' && $contract->notification_email && count($contractNotificationEmails) === 0) {
                $channelRecipients[] = $contract->notification_email;
            }
            if (in_array($type, ['SMS', 'WhatsApp'], true) && $contract->notification_phone && count($contractNotificationPhones) === 0) {
                $channelRecipients[] = $contract->notification_phone;
            }

            $channelRecipients = array_values(array_unique(array_filter($channelRecipients)));
            if (count($channelRecipients) === 0) {
                continue;
            }

            $subject = sprintf('Contract expiring in %d days: %s', $daysUntil, $contract->title);

            foreach ($channelRecipients as $recipient) {
                $exists = NotificationLog::query()
                    ->where('contract_id', $contract->id)
                    ->where('trigger_day', $daysUntil)
                    ->where('type', $type)
                    ->where('recipient', $recipient)
                    ->exists();

                if ($exists) {
                    continue;
                }

                NotificationLog::create([
                    'recipient' => $recipient,
                    'type' => $type,
                    'status' => 'Sent',
                    'subject' => $subject,
                    'contract_id' => $contract->id,
                    'trigger_day' => $daysUntil,
                ]);

                AuditLog::record([
                    'user' => 'System',
                    'action' => 'Sent Contract Notification',
                    'module' => 'System',
                    'details' => sprintf('%s notification sent for "%s" to %s (%d days)', $type, $contract->title, $recipient, $daysUntil),
                    'status' => 'Success',
                ]);

                $sentCount++;
            }
        }
    }

    $this->info("Notifications sent: {$sentCount}");
})->purpose('Send contract expiration notifications');

Schedule::command('contracts:send-notifications')->dailyAt('08:00');
