<?php

namespace App\Http\Controllers\Admin\Assessment;

use App\Exports\AssessmentQuestionStatsExport;
use App\Exports\AssessmentSessionsExport;
use App\Http\Controllers\Admin\Concerns\ScopesToAdminSite;
use App\Http\Controllers\Controller;
use App\Models\InductionAttendance;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;

/**
 * Dasar halaman hasil assessment (Safety dan HR): ringkasan, export,
 * hapus sesi, dan sinkronisasi absensi induksi.
 */
abstract class AssessmentResultController extends Controller
{
    use ScopesToAdminSite;

    /** @return class-string<Model> */
    abstract protected function sessionModel(): string;

    /** @return class-string<Model> */
    abstract protected function sessionQuestionModel(): string;

    /** Kolom FK sesi pada tabel soal-sesi. */
    abstract protected function sessionForeignKey(): string;

    /** Tipe absensi induksi: 'safety' atau 'hr'. */
    abstract protected function inductionType(): string;

    /** Label untuk pesan toast, mis. 'assessment' atau 'HR assessment'. */
    abstract protected function label(): string;

    /** Kolom user yang dimuat untuk daftar dan export. */
    abstract protected function userColumns(): string;

    abstract protected function exportFilename(): string;

    public function export(Request $request)
    {
        $this->prepareLargeExport();

        return Excel::download(
            new AssessmentSessionsExport($this->listQuery($request), isHr: $this->inductionType() === 'hr'),
            $this->exportFilename().'-'.now()->format('Ymd').'.xlsx',
        );
    }

    public function exportQuestionStats()
    {
        $this->prepareLargeExport();

        return Excel::download(
            new AssessmentQuestionStatsExport(isHr: $this->inductionType() === 'hr'),
            'analisa-soal-'.$this->exportFilename().'-'.now()->format('Ymd').'.xlsx',
        );
    }

    public function destroy(Request $request, int $session)
    {
        $session = $this->sessionModel()::findOrFail($session);
        abort_unless($this->scopeSessionsToAdminSite($request, $this->sessionModel()::whereKey($session->id))->exists(), 403);

        $this->deleteSessions([$session->id]);

        $this->flashSuccess('Data '.$this->label().' berhasil dihapus.');

        return back();
    }

    public function batchDestroy(Request $request)
    {
        $ids = $this->scopeSessionsToAdminSite($request, $this->sessionModel()::whereIn('id', $this->validatedIds($request)))
            ->pluck('id')
            ->all();

        $this->deleteSessions($ids);

        $this->flashSuccess(count($ids).' data '.$this->label().' berhasil dihapus.');

        return back();
    }

    public function destroyRange(Request $request)
    {
        return $this->deleteRange($request, function ($from, $to) use ($request) {
            $ids = $this->scopeSessionsToAdminSite($request, $this->sessionModel()::whereBetween('completed_at', [$from, $to]))
                ->pluck('id')
                ->all();

            return $this->deleteSessions($ids);
        });
    }

    /**
     * Sesi selesai sesuai filter daftar, terbaru lebih dulu.
     */
    protected function listQuery(Request $request): Builder
    {
        $query = $this->sessionModel()::with('user:'.$this->userColumns())
            ->where('status', 'completed')
            ->latest('completed_at');

        $this->applyUserSearch($query, $request);

        if ($request->filled('passed')) {
            $query->where('passed', $request->passed === '1');
        }

        $this->applyDateFilter($query, $request, 'completed_at');

        return $query;
    }

    protected function summary(): array
    {
        $completed = fn () => $this->sessionModel()::completed();
        $totalCompleted = $completed()->count();
        $totalNonAdmin = User::where('is_admin', false)->count();

        return [
            'total' => $totalCompleted,
            'lulus' => $completed()->where('passed', true)->count(),
            'tidak_lulus' => $completed()->where('passed', false)->count(),
            'avg_score' => $totalCompleted > 0 ? round($completed()->avg('percentage'), 1) : 0,
            'coverage_pct' => $totalNonAdmin > 0
                ? round($completed()->whereHas('user', fn ($q) => $q->where('is_admin', false))->distinct('user_id')->count('user_id') / $totalNonAdmin * 100)
                : 0,
        ];
    }

    protected function monthlyTrend()
    {
        return $this->sessionModel()::completed()
            ->selectRaw($this->monthSelect('completed_at').', COUNT(*) as total, SUM(passed) as lulus')
            ->where('completed_at', '>=', now()->subMonths(5)->startOfMonth())
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->map(fn ($r) => [
                'month' => $r->month,
                'pass_rate' => $r->total > 0 ? round($r->lulus / $r->total * 100) : 0,
                'total' => (int) $r->total,
            ]);
    }

    /**
     * 10 soal yang paling sering dijawab salah. $extra menambah kolom
     * khusus jenis assessment ke setiap baris.
     */
    protected function weakQuestions(string $questionForeignKey, string $questionColumns, \Closure $extra)
    {
        return $this->sessionQuestionModel()::with('question:'.$questionColumns)
            ->selectRaw("{$questionForeignKey}, COUNT(*) as total_attempt, SUM(CASE WHEN is_correct=0 THEN 1 ELSE 0 END) as total_salah")
            ->groupBy($questionForeignKey)
            ->orderByDesc('total_salah')
            ->limit(10)
            ->get()
            ->map(fn ($r) => [
                'question_id' => $r->{$questionForeignKey},
                'question' => $r->question?->question,
                ...$extra($r),
                'total_attempt' => (int) $r->total_attempt,
                'total_salah' => (int) $r->total_salah,
                'pct_salah' => $r->total_attempt > 0 ? round($r->total_salah / $r->total_attempt * 100) : 0,
            ]);
    }

    /**
     * Karyawan non-admin yang belum menyelesaikan assessment.
     *
     * @param  list<string>  $columns
     * @param  list<string>  $orderBy
     */
    protected function uncoveredUsers(array $columns, array $orderBy)
    {
        $query = User::where('is_admin', false)
            ->whereNotIn('id', $this->sessionModel()::completed()->select('user_id')->distinct())
            ->select($columns);

        foreach ($orderBy as $column) {
            $query->orderBy($column);
        }

        return $query->get();
    }

    /**
     * Rekap absensi induksi: jumlah tercatat, catatan terbaru, dan yang belum.
     *
     * @param  list<string>  $columns
     * @param  list<string>  $orderBy
     */
    protected function attendanceSummary(array $columns, array $orderBy): array
    {
        $type = $this->inductionType();
        $totalNonAdmin = User::where('is_admin', false)->count();
        $tercatat = InductionAttendance::where('type', $type)
            ->whereHas('user', fn ($q) => $q->where('is_admin', false))
            ->distinct('user_id')
            ->count('user_id');

        $belum = User::where('is_admin', false)
            ->whereNotIn('id', InductionAttendance::where('type', $type)->select('user_id'))
            ->select($columns);

        foreach ($orderBy as $column) {
            $belum->orderBy($column);
        }

        return [
            'total_tercatat' => $tercatat,
            'belum_tercatat' => max(0, $totalNonAdmin - $tercatat),
            'records' => InductionAttendance::where('type', $type)
                ->with('user:'.implode(',', $columns))
                ->latest('attended_at')
                ->limit(50)
                ->get()
                ->map(fn ($a) => [
                    'user' => $a->user,
                    'attended_at' => $a->attended_at->toIso8601String(),
                    'session_id' => $a->assessment_session_id,
                ]),
            'belum_users' => $belum->get(),
        ];
    }

    /**
     * Hapus sesi beserta jawaban dan absensi induksinya, lalu hitung ulang
     * absensi induksi user yang terdampak.
     *
     * @param  list<int>  $ids
     */
    private function deleteSessions(array $ids): int
    {
        $type = $this->inductionType();
        $userIds = $this->sessionModel()::whereIn('id', $ids)->pluck('user_id')->unique();

        $deleted = DB::transaction(function () use ($ids, $type) {
            $this->sessionQuestionModel()::whereIn($this->sessionForeignKey(), $ids)->delete();
            InductionAttendance::where('type', $type)->whereIn('assessment_session_id', $ids)->delete();

            return $this->sessionModel()::whereIn('id', $ids)->delete();
        });

        $userIds->each(fn ($userId) => $this->syncInductionAttendance($userId));

        return $deleted;
    }

    /**
     * Absensi induksi mengikuti sesi lulus paling awal milik user.
     */
    private function syncInductionAttendance(int $userId): void
    {
        $type = $this->inductionType();
        $session = $this->sessionModel()::completed()
            ->where('user_id', $userId)
            ->where('passed', true)
            ->oldest('completed_at')
            ->first();

        if (! $session) {
            InductionAttendance::where('user_id', $userId)->where('type', $type)->delete();

            return;
        }

        InductionAttendance::updateOrCreate(
            ['user_id' => $userId, 'type' => $type],
            [
                'assessment_session_id' => $session->id,
                'assessment_session_type' => $type,
                'attended_at' => $session->completed_at,
            ],
        );
    }

    /**
     * Batasi query sesi ke user di site admin (jika admin terikat site).
     */
    private function scopeSessionsToAdminSite(Request $request, Builder $query): Builder
    {
        if ($adminSite = $request->user()->site) {
            $query->whereHas('user', fn ($q) => $q->assignedToSite($adminSite));
        }

        return $query;
    }
}
