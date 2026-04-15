<?php

namespace Database\Seeders;

use App\Models\Contract;
use App\Models\Department;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class ContractSeeder extends Seeder
{
    /**
     * Seed sample contracts for staging and demo environments.
     */
    public function run(): void
    {
        $contracts = [
            [
                'title' => 'Enterprise Software Agreement',
                'party_name' => 'Acme Technologies',
                'department' => 'Corporate Services',
                'start_date' => Carbon::today()->subMonths(2)->toDateString(),
                'end_date' => Carbon::today()->addDays(90)->toDateString(),
                'value' => 250000,
                'status' => 'Active',
                'category' => 'Service',
                'description' => 'Annual software services and support agreement.',
                'tags' => ['software', 'priority'],
                'notification_email' => 'admin@straussdaly.co.za',
                'notification_phone' => null,
                'notification_days' => [90, 60, 30],
                'file_name' => 'enterprise-software-agreement.pdf',
            ],
            [
                'title' => 'Facilities Lease Renewal',
                'party_name' => 'Rosebank Property Group',
                'department' => 'Conveyancing',
                'start_date' => Carbon::today()->subMonths(10)->toDateString(),
                'end_date' => Carbon::today()->addDays(30)->toDateString(),
                'value' => 120000,
                'status' => 'Pending Approval',
                'category' => 'Lease',
                'description' => 'Office lease renewal awaiting final approval.',
                'tags' => ['lease', 'renewal'],
                'notification_email' => 'manager@straussdaly.co.za',
                'notification_phone' => null,
                'notification_days' => [30],
                'file_name' => 'facilities-lease-renewal.pdf',
            ],
            [
                'title' => 'Recruitment Services SLA',
                'party_name' => 'Talent Bridge',
                'department' => 'Finance',
                'start_date' => Carbon::today()->subMonths(1)->toDateString(),
                'end_date' => Carbon::today()->addMonths(6)->toDateString(),
                'value' => 80000,
                'status' => 'Draft',
                'category' => 'Vendor',
                'description' => 'Draft recruitment services agreement for finance hiring.',
                'tags' => ['vendor', 'hr'],
                'notification_email' => 'viewer@straussdaly.co.za',
                'notification_phone' => null,
                'notification_days' => [60, 30],
                'file_name' => 'recruitment-services-sla.pdf',
            ],
        ];

        foreach ($contracts as $contract) {
            $department = Department::query()
                ->where('name', $contract['department'])
                ->first();

            unset($contract['department']);
            $contract['department_id'] = $department?->id;

            Contract::updateOrCreate(
                [
                    'title' => $contract['title'],
                    'party_name' => $contract['party_name'],
                ],
                $contract
            );
        }
    }
}
