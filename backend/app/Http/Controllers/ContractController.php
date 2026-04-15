<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Contract;
use Illuminate\Http\Request;

class ContractController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $contracts = Contract::query()
            ->orderByDesc('created_at')
            ->get();

        return response()->json($contracts);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'party_name' => ['required', 'string', 'max:255'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date'],
            'value' => ['nullable', 'numeric', 'min:0'],
            'status' => ['nullable', 'string', 'max:50'],
            'category' => ['nullable', 'string', 'max:50'],
            'description' => ['nullable', 'string'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:100'],
            'notification_email' => ['nullable', 'email', 'max:255'],
            'notification_phone' => ['nullable', 'string', 'max:50'],
            'notification_days' => ['nullable', 'array'],
            'notification_days.*' => ['integer', 'min:1'],
            'file_name' => ['nullable', 'string', 'max:255'],
        ]);

        $contract = Contract::create($data);

        AuditLog::record([
            'user' => $request->user()?->name ?? 'System',
            'action' => 'Created Contract',
            'module' => 'Contracts',
            'details' => sprintf('Created contract "%s"', $contract->title),
            'status' => 'Success',
        ]);

        return response()->json($contract, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Contract $contract)
    {
        return response()->json($contract);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Contract $contract)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Contract $contract)
    {
        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'party_name' => ['sometimes', 'string', 'max:255'],
            'start_date' => ['sometimes', 'date'],
            'end_date' => ['sometimes', 'date'],
            'value' => ['sometimes', 'numeric', 'min:0'],
            'status' => ['sometimes', 'string', 'max:50'],
            'category' => ['sometimes', 'string', 'max:50'],
            'description' => ['nullable', 'string'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:100'],
            'notification_email' => ['nullable', 'email', 'max:255'],
            'notification_phone' => ['nullable', 'string', 'max:50'],
            'notification_days' => ['nullable', 'array'],
            'notification_days.*' => ['integer', 'min:1'],
            'file_name' => ['nullable', 'string', 'max:255'],
        ]);

        $contract->update($data);

        AuditLog::record([
            'user' => $request->user()?->name ?? 'System',
            'action' => 'Updated Contract',
            'module' => 'Contracts',
            'details' => sprintf('Updated contract "%s"', $contract->title),
            'status' => 'Success',
        ]);

        return response()->json($contract);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Contract $contract)
    {
        $title = $contract->title;
        $contract->delete();

        AuditLog::record([
            'user' => request()->user()?->name ?? 'System',
            'action' => 'Deleted Contract',
            'module' => 'Contracts',
            'details' => sprintf('Deleted contract "%s"', $title),
            'status' => 'Success',
        ]);

        return response()->json(['status' => 'deleted']);
    }
}
