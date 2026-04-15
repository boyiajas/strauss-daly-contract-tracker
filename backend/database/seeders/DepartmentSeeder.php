<?php

namespace Database\Seeders;

use App\Models\Department;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    /**
     * Seed the application's default departments.
     */
    public function run(): void
    {
        $departments = [
            'Collections',
            'Conveyancing',
            'Finance',
            'Corporate Services',
        ];

        foreach ($departments as $name) {
            Department::updateOrCreate(
                ['name' => $name],
                ['name' => $name]
            );
        }
    }
}
