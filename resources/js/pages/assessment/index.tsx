import { Head, Link, router } from '@inertiajs/react';
import { AlertCircle, BookOpen, CalendarDays, CheckCircle2, ChevronRight, Clock, GraduationCap, Target, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Session = {
    id: number;
    departemen: string;
    tags: 'S' | 'NS';
    status: 'in_progress' | 'completed';
    score: number | null;
    total_questions: number;
    percentage: number | null;
    passed: boolean | null;
    started_at: string;
    completed_at: string | null;
};

type Paginated = {
    data: Session[];
    current_page: number;
    last_page: number;
    next_page_url: string | null;
    prev_page_url: string | null;
};

type UserInfo = {
    departemen: string | null;
    tags: 'S' | 'NS' | null;
    question_count: number | null;
};

type Props = {
    sessions: Paginated;
    user: UserInfo;
    profile_incomplete: boolean;
};

function groupByMonth(sessions: Session[]) {
    const groups: Record<string, Session[]> = {};
    for (const s of sessions) {
        const date = s.completed_at ?? s.started_at;
        const key = new Date(date).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        (groups[key] ??= []).push(s);
    }
    return Object.entries(groups);
}

// Mini bar showing score visually
function ScoreBar({ percentage, passed }: { percentage: number; passed: boolean }) {
    return (
        <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
            <div
                className={cn('h-full rounded-full', passed ? 'bg-green-500' : 'bg-red-500')}
                style={{ width: `${percentage}%` }}
            />
        </div>
    );
}

export default function AssessmentIndex({ sessions, user, profile_incomplete }: Props) {
    const grouped = groupByMonth(sessions.data);
    const [starting, setStarting] = useState(false);

    const totalAttempts = sessions.data.length;
    const passedCount = sessions.data.filter(s => s.passed === true).length;
    const bestScore = sessions.data.reduce((best, s) => {
        const pct = s.percentage != null ? Number(s.percentage) : 0;
        return pct > best ? pct : best;
    }, 0);

    function handleStart() {
        setStarting(true);
        router.post('/assessment/start', {}, { onError: () => setStarting(false) });
    }

    return (
        <>
            <Head title="Assessment Safety" />
            <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .fade-up { animation: fadeUp 0.4s ease both; }
            `}</style>

            <div className="mx-auto max-w-xl px-4 py-5 space-y-5">

                {/* ── Profile incomplete warning ── */}
                {profile_incomplete && (
                    <div className="fade-up flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/20 px-4 py-3.5">
                        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div className="flex-1 text-sm">
                            <p className="font-semibold text-amber-800 dark:text-amber-300">Profil belum lengkap</p>
                            <p className="text-amber-700 dark:text-amber-400 text-xs mt-0.5">
                                Lengkapi <strong>departemen</strong> di profil Anda sebelum mengikuti assessment.
                            </p>
                            <Link href="/settings/profile" className="mt-2 inline-block text-xs font-semibold text-amber-700 dark:text-amber-300 underline underline-offset-2">
                                Lengkapi profil →
                            </Link>
                        </div>
                    </div>
                )}

                {/* ── Hero banner ── */}
                <div className="fade-up rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-600 to-blue-500 text-white shadow-lg">
                    <div className="px-5 pt-5 pb-4 space-y-1">
                        <div className="flex items-center gap-2 text-indigo-100 text-xs font-medium uppercase tracking-wide">
                            <GraduationCap className="h-3.5 w-3.5" />
                            Assessment Safety
                        </div>
                        <h1 className="text-xl font-bold">{user.departemen ?? '—'}</h1>
                        <p className="text-indigo-100 text-sm">
                            {user.tags ? `Level ${user.tags === 'S' ? 'Staff' : 'Non Staff'}` : 'Departemen belum diisi'}
                        </p>
                    </div>

                    {/* Info chips */}
                    <div className="px-5 pb-4 flex gap-2 flex-wrap">
                        {[
                            { icon: BookOpen,  label: user.question_count ? `${user.question_count} soal` : '— soal' },
                            { icon: Target,    label: 'Min. 80% lulus' },
                        ].map(({ icon: Icon, label }) => (
                            <div key={label} className="flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-xs font-medium">
                                <Icon className="h-3 w-3" />
                                {label}
                            </div>
                        ))}
                    </div>

                    {/* Start button */}
                    <div className="px-5 pb-5">
                        <button
                            onClick={handleStart}
                            disabled={starting || profile_incomplete}
                            className={cn(
                                'w-full rounded-xl py-3 text-sm font-semibold transition-all',
                                'bg-white text-indigo-600 hover:bg-indigo-50 active:scale-[0.98]',
                                (starting || profile_incomplete) && 'opacity-50 cursor-not-allowed',
                            )}
                        >
                            {starting ? 'Memulai…' : '🚀  Mulai Assessment Baru'}
                        </button>
                    </div>
                </div>

                {/* ── Stats row (only if there's history) ── */}
                {totalAttempts > 0 && (
                    <div className="fade-up grid grid-cols-3 gap-3" style={{ animationDelay: '0.1s' }}>
                        {[
                            { label: 'Percobaan', value: totalAttempts, color: 'text-blue-600' },
                            { label: 'Lulus',     value: passedCount,   color: 'text-green-600' },
                            { label: 'Skor terbaik', value: `${bestScore.toFixed(0)}%`, color: 'text-indigo-600' },
                        ].map(({ label, value, color }) => (
                            <div key={label} className="rounded-xl border bg-card px-3 py-3 text-center shadow-sm">
                                <p className={cn('text-lg font-bold', color)}>{value}</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{label}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── History ── */}
                {grouped.length === 0 ? (
                    <div className="fade-up flex flex-col items-center gap-3 py-14 text-center" style={{ animationDelay: '0.15s' }}>
                        <div className="rounded-full bg-muted p-4">
                            <GraduationCap className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium">Belum ada riwayat assessment</p>
                        <p className="text-xs text-muted-foreground">Mulai assessment pertamamu sekarang!</p>
                    </div>
                ) : (
                    <div className="fade-up space-y-4" style={{ animationDelay: '0.15s' }}>
                        <h2 className="text-sm font-semibold text-muted-foreground px-1">Riwayat</h2>

                        {grouped.map(([month, items]) => (
                            <div key={month} className="space-y-2">
                                {/* Month label */}
                                <div className="flex items-center gap-2 px-1">
                                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{month}</span>
                                </div>

                                {/* Session cards */}
                                <div className="space-y-3">
                                    {items.map(session => {
                                        const isInProgress = session.status === 'in_progress';
                                        const href = isInProgress
                                            ? `/assessment/${session.id}/quiz`
                                            : `/assessment/${session.id}/result`;

                                        return (
                                            <Link key={session.id} href={href} className="block">
                                                <div className={cn(
                                                    'flex items-center gap-3 rounded-xl border px-4 py-3.5 transition-all active:scale-[0.98]',
                                                    'hover:shadow-sm hover:border-border/80 bg-card',
                                                    isInProgress && 'border-yellow-300 dark:border-yellow-700 bg-yellow-50/50 dark:bg-yellow-950/10',
                                                    !isInProgress && session.passed && 'border-green-200 dark:border-green-800',
                                                    !isInProgress && !session.passed && session.passed !== null && 'border-red-200 dark:border-red-800',
                                                )}>
                                                    {/* Status icon */}
                                                    <div className={cn(
                                                        'shrink-0 h-9 w-9 rounded-full flex items-center justify-center',
                                                        isInProgress ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                                                        session.passed ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30',
                                                    )}>
                                                        {isInProgress
                                                            ? <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                                                            : session.passed
                                                                ? <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                                : <XCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
                                                        }
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className={cn(
                                                                'text-sm font-semibold',
                                                                !isInProgress && session.passed && 'text-green-700 dark:text-green-300',
                                                                !isInProgress && !session.passed && session.passed !== null && 'text-red-600 dark:text-red-400',
                                                            )}>
                                                                {isInProgress
                                                                    ? 'Sedang Berlangsung'
                                                                    : session.passed ? 'LULUS' : 'TIDAK LULUS'
                                                                }
                                                            </span>
                                                        </div>

                                                        {!isInProgress && session.percentage != null ? (
                                                            <div className="flex items-center gap-2 mt-1.5">
                                                                <ScoreBar percentage={Number(session.percentage)} passed={!!session.passed} />
                                                                <span className="text-xs text-muted-foreground">
                                                                    {session.score}/{session.total_questions} benar · {Number(session.percentage).toFixed(0)}%
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                                {new Date(session.started_at).toLocaleDateString('id-ID', {
                                                                    day: 'numeric', month: 'short', year: 'numeric',
                                                                })}
                                                            </p>
                                                        )}

                                                        {!isInProgress && session.completed_at && (
                                                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                                                {new Date(session.completed_at).toLocaleDateString('id-ID', {
                                                                    day: 'numeric', month: 'short', year: 'numeric',
                                                                })}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {(sessions.prev_page_url || sessions.next_page_url) && (
                    <div className="flex justify-between">
                        {sessions.prev_page_url
                            ? <Link href={sessions.prev_page_url}><Button variant="outline" size="sm">← Sebelumnya</Button></Link>
                            : <span />
                        }
                        {sessions.next_page_url
                            ? <Link href={sessions.next_page_url}><Button variant="outline" size="sm">Berikutnya →</Button></Link>
                            : <span />
                        }
                    </div>
                )}
            </div>
        </>
    );
}
