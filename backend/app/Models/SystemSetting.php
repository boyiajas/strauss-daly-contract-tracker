<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    protected $fillable = [
        'company_name',
        'registration_number',
        'system_language',
        'default_currency',
        'two_factor_enabled',
        'session_timeout_enabled',
        'categories',
    ];

    protected $casts = [
        'two_factor_enabled' => 'boolean',
        'session_timeout_enabled' => 'boolean',
        'categories' => 'array',
    ];
}
