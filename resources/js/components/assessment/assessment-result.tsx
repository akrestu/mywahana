import { Head, Link, router } from '@inertiajs/react';
import {
    CheckCircle2,
    ChevronDown,
    ClipboardCheck,
    OctagonX,
    RotateCcw,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { SectionLabel } from '@/components/patterns/module-header';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ReviewItem = {
    urutan: number;
    question: string;
    jawaban_1: string;
    jawaban_2: string;
    jawaban_3: string;
    jawaban_4: string;
    jawaban_benar: number;
    jawaban_user: number | null;
    is_correct: boolean | null;
};

export type ResultSession = {
    id: number;
    score: number;
    total_questions: number;
    percentage: number;
    passed: boolean;
    completed_at: string;
};
export type AttendanceInfo = {
    recorded: boolean;
    attended_at: string;
    is_new: boolean;
} | null;

const OPTION_LABELS = ['A', 'B', 'C', 'D'];
// Same threshold as PASSING_PERCENTAGE on the backend.
const PASS_MARK = 80;

function ScoreRing({ pct, passed }: { pct: number; passed: boolean }) {
    const r = 54;
    const c = 2 * Math.PI * r;
    const [offset, setOffset] = useState(c);

    useEffect(() => {
        const t = window.setTimeout(() => setOffset(c - (pct / 100) * c), 80);

        return () => window.clearTimeout(t);
    }, [pct, c]);

    return (
        <div className="relative size-36">
            <svg
                viewBox="0 0 128 128"
                className="size-full -rotate-90"
                aria-hidden
            >
                <circle
                    cx="64"
                    cy="64"
                    r={r}
                    fill="none"
                    strokeWidth="10"
                    className="stroke-card/60"
                />
                <circle
                    cx="64"
                    cy="64"
                    r={r}
                    fill="none"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={c}
                    strokeDashoffset={offset}
                    className={cn(
                        'transition-[stroke-dashoffset] duration-1000 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none',
                        passed ? 'stroke-success' : 'stroke-destructive',
                    )}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="tabular text-4xl font-extrabold">
                    {Math.round(pct)}
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                    dari 100
                </span>
            </div>
        </div>
    );
}

function ReviewRow({ item }: { item: ReviewItem }) {
    const [open, setOpen] = useState(false);
    const options = [
        item.jawaban_1,
        item.jawaban_2,
        item.jawaban_3,
        item.jawaban_4,
    ];

    return (
        <li className="border-b border-border/60 last:border-0">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted"
            >
                {item.is_correct ? (
                    <CheckCircle2
                        className="mt-0.5 size-5 shrink-0 text-success"
                        aria-label="Benar"
                    />
                ) : (
                    <OctagonX
                        className="mt-0.5 size-5 shrink-0 text-destructive"
                        aria-label="Salah"
                    />
                )}
                <span className="flex-1 text-sm leading-snug">
                    <span className="tabular mr-1 text-muted-foreground">
                        {item.urutan}.
                    </span>
                    {item.question}
                </span>
                <ChevronDown
                    className={cn(
                        'mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform',
                        open && 'rotate-180',
                    )}
                />
            </button>
            {open && (
                <div className="flex flex-col gap-1.5 px-4 pb-4">
                    {options.map((opt, i) => {
                        const val = i + 1;
                        const correct = val === item.jawaban_benar;
                        const mine = val === item.jawaban_user;

                        return (
                            <div
                                key={val}
                                className={cn(
                                    'flex items-start gap-2.5 rounded-md px-3 py-2 text-sm',
                                    correct
                                        ? 'bg-success-soft'
                                        : mine
                                          ? 'bg-destructive-soft'
                                          : 'bg-muted/60',
                                )}
                            >
                                <span
                                    className={cn(
                                        'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                                        correct
                                            ? 'bg-success text-on-solid'
                                            : mine
                                              ? 'bg-destructive text-destructive-foreground'
                                              : 'bg-card text-muted-foreground',
                                    )}
                                >
                                    {OPTION_LABELS[i]}
                                </span>
                                <span
                                    className={cn(
                                        'flex-1',
                                        correct && 'font-semibold',
                                    )}
                                >
                                    {opt}
                                </span>
                                {correct && (
                                    <span className="shrink-0 text-xs font-bold text-success">
                                        Benar
                                    </span>
                                )}
                                {mine && !correct && (
                                    <span className="shrink-0 text-xs font-bold text-destructive">
                                        Jawaban Anda
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </li>
    );
}

/** Result page shared by Assessment Safety and Assessment HR. */
export function AssessmentResult({
    kind,
    title,
    meta,
    session,
    review,
    attendance,
    attemptsToday,
    dailyLimit,
    canRetry,
}: {
    kind: 'safety' | 'hr';
    title: string;
    meta?: string | null;
    session: ResultSession;
    review: ReviewItem[];
    attendance: AttendanceInfo;
    attemptsToday: number;
    dailyLimit: number;
    canRetry: boolean;
}) {
    const base = kind === 'safety' ? '/assessment' : '/hr-assessment';
    const [retrying, setRetrying] = useState(false);
    const correct = review.filter((r) => r.is_correct).length;
    const pct = Number(session.percentage);
    const date = new Date(session.completed_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    return (
        <>
            <Head title={`Hasil ${title}`} />
            <div className="flex flex-col gap-4 pt-2 pb-4 lg:mx-auto lg:max-w-[640px]">
                <section
                    aria-live="polite"
                    className={cn(
                        'relative isolate flex flex-col items-center gap-3 overflow-hidden rounded-[28px] px-5 py-7 text-center',
                        session.passed
                            ? 'bg-success-soft'
                            : 'bg-destructive-soft',
                    )}
                >
                    <div
                        aria-hidden
                        className="topo-motif pointer-events-none absolute inset-0 -z-10"
                    />
                    <p className="text-xs font-bold tracking-[0.12em] text-muted-foreground uppercase">
                        {title}
                    </p>
                    <ScoreRing pct={pct} passed={session.passed} />
                    <span
                        className={cn(
                            'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-extrabold',
                            session.passed
                                ? 'bg-success text-on-solid'
                                : 'bg-destructive text-destructive-foreground',
                        )}
                    >
                        {session.passed ? (
                            <CheckCircle2 className="size-4" />
                        ) : (
                            <OctagonX className="size-4" />
                        )}
                        {session.passed ? 'Lulus' : 'Belum lulus'}
                    </span>
                    <p className="text-xs text-muted-foreground">
                        Ambang lulus {PASS_MARK}
                        {!session.passed &&
                            ` · kurang ${(PASS_MARK - pct).toFixed(0)} poin`}{' '}
                        · {[meta, date].filter(Boolean).join(' · ')}
                    </p>
                </section>

                <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-lg bg-card px-4 py-3">
                        <p className="tabular text-2xl font-extrabold text-success">
                            {correct}
                        </p>
                        <p className="text-xs font-semibold text-muted-foreground">
                            Benar
                        </p>
                    </div>
                    <div className="rounded-lg bg-card px-4 py-3">
                        <p className="tabular text-2xl font-extrabold text-destructive">
                            {review.length - correct}
                        </p>
                        <p className="text-xs font-semibold text-muted-foreground">
                            Salah
                        </p>
                    </div>
                </div>

                {session.passed && attendance && (
                    <div className="flex items-center gap-3 rounded-lg bg-info-soft px-4 py-3 text-info">
                        <ClipboardCheck className="size-5 shrink-0" />
                        <div className="min-w-0 text-sm">
                            <p className="font-bold">
                                Absensi induksi{' '}
                                {kind === 'safety' ? 'Safety' : 'HR'} tercatat
                            </p>
                            <p className="text-xs">
                                {attendance.is_new
                                    ? 'Baru dicatat'
                                    : 'Sudah tercatat'}{' '}
                                {new Date(
                                    attendance.attended_at,
                                ).toLocaleString('id-ID', {
                                    day: 'numeric',
                                    month: 'long',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </p>
                        </div>
                    </div>
                )}

                {!session.passed && (
                    <div className="flex flex-col gap-1.5 rounded-lg bg-card px-4 py-3">
                        <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                            <span>Percobaan hari ini</span>
                            <span className="tabular">
                                {attemptsToday}/{dailyLimit}
                            </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                            <div
                                className={cn(
                                    'h-full rounded-full',
                                    attemptsToday >= dailyLimit
                                        ? 'bg-destructive'
                                        : 'bg-foreground',
                                )}
                                style={{
                                    width: `${Math.min(100, (attemptsToday / dailyLimit) * 100)}%`,
                                }}
                            />
                        </div>
                        {!canRetry && (
                            <p className="text-xs text-destructive">
                                Batas percobaan hari ini tercapai. Coba lagi
                                besok.
                            </p>
                        )}
                    </div>
                )}

                <div className="flex gap-3">
                    {!session.passed && (
                        <Button
                            variant="outline"
                            size="lg"
                            className="flex-1"
                            disabled={!canRetry}
                            loading={retrying}
                            onClick={() => {
                                setRetrying(true);
                                router.post(
                                    `${base}/start`,
                                    {},
                                    { onError: () => setRetrying(false) },
                                );
                            }}
                        >
                            {!retrying && <RotateCcw />}
                            Ulangi
                        </Button>
                    )}
                    <Button asChild size="lg" className="flex-1">
                        <Link href={base}>Selesai</Link>
                    </Button>
                </div>

                <SectionLabel
                    action={
                        <span className="text-xs text-muted-foreground">
                            Ketuk soal untuk detail
                        </span>
                    }
                >
                    Pembahasan
                </SectionLabel>
                <ul className="overflow-hidden rounded-lg bg-card">
                    {review.map((item) => (
                        <ReviewRow key={item.urutan} item={item} />
                    ))}
                </ul>
            </div>
        </>
    );
}
