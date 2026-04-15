<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;

class AuditLogController extends Controller
{
    public function index()
    {
        $logs = AuditLog::query()
            ->orderByDesc('created_at')
            ->get();

        return response()->json($logs);
    }
}
