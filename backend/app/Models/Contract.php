<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Contract extends Model
{
    protected $fillable = [
        'title',
        'party_name',
        'department_id',
        'contract_type',
        'portfolio',
        'start_date',
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
        'file_name',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'value' => 'decimal:2',
        'tags' => 'array',
        'notification_emails' => 'array',
        'notification_phones' => 'array',
        'notification_days' => 'array',
    ];

    public function department()
    {
        return $this->belongsTo(Department::class);
    }
}
