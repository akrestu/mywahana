import { router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Clock, LayoutGrid } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { choiceSurface } from '@/components/patterns/choice-card';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
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

type Props = {
    submitUrl: string;
    subtitle: string;
    totalQuestions: number;
    remainingSeconds: number;
    questions: QuizQuestion[];
    /** Kept for backwards compatibility; the runner now follows the theme. */
    accent?: 'blue' | 'purple';
};

const OPTION_LABELS = ['A', 'B', 'C', 'D'];
const RETRY_DELAY_MS = 5000;

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
 * Pengerjaan quiz assessment, satu soal per layar. Jawaban disimpan di
 * perangkat agar tidak hilang saat halaman ter-reload, dan timer dihitung
 * dari sisa waktu yang dikirim server (bukan jam HP).
 */
export function QuizRunner({
    submitUrl,
    subtitle,
    totalQuestions,
    remainingSeconds,
    questions,
}: Props) {
    const storageKey = `quiz-answers:${submitUrl}`;

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
    const [index, setIndex] = useState(() => {
        const firstOpen = questions.findIndex((q) => q.jawaban_user == null);

        return firstOpen === -1 ? 0 : firstOpen;
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
    const q = questions[index];
    const isLast = index === questions.length - 1;
    const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
    const ss = String(remaining % 60).padStart(2, '0');
    const isUrgent = remaining <= 5 * 60;

    const submit = () => {
        if (unanswered.length > 0) {
            setConfirmOpen(true);

            return;
        }

        send(false);
    };

    if (!q) {
        return null;
    }

    const options = [q.jawaban_1, q.jawaban_2, q.jawaban_3, q.jawaban_4];

    return (
        <>
            <ConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title="Masih ada soal yang belum dijawab"
                description={`${unanswered.length} soal belum dijawab dan akan dihitung salah. Tetap kirim sekarang?`}
                confirmLabel="Ya, kirim"
                cancelLabel="Kembali menjawab"
                onConfirm={() => send(false)}
            />

            <div className="mx-auto flex min-h-[calc(100svh-6rem)] max-w-[640px] flex-col gap-5 pt-2">
                <header className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs text-muted-foreground">
                                {subtitle}
                            </p>
                            <p className="tabular text-[15px] font-bold">
                                Soal {index + 1} dari {totalQuestions}
                            </p>
                        </div>
                        <span
                            role="timer"
                            aria-label={`Sisa waktu ${mm} menit ${ss} detik`}
                            className={cn(
                                'tabular flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-bold',
                                isUrgent
                                    ? 'animate-pulse bg-destructive-soft text-destructive'
                                    : 'bg-card',
                            )}
                        >
                            <Clock className="size-4" />
                            {mm}:{ss}
                        </span>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            aria-label={`Daftar soal, ${answeredCount} dari ${totalQuestions} dijawab`}
                            onClick={() => setNavOpen(true)}
                        >
                            <LayoutGrid />
                        </Button>
                    </div>
                    <div
                        className="flex gap-1"
                        role="progressbar"
                        aria-valuenow={answeredCount}
                        aria-valuemin={0}
                        aria-valuemax={totalQuestions}
                        aria-label="Soal dijawab"
                    >
                        {questions.map((qq, i) => (
                            <span
                                key={qq.session_question_id}
                                className={cn(
                                    'h-1.5 flex-1 rounded-full transition-colors',
                                    i === index
                                        ? 'bg-accent'
                                        : answers[qq.session_question_id] !=
                                            null
                                          ? 'bg-foreground'
                                          : 'bg-border',
                                )}
                            />
                        ))}
                    </div>
                </header>

                <section
                    key={q.session_question_id}
                    className="flex animate-in flex-col gap-4 duration-300 fade-in-0 slide-in-from-right-4"
                >
                    <h1
                        id="soal-label"
                        className="text-xl leading-snug font-bold"
                    >
                        {q.question}
                    </h1>
                    <div
                        role="radiogroup"
                        aria-labelledby="soal-label"
                        className="flex flex-col gap-2.5"
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
                                            [q.session_question_id]: val,
                                        }))
                                    }
                                    className={cn(
                                        'flex min-h-[56px] items-center gap-3 rounded-lg px-4 py-3 text-left text-[15px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                                        choiceSurface(selected), selected && 'font-semibold',
                                    )}
                                >
                                    <span
                                        aria-hidden
                                        className={cn(
                                            'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold',
                                            selected
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted text-muted-foreground',
                                        )}
                                    >
                                        {OPTION_LABELS[i]}
                                    </span>
                                    <span>{opt}</span>
                                </button>
                            );
                        })}
                    </div>
                </section>

                <div className="sticky bottom-0 -mx-4 mt-auto flex gap-3 bg-gradient-to-t from-background via-background to-background/0 px-4 pt-6 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:mx-0 lg:px-0">
                    <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        className="flex-1"
                        disabled={index === 0}
                        onClick={() => setIndex((i) => Math.max(0, i - 1))}
                        aria-label="Soal sebelumnya"
                    >
                        <ChevronLeft />
                    </Button>
                    {isLast ? (
                        <Button
                            type="button"
                            size="lg"
                            className="flex-[3]"
                            loading={submitting}
                            onClick={submit}
                        >
                            Selesai & kirim
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            size="lg"
                            className="flex-[3]"
                            onClick={() =>
                                setIndex((i) =>
                                    Math.min(questions.length - 1, i + 1),
                                )
                            }
                        >
                            Soal berikutnya <ChevronRight />
                        </Button>
                    )}
                </div>
            </div>

            <Sheet open={navOpen} onOpenChange={setNavOpen}>
                <SheetContent
                    side="bottom"
                    className="mx-auto max-w-lg gap-0 border-0 px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
                >
                    <div
                        className="mx-auto mt-3 h-1 w-10 rounded-full bg-border"
                        aria-hidden
                    />
                    <SheetHeader className="px-0 pb-4">
                        <SheetTitle className="text-left text-xl font-extrabold">
                            Daftar soal
                        </SheetTitle>
                        <SheetDescription className="tabular text-left">
                            {answeredCount} dari {totalQuestions} dijawab ·
                            jawaban tersimpan otomatis di perangkat ini.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
                        {questions.map((qq, i) => {
                            const done =
                                answers[qq.session_question_id] != null;

                            return (
                                <button
                                    key={qq.session_question_id}
                                    type="button"
                                    onClick={() => {
                                        setIndex(i);
                                        setNavOpen(false);
                                    }}
                                    aria-label={`Soal ${i + 1}${done ? ', sudah dijawab' : ', belum dijawab'}`}
                                    aria-current={
                                        i === index ? 'step' : undefined
                                    }
                                    className={cn(
                                        'tabular flex h-11 items-center justify-center rounded-md text-sm font-bold',
                                        done
                                            ? 'bg-primary text-primary-foreground'
                                            : 'border border-dashed border-border',
                                        i === index &&
                                            'ring-2 ring-accent ring-offset-2 ring-offset-background',
                                    )}
                                >
                                    {i + 1}
                                </button>
                            );
                        })}
                    </div>
                    <div className="mt-4 flex gap-3">
                        {unanswered.length > 0 && (
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                    setIndex(questions.indexOf(unanswered[0]));
                                    setNavOpen(false);
                                }}
                            >
                                Ke soal kosong ({unanswered.length})
                            </Button>
                        )}
                        <Button
                            type="button"
                            className="flex-1"
                            loading={submitting}
                            onClick={submit}
                        >
                            Kirim
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
