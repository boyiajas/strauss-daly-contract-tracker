<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Seed the application's core users.
     */
    public function run(): void
    {
        $users = [
            [
                'name' => 'Admin',
                'email' => 'admin@straussdaly.co.za',
                'role' => 'Admin',
                'department' => 'Corporate Services',
                'status' => 'Active',
                'password' => 'password123',
            ],
            [
                'name' => 'Sarah Manager',
                'email' => 'manager@straussdaly.co.za',
                'role' => 'Manager',
                'department' => 'Conveyancing',
                'status' => 'Active',
                'password' => 'password123',
            ],
            [
                'name' => 'Mike Viewer',
                'email' => 'viewer@straussdaly.co.za',
                'role' => 'Viewer',
                'department' => 'Finance',
                'status' => 'Active',
                'password' => 'password123',
            ],
            [
                'name' => 'Test User',
                'email' => 'test@example.com',
                'role' => 'Viewer',
                'department' => 'Collections',
                'status' => 'Active',
                'password' => 'password123',
            ],
        ];

        foreach ($users as $user) {
            User::updateOrCreate(
                ['email' => $user['email']],
                [
                    'name' => $user['name'],
                    'role' => $user['role'],
                    'department' => $user['department'],
                    'status' => $user['status'],
                    'email_verified_at' => now(),
                    'password' => Hash::make($user['password']),
                ]
            );
        }
    }
}
