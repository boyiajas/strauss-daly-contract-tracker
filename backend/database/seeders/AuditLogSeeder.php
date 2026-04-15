<?php

namespace Database\Seeders;

use App\Models\AuditLog;
use Illuminate\Database\Seeder;

class AuditLogSeeder extends Seeder
{
    /**
     * Seed sample audit entries for the dashboard and audit log view.
     */
    public function run(): void
    {
        $entries = [
            [
                'user' => 'Admin',
                'action' => 'Created Contract',
                'module' => 'Contracts',
                'details' => 'Created contract "Enterprise Software Agreement"',
                'status' => 'Success',
                'ip_address' => '127.0.0.1',
            ],
            [
                'user' => 'Sarah Manager',
                'action' => 'Updated Notification Settings',
                'module' => 'Settings',
                'details' => 'Updated notification settings',
                'status' => 'Success',
                'ip_address' => '127.0.0.1',
            ],
            [
                'user' => 'System',
                'action' => 'Sent Contract Notification',
                'module' => 'System',
                'details' => 'Email notification sent for "Facilities Lease Renewal" to manager@straussdaly.co.za (30 days)',
                'status' => 'Success',
                'ip_address' => '127.0.0.1',
            ],
        ];

        foreach ($entries as $entry) {
            AuditLog::updateOrCreate(
                [
                    'action' => $entry['action'],
                    'module' => $entry['module'],
                    'details' => $entry['details'],
                ],
                $entry
            );
        }
    }
}
