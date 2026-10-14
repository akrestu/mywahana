import { Head } from '@inertiajs/react';
import { QuizRunner } from '@/components/quiz-runner';
import type { QuizQuestion } from '@/components/quiz-runner';

type Props = {
    session: {
        id: number;
        total_questions: number;
        remaining_seconds: number;
    };
    questions: QuizQuestion[];
};

export default function HrAssessmentQuiz({ session, questions }: Props) {
    return (
        <>
            <Head title="HR Assessment" />
            <QuizRunner
                submitUrl={`/hr-assessment/${session.id}/submit`}
                subtitle={'HR Assessment'}
                totalQuestions={session.total_questions}
                remainingSeconds={session.remaining_seconds}
                questions={questions}
                accent="purple"
            />
        </>
    );
}
