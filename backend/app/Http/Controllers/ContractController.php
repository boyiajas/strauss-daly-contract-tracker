<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Client;
use App\Models\Contract;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class ContractController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $contracts = Contract::query()
            ->with(['department', 'client', 'assignedUser'])
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
            'client_id' => ['nullable', 'integer', 'exists:clients,id'],
            'sensitivity_level' => ['nullable', 'string', 'in:Standard,Confidential,Restricted'],
            'assigned_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'party_name' => ['required', 'string', 'max:255'],
            'department_id' => ['required', 'integer', 'exists:departments,id'],
            'contract_type' => ['required', 'string', 'max:100'],
            'portfolio' => ['required', 'string', 'max:100'],
            'start_date' => ['required', 'date'],
            'review_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
            'value' => ['required', 'numeric', 'min:0'],
            'status' => ['required', 'string', 'max:50'],
            'category' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:100'],
            'notification_email' => ['nullable', 'email', 'max:255'],
            'notification_phone' => ['nullable', 'string', 'max:50'],
            'notification_emails' => ['nullable', 'array'],
            'notification_emails.*' => ['email', 'max:255'],
            'notification_phones' => ['nullable', 'array'],
            'notification_phones.*' => ['string', 'max:50'],
            'notification_days' => ['nullable', 'array'],
            'notification_days.*' => ['integer', 'min:1'],
            'removed_documents' => ['nullable', 'array'],
            'removed_documents.*' => ['string'],
            'file_name' => ['nullable', 'string', 'max:255'],
            'contract_files' => ['nullable', 'array'],
            'contract_files.*' => ['file', 'mimes:pdf,doc,docx,png', 'max:10240'],
        ]);

        $data = $this->syncClientData($this->prepareNotificationContacts($data));
        $data = $this->storeContractFile($request, $data);
        $data['status'] = 'Pending Approval';

        $contract = Contract::create($data);
        $contract->load(['department', 'client', 'assignedUser']);

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
        return response()->json($contract->load(['department', 'client', 'assignedUser']));
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
            'client_id' => ['sometimes', 'nullable', 'integer', 'exists:clients,id'],
            'sensitivity_level' => ['sometimes', 'nullable', 'string', 'in:Standard,Confidential,Restricted'],
            'assigned_user_id' => ['sometimes', 'nullable', 'integer', 'exists:users,id'],
            'party_name' => ['sometimes', 'string', 'max:255'],
            'department_id' => ['sometimes', 'required', 'integer', 'exists:departments,id'],
            'contract_type' => ['sometimes', 'required', 'string', 'max:100'],
            'portfolio' => ['sometimes', 'required', 'string', 'max:100'],
            'start_date' => ['sometimes', 'date'],
            'review_date' => ['sometimes', 'nullable', 'date'],
            'end_date' => ['sometimes', 'nullable', 'date'],
            'value' => ['sometimes', 'required', 'numeric', 'min:0'],
            'status' => ['sometimes', 'required', 'string', 'max:50'],
            'category' => ['sometimes', 'required', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:100'],
            'notification_email' => ['nullable', 'email', 'max:255'],
            'notification_phone' => ['nullable', 'string', 'max:50'],
            'notification_emails' => ['nullable', 'array'],
            'notification_emails.*' => ['email', 'max:255'],
            'notification_phones' => ['nullable', 'array'],
            'notification_phones.*' => ['string', 'max:50'],
            'notification_days' => ['nullable', 'array'],
            'notification_days.*' => ['integer', 'min:1'],
            'removed_documents' => ['nullable', 'array'],
            'removed_documents.*' => ['string'],
            'file_name' => ['nullable', 'string', 'max:255'],
            'contract_files' => ['nullable', 'array'],
            'contract_files.*' => ['file', 'mimes:pdf,doc,docx,png', 'max:10240'],
        ]);

        $data = $this->syncClientData($this->prepareNotificationContacts($data));
        $data = $this->storeContractFile($request, $data, $contract);
        $data['status'] = 'Pending Approval';

        $contract->update($data);
        $contract->load(['department', 'client', 'assignedUser']);

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
        $this->deleteStoredFile($contract->file_path);
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

    public function approve(Request $request, Contract $contract)
    {
        $contract->update([
            'status' => 'Active',
        ]);
        $contract->load(['department', 'client', 'assignedUser']);

        AuditLog::record([
            'user' => $request->user()?->name ?? 'System',
            'action' => 'Approved Contract',
            'module' => 'Contracts',
            'details' => sprintf('Approved contract "%s"', $contract->title),
            'status' => 'Success',
        ]);

        return response()->json($contract);
    }

    public function document(Contract $contract)
    {
        $requestedPath = request()->query('path');
        $documents = collect($contract->documents ?? [])
            ->filter(fn ($document) => !empty($document['name']) && !empty($document['path']))
            ->values();

        $selectedDocument = $requestedPath
            ? $documents->first(fn ($document) => $document['path'] === $requestedPath)
            : $documents->first();

        if (!$selectedDocument && $contract->file_path && $contract->file_name) {
            $selectedDocument = [
                'name' => $contract->file_name,
                'path' => $contract->file_path,
            ];
        }

        if (!$selectedDocument || !Storage::disk('public')->exists($selectedDocument['path'])) {
            abort(Response::HTTP_NOT_FOUND, 'Contract document not found.');
        }

        return response()->file(
            Storage::disk('public')->path($selectedDocument['path']),
            [
                'Content-Disposition' => 'inline; filename="' . ($selectedDocument['name'] ?? basename($selectedDocument['path'])) . '"',
            ]
        );
    }

    private function prepareNotificationContacts(array $data): array
    {
        $notificationEmails = collect($data['notification_emails'] ?? [])
            ->map(fn ($email) => trim((string) $email))
            ->filter()
            ->values()
            ->all();

        if (count($notificationEmails) === 0 && !empty($data['notification_email'])) {
            $notificationEmails = [trim((string) $data['notification_email'])];
        }

        $notificationPhones = collect($data['notification_phones'] ?? [])
            ->map(fn ($phone) => trim((string) $phone))
            ->filter()
            ->values()
            ->all();

        if (count($notificationPhones) === 0 && !empty($data['notification_phone'])) {
            $notificationPhones = [trim((string) $data['notification_phone'])];
        }

        return array_merge(
            Arr::except($data, ['notification_emails', 'notification_phones']),
            [
                'notification_email' => $notificationEmails[0] ?? null,
                'notification_phone' => $notificationPhones[0] ?? null,
                'notification_emails' => $notificationEmails,
                'notification_phones' => $notificationPhones,
            ]
        );
    }

    private function syncClientData(array $data): array
    {
        if (!empty($data['client_id'])) {
            $client = Client::query()->find($data['client_id']);
            if ($client) {
                $data['party_name'] = $client->name;
                return $data;
            }
        }

        if (!empty($data['party_name'])) {
            $client = Client::firstOrCreate([
                'name' => trim((string) $data['party_name']),
            ]);
            $data['client_id'] = $client->id;
            $data['party_name'] = $client->name;
        }

        return $data;
    }

    private function storeContractFile(Request $request, array $data, ?Contract $contract = null): array
    {
        $documents = collect($contract?->documents ?? [])
            ->filter(fn ($document) => !empty($document['name']) && !empty($document['path']))
            ->values()
            ->all();

        $removedDocuments = collect($data['removed_documents'] ?? [])
            ->map(fn ($path) => trim((string) $path))
            ->filter()
            ->values()
            ->all();

        if (!empty($removedDocuments)) {
            foreach ($removedDocuments as $path) {
                $this->deleteStoredFile($path);
            }

            $documents = array_values(array_filter(
                $documents,
                fn ($document) => !in_array($document['path'], $removedDocuments, true)
            ));
        }

        if ($request->hasFile('contract_files')) {
            foreach ($request->file('contract_files') as $uploadedFile) {
                $path = $uploadedFile->store('contracts', 'public');
                $documents[] = [
                    'name' => $uploadedFile->getClientOriginalName(),
                    'path' => $path,
                ];
            }
        }

        $firstDocument = $documents[0] ?? null;

        return array_merge(
            Arr::except($data, ['contract_files', 'removed_documents']),
            [
                'documents' => empty($documents) ? null : $documents,
                'file_name' => $firstDocument['name'] ?? null,
                'file_path' => $firstDocument['path'] ?? null,
            ]
        );
    }

    private function deleteStoredFile(?string $path): void
    {
        if (!$path) {
            return;
        }

        Storage::disk('public')->delete($path);
    }
}
