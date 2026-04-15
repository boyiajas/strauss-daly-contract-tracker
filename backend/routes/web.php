<?php

use Illuminate\Support\Facades\Route;

Route::get('/{any}', function () {
    $indexPath = public_path('index.html');
    if (!file_exists($indexPath)) {
        abort(404, 'React build not found. Run npm run build:laravel.');
    }

    return response()->file($indexPath);
})->where('any', '^(?!(api|sanctum)).*$');
