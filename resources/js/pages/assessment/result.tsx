import { Head, Link, router } from '@inertiajs/react';
import { CheckCircle2, ChevronDown, ChevronUp, RotateCcw, Trophy, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type ReviewItem = {
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

type SessionResult = {
    id: number;
    departemen: string;
    tags: 'S' | 'NS';
    score: number;
    total_questions: number;
    percentage: number;
    passed: boolean;
    completed_at: string;
};

type Props = {
    session: SessionResult;
    review: ReviewItem[];
};

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

// Animated count-up number
function CountUp({ target, duration = 1200 }: { target: number; duration?: number }) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        const start = performance.now();
        const tick = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(eased * target * 100) / 100);
            if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }, [target, duration]);
    return <>{value.toFixed(2)}</>;
}

// SVG circular progress ring
function CircleProgress({ percentage, passed }: { percentage: number; passed: boolean }) {
    const radius = 72;
    const circumference = 2 * Math.PI * radius;
    const [offset, setOffset] = useState(circumference);

    useEffect(() => {
        const timer = setTimeout(() => {
            setOffset(circumference - (percentage / 100) * circumference);
        }, 100);
        return () => clearTimeout(timer);
    }, [percentage, circumference]);

    const color = passed ? '#22c55e' : '#ef4444';
    const trackColor = passed ? '#dcfce7' : '#fee2e2';

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg width="180" height="180" className="-rotate-90">
                <circle cx="90" cy="90" r={radius} fill="none" stroke={trackColor} strokeWidth="10" />
                <circle
                    cx="90" cy="90" r={radius} fill="none"
                    stroke={color} strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)' }}
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className={cn('text-4xl font-extrabold tabular-nums', passed ? 'text-green-600' : 'text-red-500')}>
                    <CountUp target={percentage} />%
                </span>
                <span className="text-xs text-muted-foreground mt-0.5">skor</span>
            </div>
        </div>
    );
}

// Collapsible review card
function ReviewCard({ item, index }: { item: ReviewItem; index: number }) {
    const [open, setOpen] = useState(false);
    const options = [item.jawaban_1, item.jawaban_2, item.jawaban_3, item.jawaban_4];

    return (
        <div
            className={cn(
                'rounded-xl border overflow-hidden transition-all',
                item.is_correct
                    ? 'border-green-200 dark:border-green-800'
                    : 'border-red-200 dark:border-red-800',
            )}
            style={{ animationDelay: `${index * 40}ms` }}
        >
            {/* Header row — always visible */}
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                className={cn(
                    'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors',
                    item.is_correct
                        ? 'bg-green-50 dark:bg-green-950/20 hover:bg-green-100/60 dark:hover:bg-green-950/30'
                        : 'bg-red-50 dark:bg-red-950/20 hover:bg-red-100/60 dark:hover:bg-red-950/30',
                )}
            >
                <span className="shrink-0 mt-0.5">
                    {item.is_correct
                        ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                        : <XCircle className="h-4 w-4 text-red-500" />
                    }
                </span>
                <p className="flex-1 text-sm font-medium leading-snug">
                    <span className="text-muted-foreground mr-1">{item.urutan}.</span>
                    {item.question}
                </p>
                <span className="shrink-0 text-muted-foreground mt-0.5">
                    {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </span>
            </button>

            {/* Collapsible options */}
            {open && (
                <div className="bg-background px-4 pb-3 pt-2 grid gap-1.5">
                    {options.map((opt, i) => {
                        const val = i + 1;
                        const isCorrect = val === item.jawaban_benar;
                        const isUserAnswer = val === item.jawaban_user;
                        return (
                            <div
                                key={val}
                                className={cn(
                                    'flex items-start gap-2.5 rounded-lg px-3 py-2 text-sm',
                                    isCorrect && 'bg-green-50 dark:bg-green-950/20',
                                    isUserAnswer && !isCorrect && 'bg-red-50 dark:bg-red-950/20',
                                )}
                            >
                                <span className={cn(
                                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-bold mt-0.5',
                                    isCorrect
                                        ? 'border-green-500 bg-green-500 text-white'
                                        : isUserAnswer
                                            ? 'border-red-500 bg-red-500 text-white'
                                            : 'border-muted-foreground/40 text-muted-foreground',
                                )}>
                                    {OPTION_LABELS[i]}
                                </span>
                                <span className={cn(isCorrect && 'font-medium')}>{opt}</span>
                                {isCorrect && (
                                    <span className="ml-auto text-xs text-green-600 font-semibold shrink-0">✓ Benar</span>
                                )}
                                {isUserAnswer && !isCorrect && (
                                    <span className="ml-auto text-xs text-red-500 font-semibold shrink-0">Jawaban kamu</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function AssessmentResult({ session, review }: Props) {
    const correctCount = review.filter(r => r.is_correct).length;
    const incorrectCount = review.length - correctCount;
    const [retrying, setRetrying] = useState(false);

    const scoreCardRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        scoreCardRef.current?.classList.add('animate-in');
    }, []);

    return (
        <>
            <Head title="Hasil Assessment" />
            <style>{`
                @keyframes fadeSlideUp {
                    from { opacity: 0; transform: translateY(24px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes popIn {
                    0%   { opacity: 0; transform: scale(0.7); }
                    70%  { transform: scale(1.08); }
                    100% { opacity: 1; transform: scale(1); }
                }
                .result-enter { animation: fadeSlideUp 0.5s ease both; }
                .badge-pop    { animation: popIn 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.8s both; }
                .section-enter{ animation: fadeSlideUp 0.5s ease both; }
            `}</style>

            <div className="mx-auto max-w-2xl px-4 py-6 space-y-5">

                {/* ── Hero score card ── */}
                <div ref={scoreCardRef} className="result-enter">
                    <Card className={cn(
                        'overflow-hidden',
                        session.passed
                            ? 'bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/30 dark:to-emerald-900/20 border-green-200 dark:border-green-800'
                            : 'bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950/30 dark:to-rose-900/20 border-red-200 dark:border-red-800',
                    )}>
                        {/* Top banner */}
                        <div className={cn(
                            'px-5 py-2.5 flex items-center gap-2 text-sm font-semibold',
                            session.passed
                                ? 'bg-green-500 text-white'
                                : 'bg-red-500 text-white',
                        )}>
                            {session.passed
                                ? <><Trophy className="h-4 w-4" /> Selamat, Kamu Lulus!</>
                                : <><XCircle className="h-4 w-4" /> Belum Lulus — Coba Lagi!</>
                            }
                        </div>

                        <div className="px-5 py-6 flex flex-col items-center gap-4">
                            {/* Circular progress */}
                            <CircleProgress percentage={session.percentage} passed={session.passed} />

                            {/* Score breakdown pills */}
                            <div className="badge-pop flex gap-3">
                                <div className="flex items-center gap-1.5 rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1.5 text-sm font-semibold text-green-700 dark:text-green-300">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    {correctCount} benar
                                </div>
                                <div className="flex items-center gap-1.5 rounded-full bg-red-100 dark:bg-red-900/30 px-3 py-1.5 text-sm font-semibold text-red-600 dark:text-red-300">
                                    <XCircle className="h-3.5 w-3.5" />
                                    {incorrectCount} salah
                                </div>
                            </div>

                            {/* Meta info */}
                            <p className="text-xs text-muted-foreground text-center">
                                {session.departemen} · {session.tags === 'S' ? 'Staff' : 'Non Staff'} ·{' '}
                                {new Date(session.completed_at).toLocaleDateString('id-ID', {
                                    day: 'numeric', month: 'long', year: 'numeric',
                                })}
                            </p>

                            {/* Min passing note */}
                            <p className="text-xs text-muted-foreground">
                                Nilai minimum lulus: <span className="font-semibold">80%</span>
                                {session.passed
                                    ? <span className="text-green-600 ml-1">✓ Tercapai</span>
                                    : <span className="text-red-500 ml-1">· Kurang {(80 - session.percentage).toFixed(2)}%</span>
                                }
                            </p>
                        </div>
                    </Card>
                </div>

                {/* ── Action buttons ── */}
                <div className="section-enter flex gap-3" style={{ animationDelay: '0.2s' }}>
                    <Button
                        variant="outline"
                        className="flex-1 gap-2"
                        disabled={retrying}
                        onClick={() => { setRetrying(true); router.post('/assessment/start'); }}
                    >
                        <RotateCcw className={cn('h-4 w-4', retrying && 'animate-spin')} />
                        {retrying ? 'Memulai...' : 'Ulangi Assessment'}
                    </Button>
                    <Link href="/assessment" className="flex-1">
                        <Button className="w-full">Lihat Riwayat</Button>
                    </Link>
                </div>

                {/* ── Review section ── */}
                <div className="section-enter space-y-3" style={{ animationDelay: '0.35s' }}>
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold">Pembahasan Jawaban</h2>
                        <span className="text-xs text-muted-foreground">Ketuk soal untuk lihat detail</span>
                    </div>

                    {review.map((item, index) => (
                        <ReviewCard key={item.urutan} item={item} index={index} />
                    ))}
                </div>
            </div>
        </>
    );
}
