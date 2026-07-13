import { Head, router } from '@inertiajs/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const DURATION_SECONDS = 45 * 60;

type SessionQuestion = {
    session_question_id: number;
    urutan: number;
    question: string;
    jawaban_1: string;
    jawaban_2: string;
    jawaban_3: string;
    jawaban_4: string;
    jawaban_user: number | null;
};

type SessionInfo = {
    id: number;
    total_questions: number;
    started_at: string;
};

type Props = {
    session: SessionInfo;
    questions: SessionQuestion[];
};

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export default function HrAssessmentQuiz({ session, questions }: Props) {
    const [answers, setAnswers] = useState<Record<number, number>>(() => {
        const init: Record<number, number> = {};

        for (const q of questions) {
            if (q.jawaban_user != null) {
init[q.session_question_id] = q.jawaban_user;
}
        }

        return init;
    });
    const [submitting, setSubmitting] = useState(false);

    const calcRemaining = useCallback(() => {
        const elapsed = Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000);

        return Math.max(0, DURATION_SECONDS - elapsed);
    }, [session.started_at]);

    const [remaining, setRemaining] = useState(calcRemaining);
    const submittingRef = useRef(false);
    const answersRef = useRef(answers);
    useEffect(() => {
 answersRef.current = answers; 
}, [answers]);

    useEffect(() => {
        const tick = setInterval(() => {
            const secs = calcRemaining();
            setRemaining(secs);

            if (secs === 0 && !submittingRef.current) {
                submittingRef.current = true;
                setSubmitting(true);
                router.post(`/hr-assessment/${session.id}/submit`, { answers: answersRef.current }, {
                    onFinish: () => setSubmitting(false),
                });
                clearInterval(tick);
            }
        }, 1000);

        return () => clearInterval(tick);
    }, [calcRemaining, session.id]);

    const answeredCount = Object.keys(answers).length;
    const total = session.total_questions;

    function selectAnswer(sqId: number, value: number) {
        setAnswers(prev => ({ ...prev, [sqId]: value }));
    }

    function handleSubmit() {
        if (answeredCount < total) {
            if (!confirm(`Masih ada ${total - answeredCount} soal yang belum dijawab. Lanjutkan submit?`)) {
return;
}
        }

        setSubmitting(true);
        router.post(`/hr-assessment/${session.id}/submit`, { answers }, {
            onFinish: () => setSubmitting(false),
        });
    }

    const progressPct = Math.round((answeredCount / total) * 100);
    const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
    const ss = String(remaining % 60).padStart(2, '0');
    const isUrgent = remaining <= 5 * 60;

    return (
        <>
            <Head title="HR Assessment" />
            <div className="mx-auto max-w-2xl px-4 py-6 space-y-5">

                {/* Sticky progress header */}
                <div className="sticky top-14 z-10 bg-background/95 backdrop-blur border-b pb-3 pt-1 space-y-2 lg:top-0">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">HR Assessment</span>
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                'font-mono font-semibold text-sm tabular-nums',
                                isUrgent ? 'text-red-500 animate-pulse' : 'text-muted-foreground',
                            )}>
                                ⏱ {mm}:{ss}
                            </span>
                            <Badge variant="outline">{answeredCount} / {total} dijawab</Badge>
                        </div>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                            className="h-full bg-purple-500 transition-all duration-300"
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                </div>

                {/* Questions */}
                {questions.map((q, idx) => {
                    const options = [q.jawaban_1, q.jawaban_2, q.jawaban_3, q.jawaban_4];

                    return (
                        <Card key={q.session_question_id} className="p-4 space-y-3">
                            <p className="text-sm font-medium leading-snug">
                                <span className="text-muted-foreground mr-2">{idx + 1}.</span>
                                {q.question}
                            </p>
                            <div className="grid gap-2">
                                {options.map((opt, i) => {
                                    const val = i + 1;
                                    const selected = answers[q.session_question_id] === val;

                                    return (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => selectAnswer(q.session_question_id, val)}
                                            className={cn(
                                                'flex items-start gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors',
                                                selected
                                                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30 dark:border-purple-400'
                                                    : 'border-border hover:bg-muted/50',
                                            )}
                                        >
                                            <span className={cn(
                                                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-semibold mt-0.5',
                                                selected
                                                    ? 'border-purple-500 bg-purple-500 text-white'
                                                    : 'border-muted-foreground text-muted-foreground',
                                            )}>
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

                {/* Submit */}
                <div className="pb-6">
                    <Button
                        className="w-full bg-purple-600 hover:bg-purple-700"
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
