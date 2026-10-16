<?php

use App\Http\Controllers\Admin\Assessment\HrAssessmentController as AdminHrAssessmentController;
use App\Http\Controllers\Admin\Assessment\SafetyAssessmentController as AdminSafetyAssessmentController;
use App\Http\Controllers\Admin\BugarSelamatController as AdminBugarSelamatController;
use App\Http\Controllers\Admin\InductionAttendanceController as AdminInductionAttendanceController;
use App\Http\Controllers\Admin\Inspeksi\InspeksiKantorController as AdminInspeksiKantorController;
use App\Http\Controllers\Admin\Inspeksi\InspeksiMessController as AdminInspeksiMessController;
use App\Http\Controllers\Admin\Inspeksi\InspeksiTambangController as AdminInspeksiTambangController;
use App\Http\Controllers\Admin\Inspeksi\InspeksiWorkshopController as AdminInspeksiWorkshopController;
use App\Http\Controllers\Admin\KomunikasiJsaController as AdminKomunikasiJsaController;
use App\Http\Controllers\Admin\LaporanBahayaController as AdminLaporanBahayaController;
use App\Http\Controllers\Admin\ObservasiKeselamatanController as AdminObservasiKeselamatanController;
use App\Http\Controllers\Admin\TargetController as AdminTargetController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\AssessmentController;
use App\Http\Controllers\AssessmentFeedbackController;
use App\Http\Controllers\AssessmentQuestionController;
use App\Http\Controllers\BugarSelamatController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HrAssessmentController;
use App\Http\Controllers\HrAssessmentQuestionController;
use App\Http\Controllers\InboxController;
use App\Http\Controllers\InspeksiController;
use App\Http\Controllers\InspeksiKantorController;
use App\Http\Controllers\InspeksiMessController;
use App\Http\Controllers\InspeksiTambangController;
use App\Http\Controllers\InspeksiWorkshopController;
use App\Http\Controllers\K3Controller;
use App\Http\Controllers\KomunikasiJsaController;
use App\Http\Controllers\LaporanBahayaController;
use App\Http\Controllers\ModuleController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ObservasiKeselamatanController;
use App\Http\Controllers\PushSubscriptionController;
use App\Http\Controllers\SiteController;
use App\Http\Controllers\Teams\TeamInvitationController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/login');

Route::middleware(['auth'])->group(function () {
    Route::get('/home', [DashboardController::class, 'index'])->name('app.home');
    Route::get('/modules', [ModuleController::class, 'index'])->name('modules.index');
    Route::get('/inbox', [InboxController::class, 'index'])->name('inbox.index');
    Route::get('/k3', [K3Controller::class, 'index'])->name('k3.index');
    Route::get('invitations/{invitation}/accept', [TeamInvitationController::class, 'accept'])->name('invitations.accept');

    // Bugar Selamat
    Route::resource('bugar-selamat', BugarSelamatController::class)->only(['index', 'create', 'store', 'show']);
    Route::get('bugar-selamat/{bugarSelamat}/pdf', [BugarSelamatController::class, 'exportPdf'])->name('bugar-selamat.pdf');

    // Laporan Bahaya
    Route::resource('laporan-bahaya', LaporanBahayaController::class)->only(['index', 'create', 'store', 'show']);
    Route::get('laporan-bahaya/{laporanBahaya}/pdf', [LaporanBahayaController::class, 'exportPdf'])->name('laporan-bahaya.pdf');
    Route::post('laporan-bahaya/{laporanBahaya}/review', [LaporanBahayaController::class, 'submitReview'])->name('laporan-bahaya.review');

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

        // Daftar gabungan semua jenis inspeksi
        Route::get('inspeksi', [InspeksiController::class, 'index'])->name('inspeksi.index');

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
        Route::get('komunikasi-jsa/{komunikasiJsa}/konfirmasi', [KomunikasiJsaController::class, 'konfirmasi'])->name('komunikasi-jsa.konfirmasi');
        Route::post('komunikasi-jsa/{komunikasiJsa}/konfirmasi', [KomunikasiJsaController::class, 'storeKonfirmasi'])->name('komunikasi-jsa.konfirmasi.store');
        Route::post('komunikasi-jsa/{komunikasiJsa}/tolak', [KomunikasiJsaController::class, 'tolakKonfirmasi'])->name('komunikasi-jsa.tolak');

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
        Route::get('/{session}/feedback', [AssessmentFeedbackController::class, 'create'])->name('feedback');
        Route::post('/{session}/feedback', [AssessmentFeedbackController::class, 'store'])->name('feedback.store');
        Route::get('/{session}/result', [AssessmentController::class, 'result'])->name('result');
    });

    // HR Assessment
    Route::prefix('hr-assessment')->name('hr-assessment.')->group(function () {
        Route::get('/', [HrAssessmentController::class, 'index'])->name('index');
        Route::post('/start', [HrAssessmentController::class, 'start'])->name('start');
        Route::get('/{session}/quiz', [HrAssessmentController::class, 'quiz'])->name('quiz');
        Route::post('/{session}/submit', [HrAssessmentController::class, 'submit'])->name('submit');
        Route::get('/{session}/result', [HrAssessmentController::class, 'result'])->name('result');
    });

    // Notifications
    Route::post('notifications/mark-all-read', [NotificationController::class, 'markAllRead'])->name('notifications.mark-all-read');
    Route::delete('notifications/clear-all', [NotificationController::class, 'clearAll'])->name('notifications.clear-all');
    Route::post('notifications/{id}/read', [NotificationController::class, 'markRead'])->name('notifications.read');

    // Push Subscriptions (Web Push / VAPID)
    Route::post('push-subscription', [PushSubscriptionController::class, 'store'])->name('push-subscription.store');
    Route::delete('push-subscription', [PushSubscriptionController::class, 'destroy'])->name('push-subscription.destroy');

    // Admin
    Route::middleware(['admin'])->prefix('admin')->name('admin.')->group(function () {
        Route::get('/', fn () => redirect()->route('app.home'))->name('index');

        // Monitoring data per site: daftar, export, hapus satu/batch/rentang
        $siteRecords = [
            'bugar-selamat' => ['bugar-selamat', AdminBugarSelamatController::class],
            'laporan-bahaya' => ['laporan-bahaya', AdminLaporanBahayaController::class],
            'observasi-keselamatan' => ['ok', AdminObservasiKeselamatanController::class],
            'komunikasi-jsa' => ['komunikasi-jsa', AdminKomunikasiJsaController::class],
            'inspeksi-kantor' => ['inspeksi-kantor', AdminInspeksiKantorController::class],
            'inspeksi-tambang' => ['inspeksi-tambang', AdminInspeksiTambangController::class],
            'inspeksi-workshop' => ['inspeksi-workshop', AdminInspeksiWorkshopController::class],
            'inspeksi-mess' => ['inspeksi-mess', AdminInspeksiMessController::class],
        ];

        foreach ($siteRecords as $path => [$name, $controller]) {
            Route::get("/{$path}/export", [$controller, 'export'])->name("{$name}.export");
            Route::get("/{$path}", [$controller, 'index'])->name($name);
            Route::delete("/{$path}/batch", [$controller, 'batchDestroy'])->name("{$name}.batch-destroy");
            Route::post("/{$path}/delete-range", [$controller, 'destroyRange'])->name("{$name}.delete-range");
            Route::delete("/{$path}/{record}", [$controller, 'destroy'])->whereNumber('record')->name("{$name}.destroy");
        }

        Route::patch('/laporan-bahaya/{laporanBahaya}/status', [AdminLaporanBahayaController::class, 'updateStatus'])->name('laporan-bahaya.update-status');

        // Assessment monitoring
        Route::get('/assessment', [AdminSafetyAssessmentController::class, 'index'])->name('assessment');
        Route::get('/assessment/export', [AdminSafetyAssessmentController::class, 'export'])->name('assessment.export');
        Route::get('/assessment/feedback', [AssessmentFeedbackController::class, 'adminIndex'])->name('assessment.feedback');
        Route::get('/assessment/feedback/export', [AssessmentFeedbackController::class, 'export'])->name('assessment.feedback.export');
        Route::get('/assessment/export-soal', [AdminSafetyAssessmentController::class, 'exportQuestionStats'])->name('assessment.export-soal');
        Route::delete('/assessment/batch', [AdminSafetyAssessmentController::class, 'batchDestroy'])->name('assessment.batch-destroy');
        Route::post('/assessment/delete-range', [AdminSafetyAssessmentController::class, 'destroyRange'])->name('assessment.delete-range');

        // Bank soal - Assessment Safety
        Route::get('/assessment/questions', [AssessmentQuestionController::class, 'index'])->name('assessment.questions.index');
        Route::post('/assessment/questions', [AssessmentQuestionController::class, 'store'])->name('assessment.questions.store');
        Route::get('/assessment/questions/export', [AssessmentQuestionController::class, 'export'])->name('assessment.questions.export');
        Route::get('/assessment/questions/import-template', [AssessmentQuestionController::class, 'importTemplate'])->name('assessment.questions.import-template');
        Route::post('/assessment/questions/import', [AssessmentQuestionController::class, 'import'])->name('assessment.questions.import');
        Route::delete('/assessment/questions/batch', [AssessmentQuestionController::class, 'batchDestroy'])->name('assessment.questions.batch-destroy');
        Route::put('/assessment/questions/{assessmentQuestion}', [AssessmentQuestionController::class, 'update'])->name('assessment.questions.update');
        Route::delete('/assessment/questions/{assessmentQuestion}', [AssessmentQuestionController::class, 'destroy'])->name('assessment.questions.destroy');

        Route::delete('/assessment/{session}', [AdminSafetyAssessmentController::class, 'destroy'])->whereNumber('session')->name('assessment.destroy');
        Route::get('/hr-assessment', [AdminHrAssessmentController::class, 'index'])->name('hr-assessment');
        Route::get('/hr-assessment/export', [AdminHrAssessmentController::class, 'export'])->name('hr-assessment.export');
        Route::get('/hr-assessment/export-soal', [AdminHrAssessmentController::class, 'exportQuestionStats'])->name('hr-assessment.export-soal');
        Route::delete('/hr-assessment/batch', [AdminHrAssessmentController::class, 'batchDestroy'])->name('hr-assessment.batch-destroy');
        Route::post('/hr-assessment/delete-range', [AdminHrAssessmentController::class, 'destroyRange'])->name('hr-assessment.delete-range');

        // Bank soal - HR Assessment
        Route::get('/hr-assessment/questions', [HrAssessmentQuestionController::class, 'index'])->name('hr-assessment.questions.index');
        Route::post('/hr-assessment/questions', [HrAssessmentQuestionController::class, 'store'])->name('hr-assessment.questions.store');
        Route::get('/hr-assessment/questions/export', [HrAssessmentQuestionController::class, 'export'])->name('hr-assessment.questions.export');
        Route::get('/hr-assessment/questions/import-template', [HrAssessmentQuestionController::class, 'importTemplate'])->name('hr-assessment.questions.import-template');
        Route::post('/hr-assessment/questions/import', [HrAssessmentQuestionController::class, 'import'])->name('hr-assessment.questions.import');
        Route::delete('/hr-assessment/questions/batch', [HrAssessmentQuestionController::class, 'batchDestroy'])->name('hr-assessment.questions.batch-destroy');
        Route::put('/hr-assessment/questions/{hrAssessmentQuestion}', [HrAssessmentQuestionController::class, 'update'])->name('hr-assessment.questions.update');
        Route::delete('/hr-assessment/questions/{hrAssessmentQuestion}', [HrAssessmentQuestionController::class, 'destroy'])->name('hr-assessment.questions.destroy');
        Route::delete('/hr-assessment/{session}', [AdminHrAssessmentController::class, 'destroy'])->whereNumber('session')->name('hr-assessment.destroy');
        Route::get('/induction-attendance/export/{type}', [AdminInductionAttendanceController::class, 'export'])
            ->name('induction-attendance.export')
            ->where('type', 'safety|hr');

        // Targets
        Route::get('/targets', [AdminTargetController::class, 'index'])->name('targets');
        Route::patch('/targets/{level}', [AdminTargetController::class, 'update'])->name('targets.update');

        // User management
        Route::get('/users/export', [AdminUserController::class, 'exportUsers'])->name('users.export');
        Route::get('/users/import-template', [AdminUserController::class, 'importTemplate'])->name('users.import-template');
        Route::post('/users/import', [AdminUserController::class, 'importUsers'])->name('users.import');
        Route::post('/users', [AdminUserController::class, 'storeUser'])->name('users.store');
        Route::put('/users/{user}', [AdminUserController::class, 'updateUser'])->name('users.update');
        Route::delete('/users/{user}', [AdminUserController::class, 'destroyUser'])->name('users.destroy');
        Route::get('/users', [AdminUserController::class, 'users'])->name('users');
        Route::patch('/users/{user}/level', [AdminUserController::class, 'updateUserLevel'])->name('users.update-level');

        // Sites management
        Route::get('/sites', [SiteController::class, 'index'])->name('sites.index');
        Route::post('/sites', [SiteController::class, 'store'])->name('sites.store');
        Route::put('/sites/{site}', [SiteController::class, 'update'])->name('sites.update');
        Route::delete('/sites/{site}', [SiteController::class, 'destroy'])->name('sites.destroy');
    });
});

require __DIR__.'/settings.php';
