import { Head, useForm } from '@inertiajs/react';
import { ClipboardList, Send, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type Questionnaire = {
    trainer_aspects: string[];
    effectiveness_statements: string[];
    scale_labels: Record<string, string>;
    agreement_labels: Record<string, string>;
};

type Props = {
    session_id: number;
    questionnaire: Questionnaire;
    trainer_options: {
        id: number;
        name: string;
        nik: string | null;
        jabatan: string | null;
    }[];
};

type FormData = {
    trainer_user_id: string;
    trainer_scores: (number | null)[];
    effectiveness_scores: (number | null)[];
    komentar: string;
};

const SCALE = [1, 2, 3, 4, 5];

function ScaleRow({
    no,
    text,
    value,
    labels,
    onChange,
}: {
    no: number;
    text: string;
    value: number | null;
    labels: Record<string, string>;
    onChange: (v: number) => void;
}) {
    return (
        <div
            className={cn(
                'space-y-2.5 rounded-xl border p-3.5 transition-colors',
                value === null ? 'bg-card' : 'border-info/30 bg-info-soft',
            )}
        >
            <p className="text-sm leading-snug">
                <span className="mr-1.5 font-semibold text-muted-foreground">
                    {no}.
                </span>
                {text}
            </p>
            <div className="grid grid-cols-5 gap-1.5">
                {SCALE.map((n) => (
                    <button
                        key={n}
                        type="button"
                        onClick={() => onChange(n)}
                        title={labels[n]}
                        className={cn(
                            'flex flex-col items-center justify-center rounded-lg border py-2 text-sm font-bold transition-all',
                            value === n
                                ? 'border-info/60 bg-info text-white shadow-sm'
                                : 'hover:border-info/60 hover:bg-info-soft',
                        )}
                    >
                        {n}
                        <span
                            className={cn(
                                'mt-0.5 px-0.5 text-center text-[11px] leading-tight font-normal',
                                value === n
                                    ? 'text-info'
                                    : 'text-muted-foreground',
                            )}
                        >
                            {labels[n]}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}

export default function AssessmentFeedback({
    session_id,
    questionnaire,
    trainer_options,
}: Props) {
    const {
        trainer_aspects,
        effectiveness_statements,
        scale_labels,
        agreement_labels,
    } = questionnaire;

    const { data, setData, post, processing, errors } = useForm<FormData>({
        trainer_user_id: '',
        trainer_scores: trainer_aspects.map(() => null),
        effectiveness_scores: effectiveness_statements.map(() => null),
        komentar: '',
    });

    const answered =
        data.trainer_scores.filter((v) => v !== null).length +
        data.effectiveness_scores.filter((v) => v !== null).length;
    const totalItems = trainer_aspects.length + effectiveness_statements.length;
    const complete = answered === totalItems && data.trainer_user_id !== '';

    const setScore = (
        key: 'trainer_scores' | 'effectiveness_scores',
        index: number,
        value: number,
    ) => {
        const next = [...data[key]];
        next[index] = value;
        setData(key, next);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/assessment/${session_id}/feedback`, { preserveScroll: true });
    };

    const errorMessages = Object.values(errors).filter(
        (v, i, arr) => arr.indexOf(v) === i,
    );

    return (
        <>
            <Head title="Lembar Penilaian Induksi" />

            <form
                onSubmit={handleSubmit}
                className="mx-auto max-w-xl space-y-5 px-4 py-5"
            >
                <div className="space-y-1.5 rounded-2xl bg-gradient-to-br from-info-soft to-info-soft px-5 py-5 text-white shadow-lg">
                    <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-info uppercase">
                        <ClipboardList className="h-3.5 w-3.5" />
                        Lembar Penilaian
                    </div>
                    <h1 className="text-xl font-bold">
                        Penilaian Induksi Safety
                    </h1>
                    <p className="text-sm text-info">
                        Isi penilaian berikut untuk melihat hasil assessment
                        Anda. Jawaban Anda membantu kami meningkatkan kualitas
                        induksi.
                    </p>
                    <div className="pt-2">
                        <div className="h-1.5 overflow-hidden rounded-full bg-white/25">
                            <div
                                className="h-full bg-white transition-all"
                                style={{
                                    width: `${(answered / totalItems) * 100}%`,
                                }}
                            />
                        </div>
                        <p className="mt-1 text-xs text-info">
                            {answered} / {totalItems} pertanyaan terjawab
                        </p>
                    </div>
                </div>

                {/* Pemateri */}
                <section className="space-y-3">
                    <h2 className="flex items-center gap-2 font-semibold">
                        <Star className="h-4 w-4 text-info" />
                        1. Penilaian Pemateri
                    </h2>
                    <div className="space-y-1.5">
                        <Label htmlFor="trainer_user_id">
                            Nama Pemateri{' '}
                            <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={data.trainer_user_id}
                            onValueChange={(v) => setData('trainer_user_id', v)}
                            disabled={trainer_options.length === 0}
                        >
                            <SelectTrigger
                                id="trainer_user_id"
                                className="w-full"
                            >
                                <SelectValue placeholder="Pilih pemateri (HSE)" />
                            </SelectTrigger>
                            <SelectContent>
                                {trainer_options.map((t) => (
                                    <SelectItem key={t.id} value={String(t.id)}>
                                        {t.name}
                                        {t.jabatan ? ` — ${t.jabatan}` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {trainer_options.length === 0 && (
                            <p className="text-sm text-warning">
                                Belum ada karyawan HSE terdaftar di site Anda.
                                Hubungi admin HSE.
                            </p>
                        )}
                        {errors.trainer_user_id && (
                            <p className="text-sm text-destructive">
                                {errors.trainer_user_id}
                            </p>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Skala: 1 = Sangat Kurang · 5 = Sangat Baik
                    </p>
                    {trainer_aspects.map((text, i) => (
                        <ScaleRow
                            key={i}
                            no={i + 1}
                            text={text}
                            value={data.trainer_scores[i]}
                            labels={scale_labels}
                            onChange={(v) => setScore('trainer_scores', i, v)}
                        />
                    ))}
                </section>

                {/* Efektivitas */}
                <section className="space-y-3">
                    <h2 className="flex items-center gap-2 font-semibold">
                        <Star className="h-4 w-4 text-info" />
                        2. Efektivitas Pembelajaran
                    </h2>
                    <p className="text-xs text-muted-foreground">
                        Skala: 1 = Sangat Tidak Setuju · 5 = Sangat Setuju
                    </p>
                    {effectiveness_statements.map((text, i) => (
                        <ScaleRow
                            key={i}
                            no={i + 1}
                            text={text}
                            value={data.effectiveness_scores[i]}
                            labels={agreement_labels}
                            onChange={(v) =>
                                setScore('effectiveness_scores', i, v)
                            }
                        />
                    ))}
                </section>

                <section className="space-y-1.5">
                    <Label htmlFor="komentar">
                        Komentar / Saran{' '}
                        <span className="font-normal text-muted-foreground">
                            (opsional)
                        </span>
                    </Label>
                    <Textarea
                        id="komentar"
                        value={data.komentar}
                        onChange={(e) => setData('komentar', e.target.value)}
                        placeholder="Tulis masukan Anda untuk pemateri atau materi induksi"
                        rows={4}
                        maxLength={2000}
                    />
                </section>

                {errorMessages.length > 0 && (
                    <div className="space-y-0.5 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                        {errorMessages.map((msg) => (
                            <p key={msg}>{msg}</p>
                        ))}
                    </div>
                )}

                <Button
                    type="submit"
                    disabled={!complete || processing}
                    className="w-full gap-2"
                    size="lg"
                >
                    <Send className="h-4 w-4" />
                    {processing
                        ? 'Mengirim...'
                        : complete
                          ? 'Kirim & Lihat Hasil'
                          : answered < totalItems
                            ? `Lengkapi ${totalItems - answered} pertanyaan lagi`
                            : 'Pilih pemateri'}
                </Button>
            </form>
        </>
    );
}
