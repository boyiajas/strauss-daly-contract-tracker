<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    protected $fillable = [
        'title',
        'name',
        'address',
        'contacts',
    ];

    protected $casts = [
        'contacts' => 'array',
    ];

    public function contracts()
    {
        return $this->hasMany(Contract::class);
    }
}
