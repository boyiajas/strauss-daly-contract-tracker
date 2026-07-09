<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Contract extends Model
{
    protected $fillable = [
        'title',
        'party_name',
        'client_id',
        'sensitivity_level',
        'assigned_user_id',
        'department_id',
        'contract_type',
        'portfolio',
        'start_date',
        'review_date',
        'end_date',
        'value',
        'status',
        'category',
        'description',
        'tags',
        'notification_email',
        'notification_phone',
        'notification_emails',
        'notification_phones',
        'notification_days',
        'documents',
        'file_name',
        'file_path',
    ];

    protected $casts = [
        'start_date' => 'date',
        'review_date' => 'date',
        'end_date' => 'date',
        'value' => 'decimal:2',
        'tags' => 'array',
        'notification_emails' => 'array',
        'notification_phones' => 'array',
        'notification_days' => 'array',
        'documents' => 'array',
    ];

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function assignedUser()
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }
}
