<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Contract extends Model
{
    protected $fillable = [
        'title',
        'party_name',
        'start_date',
        'end_date',
        'value',
        'status',
        'category',
        'description',
        'tags',
        'notification_email',
        'notification_phone',
        'notification_days',
        'file_name',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'value' => 'decimal:2',
        'tags' => 'array',
        'notification_days' => 'array',
    ];
}
