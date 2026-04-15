<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NotificationSetting extends Model
{
    protected $fillable = [
        'primary_email',
        'primary_phone',
        'channel_email',
        'channel_sms',
        'channel_whatsapp',
    ];

    protected $casts = [
        'channel_email' => 'boolean',
        'channel_sms' => 'boolean',
        'channel_whatsapp' => 'boolean',
    ];

    public function recipients()
    {
        return $this->hasMany(NotificationRecipient::class);
    }
}
