<?php

use App\Models\AssessmentSession;
use App\Models\AssessmentSessionQuestion;
use App\Models\InductionAttendance;
use App\Models\Site;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Site::create(['value' => 'BAU', 'label' => 'PT. WBK Site BAU']);
    Site::create(['value' => 'MAS', 'label' => 'PT. WBK Site MAS']);
});

function userPayload(array $overrides = []): array
{
    return array_merge([
        'name' => 'Andi',
        'nik' => 'NIK-'.uniqid(),
        'participation_level' => 'nonstaff',
        'site' => 'BAU',
        'is_admin' => false,
    ], $overrides);
}

function inProgressSession(User $user, array $correctAnswers): AssessmentSession
{
    $session = AssessmentSession::create([
        'user_id' => $user->id, 'departemen' => 'Production', 'tags' => 'NS',
        'status' => 'in_progress', 'total_questions' => count($correctAnswers),
        'started_at' => now(),
    ]);

    foreach ($correctAnswers as $i => $benar) {
        AssessmentSessionQuestion::create([
            'assessment_session_id' => $session->id,
            'urutan' => $i + 1,
            'question_snapshot' => "Soal {$i}",
            'jawaban_1_snapshot' => 'A', 'jawaban_2_snapshot' => 'B',
            'jawaban_3_snapshot' => 'C', 'jawaban_4_snapshot' => 'D',
            'jawaban_benar_snapshot' => $benar,
        ]);
    }

    return $session;
}

// ── User management admin terikat site ────────────────────────────────────

test('admin site tidak bisa menjadikan dirinya admin global', function () {
    $admin = User::factory()->create(['is_admin' => true, 'site' => 'BAU']);

    $this->actingAs($admin)
        ->put("/admin/users/{$admin->id}", userPayload(['nik' => $admin->nik, 'site' => null, 'is_admin' => true]))
        ->assertRedirect();

    expect($admin->fresh()->site)->toBe('BAU');
});

test('admin site tidak bisa mengelola user site lain atau admin global', function () {
    $admin = User::factory()->create(['is_admin' => true, 'site' => 'BAU']);
    $other = User::factory()->create(['site' => 'MAS']);
    $global = User::factory()->create(['is_admin' => true, 'site' => null]);

    foreach ([$other, $global] as $target) {
        $this->actingAs($admin)->put("/admin/users/{$target->id}", userPayload(['nik' => $target->nik]))->assertForbidden();
        $this->actingAs($admin)->patch("/admin/users/{$target->id}/level", ['participation_level' => 'staff'])->assertForbidden();
        $this->actingAs($admin)->delete("/admin/users/{$target->id}")->assertForbidden();
    }

    expect(User::whereKey([$other->id, $global->id])->count())->toBe(2);
});

test('admin site tidak bisa memberi status admin ke user di site-nya', function () {
    $admin = User::factory()->create(['is_admin' => true, 'site' => 'BAU']);
    $own = User::factory()->create(['site' => 'BAU']);

    $this->actingAs($admin)
        ->put("/admin/users/{$own->id}", userPayload(['nik' => $own->nik, 'is_admin' => true, 'site' => 'MAS']))
        ->assertRedirect();

    expect($own->fresh())->is_admin->toBeFalse()->site->toBe('BAU');
});

test('user baru dari admin site selalu non-admin di site admin', function () {
    $admin = User::factory()->create(['is_admin' => true, 'site' => 'BAU']);

    $this->actingAs($admin)
        ->post('/admin/users', userPayload([
            'nik' => 'NEW-1', 'site' => 'MAS', 'is_admin' => true,
            'password' => 'password123', 'password_confirmation' => 'password123',
        ]))
        ->assertRedirect();

    expect(User::firstWhere('nik', 'NEW-1'))->is_admin->toBeFalse()->site->toBe('BAU');
});

test('import pengguna hanya untuk admin global', function () {
    $admin = User::factory()->create(['is_admin' => true, 'site' => 'BAU']);

    $this->actingAs($admin)
        ->post('/admin/users/import', ['file' => UploadedFile::fake()->create('users.xlsx', 10)])
        ->assertForbidden();
});

test('admin global tetap bisa mengelola user site mana pun', function () {
    $global = User::factory()->create(['is_admin' => true, 'site' => null]);
    $user = User::factory()->create(['site' => 'MAS']);

    $this->actingAs($global)
        ->put("/admin/users/{$user->id}", userPayload(['nik' => $user->nik, 'site' => 'BAU', 'is_admin' => true]))
        ->assertRedirect();

    expect($user->fresh())->is_admin->toBeTrue()->site->toBe('BAU');
});

// ── Hapus assessment dibatasi site ────────────────────────────────────────

test('admin site hanya menghapus assessment user site-nya', function () {
    $admin = User::factory()->create(['is_admin' => true, 'site' => 'BAU']);
    $own = completedSafetySession(User::factory()->create(['site' => 'BAU']));
    $other = completedSafetySession(User::factory()->create(['site' => 'MAS']));

    $this->actingAs($admin)->delete("/admin/assessment/{$other->id}")->assertForbidden();

    $this->actingAs($admin)
        ->delete('/admin/assessment/batch', ['ids' => [$own->id, $other->id]])
        ->assertRedirect();

    expect(AssessmentSession::find($own->id))->toBeNull()
        ->and(AssessmentSession::find($other->id))->not->toBeNull();

    $this->actingAs($admin)
        ->post('/admin/assessment/delete-range', [
            'date_from' => today()->subDay()->toDateString(),
            'date_to' => today()->toDateString(),
            'password' => 'password',
        ])
        ->assertRedirect();

    expect(AssessmentSession::find($other->id))->not->toBeNull();
});

// ── Upload lampiran review ────────────────────────────────────────────────

test('lampiran review menolak skrip dan menyimpan ekstensi sesuai isi file', function () {
    Storage::fake('public');
    $reporter = User::factory()->create(['site' => 'BAU']);
    $pic = User::factory()->create(['site' => 'BAU', 'participation_level' => 'staff']);
    $laporan = laporanAt('BAU', ['user_id' => $reporter->id, 'pic_user_id' => $pic->id, 'status_tindakan' => 'pending']);

    $this->actingAs($pic)
        ->post("/laporan-bahaya/{$laporan->id}/review", [
            'status_tindakan' => 'progress',
            'attachments' => [UploadedFile::fake()->image('shell.php')],
        ])
        ->assertSessionHasErrors('attachments.0');

    $this->actingAs($pic)
        ->post("/laporan-bahaya/{$laporan->id}/review", [
            'status_tindakan' => 'progress',
            'attachments' => [UploadedFile::fake()->image('foto.png')],
        ])
        ->assertSessionHasNoErrors();

    $path = $laporan->reviews()->first()->attachment_paths[0];
    expect($path)->toEndWith('.png');
    Storage::disk('public')->assertExists($path);
});

test('PIC bisa export PDF laporan yang ditugaskan', function () {
    $pic = User::factory()->create(['site' => 'BAU', 'participation_level' => 'staff']);
    $laporan = laporanAt('BAU', ['pic_user_id' => $pic->id]);

    $this->actingAs($pic)->get("/laporan-bahaya/{$laporan->id}/pdf")->assertOk();
    $this->actingAs(User::factory()->create())->get("/laporan-bahaya/{$laporan->id}/pdf")->assertForbidden();
});

// ── Penilaian assessment ──────────────────────────────────────────────────

test('submit assessment menilai sekali dan mencatat kehadiran saat lulus', function () {
    $user = User::factory()->create(['departemen' => 'Production']);
    $session = inProgressSession($user, [1, 2, 3, 4, 1]);
    $ids = $session->sessionQuestions->pluck('id')->all();

    $this->actingAs($user)
        ->post(route('assessment.submit', $session), ['answers' => array_combine($ids, [1, 2, 3, 4, 2])])
        ->assertRedirect(route('assessment.result', $session));

    $session->refresh();
    expect($session)->status->toBe('completed')->score->toBe(4)->passed->toBeTrue();
    expect(InductionAttendance::where('user_id', $user->id)->where('type', 'safety')->count())->toBe(1);

    // Penilaian ulang (mis. auto-expire setelah submit) tidak mengubah hasil.
    $session->grade(array_fill_keys($ids, 1));
    expect($session->fresh()->score)->toBe(4);
});

test('auto expire menilai jawaban yang tersimpan', function () {
    $user = User::factory()->create(['departemen' => 'Production']);
    $session = inProgressSession($user, [1, 2]);
    $session->sessionQuestions->first()->update(['jawaban_user' => 1]);

    $session->autoExpire();

    expect($session)->status->toBe('completed')->score->toBe(1)->passed->toBeFalse();
});
