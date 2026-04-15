<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $fillable = [
        'user',
        'action',
        'module',
        'details',
        'status',
        'ip_address',
    ];

    public static function record(array $data): self
    {
        return self::create([
            'user' => $data['user'] ?? 'System',
            'action' => $data['action'] ?? 'Activity',
            'module' => $data['module'] ?? 'System',
            'details' => $data['details'] ?? '',
            'status' => $data['status'] ?? 'Success',
            'ip_address' => $data['ip_address'] ?? request()->ip(),
        ]);
    }
}
