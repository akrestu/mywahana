import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    ChevronRight,
    Clock,
    GraduationCap,
    OctagonX,
} from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/patterns/empty-state';
import {
    ModuleHeader,
    SectionLabel,
} from '@/components/patterns/module-header';
import { Pager } from '@/components/patterns/segment-tabs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type AssessmentSession = {
    id: number;
    status: 'in_progress' | 'completed';
    score: number | null;
    total_questions: number;
    percentage: number | null;
    passed: boolean | null;
    started_at: string;
    completed_at: string | null;
};

export type SessionPage = {
    data: AssessmentSession[];
    next_page_url: string | null;
    prev_page_url: string | null;
};

// Same threshold as PASSING_PERCENTAGE on the backend.
const PASS_MARK = 80;

/** Landing page shared by Assessment Safety and Assessment HR. */
export function AssessmentHome({
    kind,
    title,
    meta,
    sessions,
    questionCount,
    attemptsToday,
    dailyLimit,
    canStart,
    profileIncomplete = false,
}: {
    kind: 'safety' | 'hr';
    title: string;
    meta?: string | null;
    sessions: SessionPage;
    questionCount: number | null;
    attemptsToday: number;
    dailyLimit: number;
    canStart: boolean;
    profileIncomplete?: boolean;
}) {
    const base = kind === 'safety' ? '/assessment' : '/hr-assessment';
    const [starting, setStarting] = useState(false);
    const completed = sessions.data.filter(
        (s) => s.status === 'completed' && s.percentage != null,
    );
    const best = completed.reduce(
        (m, s) => Math.max(m, Number(s.percentage)),
        0,
    );
    const inProgress = sessions.data.find((s) => s.status === 'in_progress');
    const disabled = starting || profileIncomplete || !canStart;

    const start = () => {
        setStarting(true);
        router.post(`${base}/start`, {}, { onError: () => setStarting(false) });
    };

    const startLabel = profileIncomplete
        ? 'Lengkapi profil dulu'
        : !canStart && attemptsToday >= dailyLimit
          ? `Batas ${dailyLimit}× percobaan hari ini tercapai`
          : !canStart
            ? 'Anda sudah lulus hari ini'
            : 'Mulai assessment';

    return (
        <>
            <Head title={title} />
            <div className="flex flex-col gap-4 pt-2">
                <ModuleHeader
                    backHref="/modules"
                    eyebrow="Modul"
                    title="Assessment"
                />

                <div
                    role="tablist"
                    aria-label="Jenis assessment"
                    className="flex rounded-full bg-muted p-1"
                >
                    {[
                        { key: 'safety', label: 'Safety', href: '/assessment' },
                        { key: 'hr', label: 'HR', href: '/hr-assessment' },
                    ].map((t) => (
                        <Link
                            key={t.key}
                            href={t.href}
                            role="tab"
                            aria-selected={kind === t.key}
                            className={cn(
                                'flex h-10 flex-1 items-center justify-center rounded-full text-[13px] transition-all',
                                kind === t.key
                                    ? 'bg-card font-bold shadow-[0_1px_2px_oklch(0.191_0_0/0.08)] dark:bg-primary dark:text-primary-foreground'
                                    : 'font-semibold text-muted-foreground',
                            )}
                        >
                            {t.label}
                        </Link>
                    ))}
                </div>

                {profileIncomplete && (
                    <div
                        role="alert"
                        className="flex items-start gap-3 rounded-lg bg-warning-soft px-4 py-3 text-warning"
                    >
                        <AlertCircle className="mt-0.5 size-4 shrink-0" />
                        <div className="text-sm">
                            <p className="font-bold">Profil belum lengkap</p>
                            <p className="mt-0.5 text-xs">
                                Lengkapi departemen di profil Anda sebelum
                                mengikuti assessment.
                            </p>
                            <Link
                                href="/settings/profile"
                                className="mt-1.5 inline-block text-xs font-bold underline underline-offset-2"
                            >
                                Lengkapi profil →
                            </Link>
                        </div>
                    </div>
                )}

                <section className="flex flex-col gap-4 rounded-[22px] bg-card p-[18px]">
                    <div className="flex items-center justify-between gap-2">
                        <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-extrabold tracking-[0.08em] text-accent-foreground">
                            AKTIF
                        </span>
                        {attemptsToday > 0 && (
                            <span className="tabular text-xs font-semibold text-muted-foreground">
                                Percobaan hari ini {attemptsToday}/{dailyLimit}
                            </span>
                        )}
                    </div>
                    <div>
                        <h1 className="text-xl font-extrabold tracking-tight">
                            {title}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {[
                                questionCount ? `${questionCount} soal` : null,
                                `minimal ${PASS_MARK}% lulus`,
                                meta,
                            ]
                                .filter(Boolean)
                                .join(' · ')}
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                        <div className="rounded-lg bg-muted px-3.5 py-3">
                            <p className="text-xs text-muted-foreground">
                                Percobaan
                            </p>
                            <p className="tabular text-lg font-extrabold">
                                {sessions.data.length}
                            </p>
                        </div>
                        <div className="rounded-lg bg-muted px-3.5 py-3">
                            <p className="text-xs text-muted-foreground">
                                Skor terbaik
                            </p>
                            <p className="tabular text-lg font-extrabold">
                                {completed.length ? `${best.toFixed(0)}%` : '—'}
                            </p>
                        </div>
                    </div>
                    {inProgress ? (
                        <Button asChild size="lg">
                            <Link href={`${base}/${inProgress.id}/quiz`}>
                                Lanjutkan assessment
                            </Link>
                        </Button>
                    ) : (
                        <Button
                            size="lg"
                            onClick={start}
                            disabled={disabled}
                            loading={starting}
                        >
                            {startLabel}
                        </Button>
                    )}
                </section>

                <SectionLabel>Riwayat</SectionLabel>
                {sessions.data.length === 0 ? (
                    <EmptyState
                        icon={GraduationCap}
                        title="Belum ada riwayat"
                        description="Mulai assessment pertama Anda sekarang."
                    />
                ) : (
                    <>
                        <ul className="overflow-hidden rounded-lg bg-card">
                            {sessions.data.map((s) => {
                                const running = s.status === 'in_progress';
                                const pct =
                                    s.percentage != null
                                        ? Number(s.percentage)
                                        : null;
                                const date = new Date(
                                    s.completed_at ?? s.started_at,
                                ).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                });

                                return (
                                    <li
                                        key={s.id}
                                        className="border-b border-border/60 last:border-0"
                                    >
                                        <Link
                                            href={
                                                running
                                                    ? `${base}/${s.id}/quiz`
                                                    : `${base}/${s.id}/result`
                                            }
                                            className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted"
                                        >
                                            <span
                                                aria-hidden
                                                className={cn(
                                                    'tabular flex size-11 shrink-0 items-center justify-center rounded-[14px] text-sm font-extrabold',
                                                    running
                                                        ? 'bg-warning-soft text-warning'
                                                        : s.passed
                                                          ? 'bg-success-soft text-success'
                                                          : 'bg-destructive-soft text-destructive',
                                                )}
                                            >
                                                {running ? (
                                                    <Clock className="size-4" />
                                                ) : pct != null ? (
                                                    pct.toFixed(0)
                                                ) : (
                                                    '—'
                                                )}
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block text-sm font-bold">
                                                    {running
                                                        ? 'Sedang berlangsung'
                                                        : s.passed
                                                          ? 'Lulus'
                                                          : 'Tidak lulus'}
                                                </span>
                                                <span className="tabular block text-xs text-muted-foreground">
                                                    {running
                                                        ? date
                                                        : `${s.score}/${s.total_questions} benar · ${date}`}
                                                </span>
                                            </span>
                                            {!running &&
                                                (s.passed ? (
                                                    <CheckCircle2
                                                        className="size-5 shrink-0 text-success"
                                                        aria-hidden
                                                    />
                                                ) : (
                                                    <OctagonX
                                                        className="size-5 shrink-0 text-destructive"
                                                        aria-hidden
                                                    />
                                                ))}
                                            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                        <Pager
                            prev={sessions.prev_page_url}
                            next={sessions.next_page_url}
                        />
                    </>
                )}
            </div>
        </>
    );
}
