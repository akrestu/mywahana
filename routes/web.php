<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AssessmentController;
use App\Http\Controllers\BugarSelamatController;
use App\Http\Controllers\SiteController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\LaporanBahayaController;
use App\Http\Controllers\InspeksiKantorController;
use App\Http\Controllers\InspeksiMessController;
use App\Http\Controllers\InspeksiTambangController;
use App\Http\Controllers\InspeksiWorkshopController;
use App\Http\Controllers\KomunikasiJsaController;
use App\Http\Controllers\ObservasiKeselamatanController;
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

    // SAP - hanya staff & sr.staff
    Route::middleware(['staff'])->prefix('sap')->name('sap.')->group(function () {
        Route::resource('observasi-keselamatan', ObservasiKeselamatanController::class)
            ->only(['index', 'create', 'store', 'show'])
            ->parameters(['observasi-keselamatan' => 'observasiKeselamatan']);
        Route::get('observasi-keselamatan/{observasiKeselamatan}/pdf', [ObservasiKeselamatanController::class, 'exportPdf'])
            ->name('observasi-keselamatan.pdf');
        Route::get('observasi-keselamatan/{observasiKeselamatan}/konfirmasi', [ObservasiKeselamatanController::class, 'konfirmasi'])
            ->name('observasi-keselamatan.konfirmasi');
        Route::post('observasi-keselamatan/{observasiKeselamatan}/konfirmasi', [ObservasiKeselamatanController::class, 'storeKonfirmasi'])
            ->name('observasi-keselamatan.konfirmasi.store');
        Route::post('observasi-keselamatan/{observasiKeselamatan}/tolak', [ObservasiKeselamatanController::class, 'tolakKonfirmasi'])
            ->name('observasi-keselamatan.tolak');

        // Inspeksi Kantor
        Route::resource('inspeksi-kantor', InspeksiKantorController::class)
            ->only(['index', 'create', 'store', 'show'])
            ->parameters(['inspeksi-kantor' => 'inspeksiKantor']);
        Route::get('inspeksi-kantor/{inspeksiKantor}/pdf', [InspeksiKantorController::class, 'exportPdf'])->name('inspeksi-kantor.pdf');
        Route::get('inspeksi-kantor/{inspeksiKantor}/re-inspeksi', [InspeksiKantorController::class, 'reInspeksi'])->name('inspeksi-kantor.re-inspeksi');
        Route::post('inspeksi-kantor/{inspeksiKantor}/re-inspeksi', [InspeksiKantorController::class, 'storeReInspeksi'])->name('inspeksi-kantor.re-inspeksi.store');
        Route::post('inspeksi-kantor/{inspeksiKantor}/tolak', [InspeksiKantorController::class, 'tolak'])->name('inspeksi-kantor.tolak');

        // Inspeksi Tambang
        Route::resource('inspeksi-tambang', InspeksiTambangController::class)
            ->only(['index', 'create', 'store', 'show'])
            ->parameters(['inspeksi-tambang' => 'inspeksiTambang']);
        Route::get('inspeksi-tambang/{inspeksiTambang}/pdf', [InspeksiTambangController::class, 'exportPdf'])->name('inspeksi-tambang.pdf');
        Route::get('inspeksi-tambang/{inspeksiTambang}/re-inspeksi', [InspeksiTambangController::class, 'reInspeksi'])->name('inspeksi-tambang.re-inspeksi');
        Route::post('inspeksi-tambang/{inspeksiTambang}/re-inspeksi', [InspeksiTambangController::class, 'storeReInspeksi'])->name('inspeksi-tambang.re-inspeksi.store');
        Route::post('inspeksi-tambang/{inspeksiTambang}/tolak', [InspeksiTambangController::class, 'tolak'])->name('inspeksi-tambang.tolak');

        // Inspeksi Workshop
        Route::resource('inspeksi-workshop', InspeksiWorkshopController::class)
            ->only(['index', 'create', 'store', 'show'])
            ->parameters(['inspeksi-workshop' => 'inspeksiWorkshop']);
        Route::get('inspeksi-workshop/{inspeksiWorkshop}/pdf', [InspeksiWorkshopController::class, 'exportPdf'])->name('inspeksi-workshop.pdf');
        Route::get('inspeksi-workshop/{inspeksiWorkshop}/re-inspeksi', [InspeksiWorkshopController::class, 'reInspeksi'])->name('inspeksi-workshop.re-inspeksi');
        Route::post('inspeksi-workshop/{inspeksiWorkshop}/re-inspeksi', [InspeksiWorkshopController::class, 'storeReInspeksi'])->name('inspeksi-workshop.re-inspeksi.store');
        Route::post('inspeksi-workshop/{inspeksiWorkshop}/tolak', [InspeksiWorkshopController::class, 'tolak'])->name('inspeksi-workshop.tolak');

        // Komunikasi JSA
        Route::resource('komunikasi-jsa', KomunikasiJsaController::class)
            ->only(['index', 'create', 'store', 'show'])
            ->parameters(['komunikasi-jsa' => 'komunikasiJsa']);
        Route::get('komunikasi-jsa/{komunikasiJsa}/konfirmasi',  [KomunikasiJsaController::class, 'konfirmasi'])       ->name('komunikasi-jsa.konfirmasi');
        Route::post('komunikasi-jsa/{komunikasiJsa}/konfirmasi', [KomunikasiJsaController::class, 'storeKonfirmasi'])  ->name('komunikasi-jsa.konfirmasi.store');
        Route::post('komunikasi-jsa/{komunikasiJsa}/tolak',      [KomunikasiJsaController::class, 'tolakKonfirmasi'])  ->name('komunikasi-jsa.tolak');

        // Inspeksi Mess
        Route::resource('inspeksi-mess', InspeksiMessController::class)
            ->only(['index', 'create', 'store', 'show'])
            ->parameters(['inspeksi-mess' => 'inspeksiMess']);
        Route::get('inspeksi-mess/{inspeksiMess}/pdf', [InspeksiMessController::class, 'exportPdf'])->name('inspeksi-mess.pdf');
        Route::get('inspeksi-mess/{inspeksiMess}/re-inspeksi', [InspeksiMessController::class, 'reInspeksi'])->name('inspeksi-mess.re-inspeksi');
        Route::post('inspeksi-mess/{inspeksiMess}/re-inspeksi', [InspeksiMessController::class, 'storeReInspeksi'])->name('inspeksi-mess.re-inspeksi.store');
        Route::post('inspeksi-mess/{inspeksiMess}/tolak', [InspeksiMessController::class, 'tolak'])->name('inspeksi-mess.tolak');
    });

    // Assessment
    Route::prefix('assessment')->name('assessment.')->group(function () {
        Route::get('/', [AssessmentController::class, 'index'])->name('index');
        Route::post('/start', [AssessmentController::class, 'start'])->name('start');
        Route::get('/{session}/quiz', [AssessmentController::class, 'quiz'])->name('quiz');
        Route::post('/{session}/submit', [AssessmentController::class, 'submit'])->name('submit');
        Route::get('/{session}/result', [AssessmentController::class, 'result'])->name('result');
    });

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

        // Observasi Keselamatan monitoring
        Route::get('/observasi-keselamatan/export', [AdminController::class, 'exportObservasiKeselamatan'])->name('ok.export');
        Route::get('/observasi-keselamatan', [AdminController::class, 'observasiKeselamatan'])->name('ok');
        Route::delete('/observasi-keselamatan/{observasiKeselamatan}', [AdminController::class, 'destroyObservasiKeselamatan'])->name('ok.destroy');

        // Komunikasi JSA monitoring
        Route::get('/komunikasi-jsa/export', [AdminController::class, 'exportKomunikasiJsa'])->name('komunikasi-jsa.export');
        Route::get('/komunikasi-jsa', [AdminController::class, 'komunikasiJsa'])->name('komunikasi-jsa');
        Route::delete('/komunikasi-jsa/{komunikasiJsa}', [AdminController::class, 'destroyKomunikasiJsa'])->name('komunikasi-jsa.destroy');

        // Inspeksi monitoring
        Route::get('/inspeksi-kantor/export', [AdminController::class, 'exportInspeksiKantor'])->name('inspeksi-kantor.export');
        Route::get('/inspeksi-kantor', [AdminController::class, 'inspeksiKantor'])->name('inspeksi-kantor');
        Route::delete('/inspeksi-kantor/{inspeksiKantor}', [AdminController::class, 'destroyInspeksiKantor'])->name('inspeksi-kantor.destroy');
        Route::get('/inspeksi-tambang/export', [AdminController::class, 'exportInspeksiTambang'])->name('inspeksi-tambang.export');
        Route::get('/inspeksi-tambang', [AdminController::class, 'inspeksiTambang'])->name('inspeksi-tambang');
        Route::delete('/inspeksi-tambang/{inspeksiTambang}', [AdminController::class, 'destroyInspeksiTambang'])->name('inspeksi-tambang.destroy');
        Route::get('/inspeksi-workshop/export', [AdminController::class, 'exportInspeksiWorkshop'])->name('inspeksi-workshop.export');
        Route::get('/inspeksi-workshop', [AdminController::class, 'inspeksiWorkshop'])->name('inspeksi-workshop');
        Route::delete('/inspeksi-workshop/{inspeksiWorkshop}', [AdminController::class, 'destroyInspeksiWorkshop'])->name('inspeksi-workshop.destroy');
        Route::get('/inspeksi-mess/export', [AdminController::class, 'exportInspeksiMess'])->name('inspeksi-mess.export');
        Route::get('/inspeksi-mess', [AdminController::class, 'inspeksiMess'])->name('inspeksi-mess');
        Route::delete('/inspeksi-mess/{inspeksiMess}', [AdminController::class, 'destroyInspeksiMess'])->name('inspeksi-mess.destroy');

        // Assessment monitoring
        Route::get('/assessment', [AdminController::class, 'assessment'])->name('assessment');

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

        // Sites management
        Route::get('/sites', [SiteController::class, 'index'])->name('sites.index');
        Route::post('/sites', [SiteController::class, 'store'])->name('sites.store');
        Route::put('/sites/{site}', [SiteController::class, 'update'])->name('sites.update');
        Route::delete('/sites/{site}', [SiteController::class, 'destroy'])->name('sites.destroy');
    });
});

require __DIR__.'/settings.php';
