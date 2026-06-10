<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\BugarSelamatController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\LaporanBahayaController;
use App\Http\Controllers\Teams\TeamInvitationController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/login');

Route::middleware(['auth'])->group(function () {
    Route::get('/home', [DashboardController::class, 'index'])->name('app.home');
    Route::get('invitations/{invitation}/accept', [TeamInvitationController::class, 'accept'])->name('invitations.accept');

    // Bugar Selamat
    Route::resource('bugar-selamat', BugarSelamatController::class)->only(['index', 'create', 'store', 'show']);
    Route::get('bugar-selamat/{bugarSelamat}/pdf', [BugarSelamatController::class, 'exportPdf'])->name('bugar-selamat.pdf');

    // Laporan Bahaya
    Route::resource('laporan-bahaya', LaporanBahayaController::class)->only(['index', 'create', 'store', 'show']);
    Route::get('laporan-bahaya/{laporanBahaya}/pdf', [LaporanBahayaController::class, 'exportPdf'])->name('laporan-bahaya.pdf');

    // Notifications
    Route::post('notifications/{id}/read', function (string $id) {
        auth()->user()->notifications()->where('id', $id)->update(['read_at' => now()]);
        return back();
    })->name('notifications.read');

    // Admin
    Route::middleware(['admin'])->prefix('admin')->name('admin.')->group(function () {
        Route::get('/', [AdminController::class, 'index'])->name('index');

        // Bugar Selamat monitoring
        Route::get('/bugar-selamat/export', [AdminController::class, 'exportBugarSelamat'])->name('bugar-selamat.export');
        Route::get('/bugar-selamat', [AdminController::class, 'bugarSelamat'])->name('bugar-selamat');
        Route::delete('/bugar-selamat/{bugarSelamat}', [AdminController::class, 'destroyBugarSelamat'])->name('bugar-selamat.destroy');

        // Laporan Bahaya monitoring
        Route::get('/laporan-bahaya/export', [AdminController::class, 'exportLaporanBahaya'])->name('laporan-bahaya.export');
        Route::get('/laporan-bahaya', [AdminController::class, 'laporanBahaya'])->name('laporan-bahaya');
        Route::delete('/laporan-bahaya/{laporanBahaya}', [AdminController::class, 'destroyLaporanBahaya'])->name('laporan-bahaya.destroy');
        Route::patch('/laporan-bahaya/{laporanBahaya}/status', [AdminController::class, 'updateStatus'])->name('laporan-bahaya.update-status');

        // Targets
        Route::get('/targets', [AdminController::class, 'targets'])->name('targets');
        Route::patch('/targets/{level}', [AdminController::class, 'updateTarget'])->name('targets.update');

        // User management
        Route::get('/users/export', [AdminController::class, 'exportUsers'])->name('users.export');
        Route::get('/users/import-template', [AdminController::class, 'importTemplate'])->name('users.import-template');
        Route::post('/users/import', [AdminController::class, 'importUsers'])->name('users.import');
        Route::get('/users/create', [AdminController::class, 'createUser'])->name('users.create');
        Route::post('/users', [AdminController::class, 'storeUser'])->name('users.store');
        Route::get('/users/{user}/edit', [AdminController::class, 'editUser'])->name('users.edit');
        Route::put('/users/{user}', [AdminController::class, 'updateUser'])->name('users.update');
        Route::delete('/users/{user}', [AdminController::class, 'destroyUser'])->name('users.destroy');
        Route::get('/users', [AdminController::class, 'users'])->name('users');
        Route::patch('/users/{user}/level', [AdminController::class, 'updateUserLevel'])->name('users.update-level');
    });
});

require __DIR__.'/settings.php';
