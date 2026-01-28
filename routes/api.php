<?php

use Illuminate\Support\Facades\Route;
use Modules\Admin\Http\Controllers\AdminController;
use Modules\Admin\Http\Controllers\UserController;

// API鉴权 管理员 路由组
Route::middleware(['auth:sanctum'])->prefix('/admin')->group(function () {
    // 管理员列表
    Route::post('/admin/index', [AdminController::class, 'index']);
    Route::post('/admin/list', [AdminController::class, 'list']);
    Route::post('/admin/add', [AdminController::class, 'add']);
    Route::post('/admin/update', [AdminController::class, 'update']);
    Route::post('/admin/delete', [AdminController::class, 'delete']);
    Route::post('/admin/getDetail', [AdminController::class, 'getDetail']);
    Route::post('/admin/getLogs', [AdminController::class, 'getLogs']);
    Route::post('/admin/batchRemoveFromCompany', [AdminController::class, 'batchRemoveFromCompany']);
    Route::post('/admin/getAccountDepartments', [AdminController::class, 'getAccountDepartments']);
    Route::post('/admin/getRoles', [AdminController::class, 'getRoles']);
    Route::post('/admin/updateRoles', [AdminController::class, 'updateRoles']);

    // 用户管理
    Route::post('/user/index', [UserController::class, 'index']);
    Route::post('/user/add', [UserController::class, 'add']);
    Route::post('/user/update', [UserController::class, 'update']);
    Route::post('/user/delete', [UserController::class, 'delete']);
    Route::post('/user/getDetail', [UserController::class, 'getDetail']);
    Route::post('/user/getLogs', [UserController::class, 'getLogs']);
    Route::post('/user/audit', [UserController::class, 'audit']);
    Route::post('/user/batchAudit', [UserController::class, 'batchAudit']);
    Route::post('/user/batchDelete', [UserController::class, 'batchDelete']);
    Route::post('/user/getRoles', [UserController::class, 'getRoles']);
    Route::post('/user/updateRoles', [UserController::class, 'updateRoles']);
});
