<?php

use App\Exports\BugarSelamatExport;
use App\Models\BugarSelamat;
use App\Models\User;
use Illuminate\Support\Carbon;
use Maatwebsite\Excel\Facades\Excel;

function bugarSubmittedAt(User $user, string $tanggal, string $submittedAt): BugarSelamat
{
    $record = BugarSelamat::create([
        'user_id' => $user->id, 'tanggal' => $tanggal, 'shift' => 'Pagi', 'hari_ke' => 1,
        'jam_tidur' => '>6', 'status_kelayakan' => 'layak',
    ]);
    $record->forceFill(['created_at' => Carbon::parse($submittedAt)])->saveQuietly();

    return $record;
}

beforeEach(function () {
    Carbon::setTestNow('2026-10-01 15:00:00');
    $this->admin = User::factory()->create(['is_admin' => true, 'site' => null]);
    $this->worker = User::factory()->create();
});

afterEach(fn () => Carbon::setTestNow());

test('export filters by submit date and puts backdated forms at the bottom', function () {
    Excel::fake();

    $older = bugarSubmittedAt($this->worker, '2026-09-30', '2026-10-01 07:00:00');
    $backdated = bugarSubmittedAt($this->worker, '2026-09-20', '2026-10-01 14:00:00');
    bugarSubmittedAt($this->worker, '2026-10-01', '2026-09-29 08:00:00'); // submit di luar rentang

    $this->actingAs($this->admin)
        ->get('/admin/bugar-selamat/export?date_from=2026-10-01&date_to=2026-10-01')
        ->assertOk();

    Excel::assertDownloaded('bugar-selamat-2026-10-01.xlsx', function (BugarSelamatExport $export) use ($older, $backdated) {
        $ids = $export->query()->pluck('id')->all();

        return $ids === [$older->id, $backdated->id];
    });
});

test('export rows include the submit time next to the form date', function () {
    $record = bugarSubmittedAt($this->worker, '2026-09-20', '2026-10-01 14:05:00');
    $export = new BugarSelamatExport(BugarSelamat::with('user'));

    $headings = $export->headings();
    $row = $export->map($record->load('user'));
    $tanggalIndex = array_search('Tanggal', $headings);

    expect($headings[$tanggalIndex + 1])->toBe('Waktu Submit')
        ->and($row[$tanggalIndex])->toBe('20/09/2026')
        ->and($row[$tanggalIndex + 1])->toBe('01/10/2026 14:05');
});

test('admin monitoring list uses submit date for filter and newest submit first', function () {
    $older = bugarSubmittedAt($this->worker, '2026-09-30', '2026-10-01 07:00:00');
    $backdated = bugarSubmittedAt($this->worker, '2026-09-20', '2026-10-01 14:00:00');

    $this->actingAs($this->admin)
        ->get('/admin/bugar-selamat?view=daftar&periode=hari_ini')
        ->assertInertia(fn ($page) => $page
            ->has('records.data', 2)
            ->where('records.data.0.id', $backdated->id)
            ->where('records.data.1.id', $older->id));
});
