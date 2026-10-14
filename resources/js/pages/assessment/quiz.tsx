import { Head } from '@inertiajs/react';
import { QuizRunner } from '@/components/quiz-runner';
import type { QuizQuestion } from '@/components/quiz-runner';

type Props = {
    session: {
        id: number;
        departemen: string;
        tags: 'S' | 'NS';
        total_questions: number;
        remaining_seconds: number;
    };
    questions: QuizQuestion[];
};

export default function AssessmentQuiz({ session, questions }: Props) {
    return (
        <>
            <Head title="Assessment Safety" />
            <QuizRunner
                submitUrl={`/assessment/${session.id}/submit`}
                subtitle={`${session.departemen} · ${session.tags === 'S' ? 'Staff' : 'Non Staff'}`}
                totalQuestions={session.total_questions}
                remainingSeconds={session.remaining_seconds}
                questions={questions}
                accent="blue"
            />
        </>
    );
}
