<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class UserController extends Controller
{
    public function index()
    {
        $users = User::query()
            ->orderBy('name')
            ->get();

        return response()->json($users);
    }

    public function show(User $user)
    {
        return response()->json($user);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'role' => ['nullable', 'string', 'max:50'],
            'department' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'max:50'],
        ]);

        $data['password'] = $request->input('password', Str::random(16));
        $data['role'] = $data['role'] ?? 'Viewer';
        $data['department'] = $data['department'] ?? '';
        $data['status'] = $data['status'] ?? 'Active';

        $user = User::create($data);

        AuditLog::record([
            'user' => $request->user()?->name ?? 'System',
            'action' => 'Created User',
            'module' => 'Users',
            'details' => sprintf('Created user "%s" (%s)', $user->name, $user->email),
            'status' => 'Success',
        ]);

        return response()->json($user, 201);
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', 'unique:users,email,'.$user->id],
            'role' => ['sometimes', 'string', 'max:50'],
            'department' => ['sometimes', 'string', 'max:255'],
            'status' => ['sometimes', 'string', 'max:50'],
        ]);

        $user->update($data);

        AuditLog::record([
            'user' => $request->user()?->name ?? 'System',
            'action' => 'Updated User',
            'module' => 'Users',
            'details' => sprintf('Updated user "%s"', $user->name),
            'status' => 'Success',
        ]);

        return response()->json($user);
    }

    public function destroy(Request $request, User $user)
    {
        $name = $user->name;
        $email = $user->email;
        $user->delete();

        AuditLog::record([
            'user' => $request->user()?->name ?? 'System',
            'action' => 'Deleted User',
            'module' => 'Users',
            'details' => sprintf('Deleted user "%s" (%s)', $name, $email),
            'status' => 'Success',
        ]);

        return response()->json(['status' => 'deleted']);
    }
}
