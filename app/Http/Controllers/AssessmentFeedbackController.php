<?php

namespace App\Http\Controllers;

use App\Exports\AssessmentFeedbackExport;
use App\Models\AssessmentFeedback;
use App\Models\AssessmentSession;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class AssessmentFeedbackController extends Controller
{
    public function create(AssessmentSession $session)
    {
        abort_unless($session->user_id === Auth::id(), 403);
        abort_unless($session->status === 'completed', 403);

        if ($session->feedback()->exists()) {
            return redirect()->route('assessment.result', $session);
        }

        return Inertia::render('assessment/feedback', [
            'session_id' => $session->id,
            'questionnaire' => AssessmentFeedback::questionnaire(),
            'trainer_options' => AssessmentFeedback::trainerOptionsFor(Auth::user()),
        ]);
    }

    public function store(Request $request, AssessmentSession $session)
    {
        abort_unless($session->user_id === Auth::id(), 403);
        abort_unless($session->status === 'completed', 403);

        if ($session->feedback()->exists()) {
            return redirect()->route('assessment.result', $session);
        }

        $trainerCount = count(AssessmentFeedback::TRAINER_ASPECTS);
        $effectivenessCount = count(AssessmentFeedback::EFFECTIVENESS_STATEMENTS);

        $trainers = AssessmentFeedback::trainerOptionsFor(Auth::user())->keyBy('id');

        $data = $request->validate([
            'trainer_user_id' => ['required', 'integer', Rule::in($trainers->keys())],
            'trainer_scores' => ['required', 'array', "size:{$trainerCount}"],
            'trainer_scores.*' => ['required', 'integer', 'between:1,5'],
            'effectiveness_scores' => ['required', 'array', "size:{$effectivenessCount}"],
            'effectiveness_scores.*' => ['required', 'integer', 'between:1,5'],
            'komentar' => ['nullable', 'string', 'max:2000'],
        ], [
            'trainer_user_id.required' => 'Pemateri wajib dipilih.',
            'trainer_user_id.in' => 'Pemateri tidak valid untuk site Anda.',
            'trainer_scores.*.required' => 'Semua aspek penilaian pemateri wajib diisi.',
            'effectiveness_scores.*.required' => 'Semua pernyataan efektivitas wajib diisi.',
        ]);

        $trainerScores = array_map('intval', array_values($data['trainer_scores']));
        $effectivenessScores = array_map('intval', array_values($data['effectiveness_scores']));

        AssessmentFeedback::create([
            'assessment_session_id' => $session->id,
            'user_id' => $session->user_id,
            'trainer_user_id' => $data['trainer_user_id'],
            'trainer_name' => $trainers[$data['trainer_user_id']]->name,
            'trainer_scores' => $trainerScores,
            'effectiveness_scores' => $effectivenessScores,
            'trainer_avg' => round(array_sum($trainerScores) / $trainerCount, 2),
            'effectiveness_avg' => round(array_sum($effectivenessScores) / $effectivenessCount, 2),
            'komentar' => $data['komentar'] ?? null,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Terima kasih atas penilaian Anda!']);

        return redirect()->route('assessment.result', $session);
    }

    public function adminIndex(Request $request)
    {
        // Agregasi dihitung di database agar tidak memuat semua baris ke memori.
        $base = fn () => $this->filteredQuery($request)->reorder()->setEagerLoads([]);

        $totals = $base()
            ->selectRaw('COUNT(*) as total, AVG(trainer_avg) as trainer_avg, AVG(effectiveness_avg) as effectiveness_avg')
            ->toBase()
            ->first();
        $count = (int) $totals->total;

        $aspectAverages = function (string $column, array $labels) use ($base, $count) {
            $selects = collect($labels)->keys()
                ->map(fn ($i) => "AVG(JSON_EXTRACT({$column}, '$[{$i}]')) as a{$i}")
                ->join(', ');
            $row = $count > 0 ? $base()->selectRaw($selects)->toBase()->first() : null;

            return collect($labels)->map(fn ($label, $i) => [
                'label' => $label,
                'avg' => $row ? round((float) $row->{"a{$i}"}, 2) : 0,
            ])->values();
        };

        $trainerStats = $base()
            ->selectRaw('trainer_name, COUNT(*) as total, AVG(trainer_avg) as trainer_avg, AVG(effectiveness_avg) as effectiveness_avg')
            ->groupBy('trainer_name')
            ->orderByDesc('trainer_avg')
            ->toBase()
            ->get()
            ->map(fn ($r) => [
                'trainer_name' => $r->trainer_name,
                'total' => (int) $r->total,
                'trainer_avg' => round((float) $r->trainer_avg, 2),
                'effectiveness_avg' => round((float) $r->effectiveness_avg, 2),
            ]);

        return Inertia::render('admin/assessment-feedback', [
            'records' => $this->filteredQuery($request)->paginate(20)->withQueryString(),
            'filters' => $request->only('search', 'trainer', 'date_from', 'date_to'),
            'summary' => [
                'total' => $count,
                'trainer_avg' => round((float) $totals->trainer_avg, 2),
                'effectiveness_avg' => round((float) $totals->effectiveness_avg, 2),
            ],
            'trainer_aspects' => $aspectAverages('trainer_scores', AssessmentFeedback::TRAINER_ASPECTS),
            'effectiveness_aspects' => $aspectAverages('effectiveness_scores', AssessmentFeedback::EFFECTIVENESS_STATEMENTS),
            'trainer_stats' => $trainerStats,
            'trainers' => $this->trainerNames(),
        ]);
    }

    public function export(Request $request)
    {
        ini_set('memory_limit', '512M');
        set_time_limit(300);

        return Excel::download(
            new AssessmentFeedbackExport($this->filteredQuery($request)),
            'lembar-penilaian-induksi-safety-'.now()->format('Ymd-His').'.xlsx'
        );
    }

    private function trainerNames()
    {
        return AssessmentFeedback::query()
            ->select('trainer_name')
            ->distinct()
            ->orderBy('trainer_name')
            ->pluck('trainer_name');
    }

    private function filteredQuery(Request $request): Builder
    {
        $query = AssessmentFeedback::with([
            'user:id,name,nik,jabatan,departemen,site',
            'session:id,percentage,passed,completed_at',
        ])->latest();

        if ($request->filled('search')) {
            $query->whereHas('user', fn ($q) => $q->where('name', 'like', "%{$request->search}%")
                ->orWhere('nik', 'like', "%{$request->search}%"));
        }

        if ($request->filled('trainer')) {
            $query->where('trainer_name', $request->trainer);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        return $query;
    }
}
