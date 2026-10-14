import { router } from '@inertiajs/react';
import { ListChecks } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type QuizQuestion = {
    session_question_id: number;
    urutan: number;
    question: string;
    jawaban_1: string;
    jawaban_2: string;
    jawaban_3: string;
    jawaban_4: string;
    jawaban_user: number | null;
};

type Accent = 'blue' | 'purple';

type Props = {
    submitUrl: string;
    subtitle: string;
    totalQuestions: number;
    remainingSeconds: number;
    questions: QuizQuestion[];
    accent: Accent;
};

const OPTION_LABELS = ['A', 'B', 'C', 'D'];
const RETRY_DELAY_MS = 5000;

const ACCENT: Record<
    Accent,
    {
        bar: string;
        selected: string;
        bullet: string;
        button: string;
        chip: string;
    }
> = {
    blue: {
        bar: 'bg-blue-500',
        selected:
            'border-blue-500 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-400',
        bullet: 'border-blue-500 bg-blue-500 text-white',
        button: '',
        chip: 'border-blue-500 bg-blue-500 text-white',
    },
    purple: {
        bar: 'bg-purple-500',
        selected:
            'border-purple-500 bg-purple-50 dark:bg-purple-950/30 dark:border-purple-400',
        bullet: 'border-purple-500 bg-purple-500 text-white',
        button: 'bg-purple-600 hover:bg-purple-700',
        chip: 'border-purple-500 bg-purple-500 text-white',
    },
};

function readSaved(key: string): Record<number, number> {
    try {
        const raw = window.localStorage.getItem(key);

        return raw ? (JSON.parse(raw) as Record<number, number>) : {};
    } catch {
        return {};
    }
}

function writeSaved(key: string, value: Record<number, number> | null): void {
    try {
        if (value === null) {
            window.localStorage.removeItem(key);
        } else {
            window.localStorage.setItem(key, JSON.stringify(value));
        }
    } catch {
        // Penyimpanan diblokir (mode privat) — jawaban tetap ada di memori.
    }
}

/**
 * Pengerjaan quiz assessment. Jawaban disimpan di perangkat agar tidak hilang
 * saat halaman ter-reload, dan timer dihitung dari sisa waktu yang dikirim
 * server (bukan jam HP).
 */
export function QuizRunner({
    submitUrl,
    subtitle,
    totalQuestions,
    remainingSeconds,
    questions,
    accent,
}: Props) {
    const storageKey = `quiz-answers:${submitUrl}`;
    const colors = ACCENT[accent];

    const [answers, setAnswers] = useState<Record<number, number>>(() => {
        const init: Record<number, number> = {};

        for (const q of questions) {
            if (q.jawaban_user != null) {
                init[q.session_question_id] = q.jawaban_user;
            }
        }

        const validIds = new Set(questions.map((q) => q.session_question_id));

        for (const [id, value] of Object.entries(readSaved(storageKey))) {
            if (validIds.has(Number(id))) {
                init[Number(id)] = value;
            }
        }

        return init;
    });
    const [submitting, setSubmitting] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [navOpen, setNavOpen] = useState(false);

    const [remaining, setRemaining] = useState(remainingSeconds);
    const [retryCount, setRetryCount] = useState(0);

    const answersRef = useRef(answers);
    const submittingRef = useRef(false);
    const doneRef = useRef(false);

    useEffect(() => {
        answersRef.current = answers;
        writeSaved(storageKey, answers);
    }, [answers, storageKey]);

    const send = useCallback(
        (auto: boolean) => {
            if (submittingRef.current || doneRef.current) {
                return;
            }

            submittingRef.current = true;
            setSubmitting(true);
            let succeeded = false;

            router.post(
                submitUrl,
                { answers: answersRef.current },
                {
                    onSuccess: () => {
                        succeeded = true;
                        doneRef.current = true;
                        writeSaved(storageKey, null);
                    },
                    onFinish: () => {
                        submittingRef.current = false;
                        setSubmitting(false);

                        if (succeeded) {
                            return;
                        }

                        toast.error(
                            'Gagal mengirim jawaban. Periksa koneksi internet Anda.',
                        );

                        // Waktu habis: terus coba kirim sampai berhasil. Jawaban aman di perangkat.
                        if (auto) {
                            window.setTimeout(
                                () => setRetryCount((c) => c + 1),
                                RETRY_DELAY_MS,
                            );
                        }
                    },
                },
            );
        },
        [submitUrl, storageKey],
    );

    useEffect(() => {
        // Deadline relatif terhadap jam monotonic browser, jadi mengubah jam HP tidak berpengaruh.
        const deadline = performance.now() + remainingSeconds * 1000;
        const tick = window.setInterval(() => {
            const secs = Math.max(
                0,
                Math.ceil((deadline - performance.now()) / 1000),
            );
            setRemaining(secs);

            if (secs === 0) {
                window.clearInterval(tick);
                send(true);
            }
        }, 1000);

        return () => window.clearInterval(tick);
    }, [remainingSeconds, send]);

    useEffect(() => {
        if (retryCount > 0) {
            send(true);
        }
    }, [retryCount, send]);

    useEffect(() => {
        const warn = (e: BeforeUnloadEvent) => {
            if (!doneRef.current) {
                e.preventDefault();
            }
        };

        window.addEventListener('beforeunload', warn);

        return () => window.removeEventListener('beforeunload', warn);
    }, []);

    const answeredCount = Object.keys(answers).length;
    const unanswered = questions.filter(
        (q) => answers[q.session_question_id] == null,
    );

    function scrollToQuestion(sqId: number) {
        setNavOpen(false);
        document
            .getElementById(`soal-${sqId}`)
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function handleSubmit() {
        if (unanswered.length > 0) {
            setConfirmOpen(true);

            return;
        }

        send(false);
    }

    const progressPct = Math.round((answeredCount / totalQuestions) * 100);
    const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
    const ss = String(remaining % 60).padStart(2, '0');
    const isUrgent = remaining <= 5 * 60;

    return (
        <>
            <ConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title="Masih ada soal yang belum dijawab"
                description={`${unanswered.length} soal belum dijawab dan akan dihitung salah. Tetap submit sekarang?`}
                confirmLabel="Ya, submit"
                cancelLabel="Kembali menjawab"
                onConfirm={() => send(false)}
            />
            <div className="mx-auto max-w-2xl space-y-5 px-4 py-6">
                <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-10 space-y-2 border-b bg-background/95 pt-1 pb-3 backdrop-blur lg:top-0">
                    <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="truncate font-medium">{subtitle}</span>
                        <div className="flex shrink-0 items-center gap-2">
                            <span
                                role="timer"
                                aria-label={`Sisa waktu ${mm} menit ${ss} detik`}
                                className={cn(
                                    'font-mono text-sm font-semibold tabular-nums',
                                    isUrgent
                                        ? 'animate-pulse text-red-600 dark:text-red-400'
                                        : 'text-muted-foreground',
                                )}
                            >
                                ⏱ {mm}:{ss}
                            </span>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1.5"
                                aria-expanded={navOpen}
                                aria-controls="daftar-soal"
                                onClick={() => setNavOpen((v) => !v)}
                            >
                                <ListChecks size={14} />
                                {answeredCount}/{totalQuestions}
                            </Button>
                        </div>
                    </div>
                    <div
                        className="h-2 overflow-hidden rounded-full bg-muted"
                        role="progressbar"
                        aria-valuenow={answeredCount}
                        aria-valuemin={0}
                        aria-valuemax={totalQuestions}
                        aria-label="Soal dijawab"
                    >
                        <div
                            className={cn(
                                'h-full transition-all duration-300',
                                colors.bar,
                            )}
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                    {navOpen && (
                        <div id="daftar-soal" className="space-y-2 pt-1">
                            <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-10">
                                {questions.map((q, idx) => {
                                    const done =
                                        answers[q.session_question_id] != null;

                                    return (
                                        <button
                                            key={q.session_question_id}
                                            type="button"
                                            onClick={() =>
                                                scrollToQuestion(
                                                    q.session_question_id,
                                                )
                                            }
                                            aria-label={`Soal ${idx + 1}${done ? ', sudah dijawab' : ', belum dijawab'}`}
                                            className={cn(
                                                'flex h-9 items-center justify-center rounded-md border text-xs font-semibold',
                                                done
                                                    ? colors.chip
                                                    : 'border-dashed border-muted-foreground/60 text-foreground',
                                            )}
                                        >
                                            {idx + 1}
                                        </button>
                                    );
                                })}
                            </div>
                            {unanswered.length > 0 && (
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    className="w-full"
                                    onClick={() =>
                                        scrollToQuestion(
                                            unanswered[0].session_question_id,
                                        )
                                    }
                                >
                                    Ke soal belum dijawab ({unanswered.length})
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                {questions.map((q, idx) => {
                    const options = [
                        q.jawaban_1,
                        q.jawaban_2,
                        q.jawaban_3,
                        q.jawaban_4,
                    ];
                    const labelId = `soal-${q.session_question_id}-label`;

                    return (
                        <Card
                            key={q.session_question_id}
                            id={`soal-${q.session_question_id}`}
                            className="scroll-mt-40 space-y-3 p-4"
                        >
                            <p
                                id={labelId}
                                className="text-sm leading-snug font-medium"
                            >
                                <span className="mr-2 text-muted-foreground">
                                    {idx + 1}.
                                </span>
                                {q.question}
                            </p>
                            <div
                                className="grid gap-2"
                                role="radiogroup"
                                aria-labelledby={labelId}
                            >
                                {options.map((opt, i) => {
                                    const val = i + 1;
                                    const selected =
                                        answers[q.session_question_id] === val;

                                    return (
                                        <button
                                            key={val}
                                            type="button"
                                            role="radio"
                                            aria-checked={selected}
                                            onClick={() =>
                                                setAnswers((prev) => ({
                                                    ...prev,
                                                    [q.session_question_id]:
                                                        val,
                                                }))
                                            }
                                            className={cn(
                                                'flex min-h-11 items-start gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors',
                                                selected
                                                    ? colors.selected
                                                    : 'border-border hover:bg-muted/50',
                                            )}
                                        >
                                            <span
                                                aria-hidden
                                                className={cn(
                                                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                                                    selected
                                                        ? colors.bullet
                                                        : 'border-muted-foreground text-muted-foreground',
                                                )}
                                            >
                                                {OPTION_LABELS[i]}
                                            </span>
                                            <span>{opt}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </Card>
                    );
                })}

                <div className="space-y-2 pb-6">
                    <Badge
                        variant="outline"
                        className="w-full justify-center py-1"
                    >
                        {answeredCount} / {totalQuestions} dijawab · jawaban
                        tersimpan otomatis di perangkat ini
                    </Badge>
                    <Button
                        className={cn('w-full', colors.button)}
                        size="lg"
                        disabled={submitting}
                        onClick={handleSubmit}
                    >
                        {submitting ? 'Menyimpan...' : 'Submit Assessment'}
                    </Button>
                </div>
            </div>
        </>
    );
}
