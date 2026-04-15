<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NotificationLog extends Model
{
    protected $fillable = [
        'recipient',
        'type',
        'status',
        'subject',
        'contract_id',
        'trigger_day',
    ];
}
