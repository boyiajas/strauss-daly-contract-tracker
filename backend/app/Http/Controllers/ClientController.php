<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Client;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function index()
    {
        return response()->json(
            Client::query()
                ->withCount('contracts')
                ->orderBy('name')
                ->get()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => ['nullable', 'string', 'max:20'],
            'name' => ['required', 'string', 'max:255', 'unique:clients,name'],
            'address' => ['nullable', 'string'],
            'contacts' => ['nullable', 'array'],
            'contacts.*.name' => ['required', 'string', 'max:255'],
            'contacts.*.email' => ['nullable', 'email', 'max:255'],
            'contacts.*.phone' => ['nullable', 'string', 'max:50'],
        ]);

        $client = Client::create($data)->loadCount('contracts');

        AuditLog::record([
            'user' => $request->user()?->name ?? 'System',
            'action' => 'Created Client',
            'module' => 'Settings',
            'details' => sprintf('Created client "%s"', $client->name),
            'status' => 'Success',
        ]);

        return response()->json($client, 201);
    }

    public function update(Request $request, Client $client)
    {
        $data = $request->validate([
            'title' => ['nullable', 'string', 'max:20'],
            'name' => ['required', 'string', 'max:255', 'unique:clients,name,' . $client->id],
            'address' => ['nullable', 'string'],
            'contacts' => ['nullable', 'array'],
            'contacts.*.name' => ['required', 'string', 'max:255'],
            'contacts.*.email' => ['nullable', 'email', 'max:255'],
            'contacts.*.phone' => ['nullable', 'string', 'max:50'],
        ]);

        $oldName = $client->name;
        $client->update($data);
        $client->contracts()->update(['party_name' => $client->name]);
        $client->loadCount('contracts');

        AuditLog::record([
            'user' => $request->user()?->name ?? 'System',
            'action' => 'Updated Client',
            'module' => 'Settings',
            'details' => sprintf('Renamed client "%s" to "%s"', $oldName, $client->name),
            'status' => 'Success',
        ]);

        return response()->json($client);
    }

    public function destroy(Request $request, Client $client)
    {
        if ($client->contracts()->exists()) {
            return response()->json([
                'message' => 'This client cannot be deleted while contracts are still linked to it.',
            ], 422);
        }

        $name = $client->name;
        $client->delete();

        AuditLog::record([
            'user' => $request->user()?->name ?? 'System',
            'action' => 'Deleted Client',
            'module' => 'Settings',
            'details' => sprintf('Deleted client "%s"', $name),
            'status' => 'Success',
        ]);

        return response()->json(['status' => 'deleted']);
    }
}
