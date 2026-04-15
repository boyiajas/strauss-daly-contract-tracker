<?php

use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\ContractController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\NotificationLogController;
use App\Http\Controllers\NotificationSettingController;
use App\Http\Controllers\SystemSettingController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/health', function (Request $request) {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toIso8601String(),
    ]);
});

Route::get('/contracts', [ContractController::class, 'index']);
Route::post('/contracts', [ContractController::class, 'store']);
Route::get('/contracts/{contract}', [ContractController::class, 'show']);
Route::patch('/contracts/{contract}', [ContractController::class, 'update']);
Route::delete('/contracts/{contract}', [ContractController::class, 'destroy']);

Route::get('/departments', [DepartmentController::class, 'index']);
Route::post('/departments', [DepartmentController::class, 'store']);
Route::patch('/departments/{department}', [DepartmentController::class, 'update']);

Route::get('/users', [UserController::class, 'index']);
Route::post('/users', [UserController::class, 'store']);
Route::get('/users/{user}', [UserController::class, 'show']);
Route::patch('/users/{user}', [UserController::class, 'update']);
Route::delete('/users/{user}', [UserController::class, 'destroy']);

Route::get('/notification-settings', [NotificationSettingController::class, 'show']);
Route::put('/notification-settings', [NotificationSettingController::class, 'update']);

Route::get('/notification-logs', [NotificationLogController::class, 'index']);
Route::post('/notification-logs', [NotificationLogController::class, 'store']);
Route::post('/notification-logs/test', [NotificationLogController::class, 'test']);

Route::get('/audit-logs', [AuditLogController::class, 'index']);

Route::get('/system-settings', [SystemSettingController::class, 'show']);
Route::put('/system-settings', [SystemSettingController::class, 'update']);
