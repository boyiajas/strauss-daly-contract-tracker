<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Department;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    public function index()
    {
        $departments = Department::query()
            ->orderBy('name')
            ->get();

        return response()->json($departments);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:departments,name'],
        ]);

        $department = Department::create($data);

        AuditLog::record([
            'user' => $request->user()?->name ?? 'System',
            'action' => 'Created Department',
            'module' => 'Settings',
            'details' => sprintf('Created department "%s"', $department->name),
            'status' => 'Success',
        ]);

        return response()->json($department, 201);
    }

    public function update(Request $request, Department $department)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:departments,name,'.$department->id],
        ]);

        $department->update($data);

        AuditLog::record([
            'user' => $request->user()?->name ?? 'System',
            'action' => 'Updated Department',
            'module' => 'Settings',
            'details' => sprintf('Updated department "%s"', $department->name),
            'status' => 'Success',
        ]);

        return response()->json($department);
    }
}
