<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssessmentFeedback extends Model
{
    protected $table = 'assessment_feedbacks';

    public const TRAINER_DEPARTEMEN = 'HSE';

    public const SCALE_LABELS = [
        1 => 'Sangat Kurang',
        2 => 'Kurang',
        3 => 'Cukup',
        4 => 'Baik',
        5 => 'Sangat Baik',
    ];

    public const AGREEMENT_LABELS = [
        1 => 'Sangat Tidak Setuju',
        2 => 'Tidak Setuju',
        3 => 'Netral',
        4 => 'Setuju',
        5 => 'Sangat Setuju',
    ];

    public const TRAINER_ASPECTS = [
        'Materi disampaikan secara runtut dan mudah dipahami',
        'Penjelasan menggunakan bahasa yang sederhana',
        'Volume suara jelas dan mudah didengar',
        'Kecepatan berbicara sesuai sehingga mudah diikuti',
        'Trainer menguasai materi yang disampaikan',
        'Memberikan contoh kasus nyata di area kerja',
        'Menjelaskan potensi bahaya sesuai pekerjaan peserta',
        'Menghubungkan materi dengan aktivitas kerja sehari-hari',
        'Menggunakan media presentasi secara efektif',
        'Mampu menjaga perhatian peserta selama sesi',
        'Memberikan kesempatan bertanya',
        'Menjawab pertanyaan dengan jelas',
        'Melakukan interaksi dengan peserta',
        'Memberikan penekanan pada materi yang paling kritis',
        'Durasi penyampaian sesuai dan tidak terburu-buru',
    ];

    public const EFFECTIVENESS_STATEMENTS = [
        'Saya memahami tujuan induksi keselamatan.',
        'Saya memahami aturan keselamatan perusahaan.',
        'Saya memahami bahaya utama di area kerja.',
        'Saya memahami tindakan yang harus dilakukan saat kondisi darurat.',
        'Materi yang diberikan mudah diingat.',
        'Saya merasa siap bekerja dengan aman setelah mengikuti induksi.',
    ];

    protected $fillable = [
        'assessment_session_id', 'user_id', 'trainer_user_id', 'trainer_name',
        'trainer_scores', 'effectiveness_scores',
        'trainer_avg', 'effectiveness_avg', 'komentar',
    ];

    protected $casts = [
        'trainer_scores' => 'array',
        'effectiveness_scores' => 'array',
        'trainer_avg' => 'float',
        'effectiveness_avg' => 'float',
    ];

    public static function questionnaire(): array
    {
        return [
            'trainer_aspects' => self::TRAINER_ASPECTS,
            'effectiveness_statements' => self::EFFECTIVENESS_STATEMENTS,
            'scale_labels' => self::SCALE_LABELS,
            'agreement_labels' => self::AGREEMENT_LABELS,
        ];
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(AssessmentSession::class, 'assessment_session_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function trainer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'trainer_user_id');
    }

    /**
     * Karyawan departemen HSE di site peserta, sebagai pilihan pemateri.
     */
    public static function trainerOptionsFor(User $participant)
    {
        $sites = $participant->assignedSiteValues();

        return User::query()
            ->where('departemen', self::TRAINER_DEPARTEMEN)
            ->whereKeyNot($participant->id)
            ->when($sites, fn ($query) => $query->where(function ($query) use ($sites) {
                foreach ($sites as $site) {
                    $query->orWhere(fn ($q) => $q->assignedToSite($site));
                }
            }))
            ->orderBy('name')
            ->get(['id', 'name', 'nik', 'jabatan']);
    }
}
