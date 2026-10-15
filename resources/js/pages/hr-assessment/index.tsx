import { AssessmentHome } from '@/components/assessment/assessment-home';
import type { SessionPage } from '@/components/assessment/assessment-home';

type Props = {
    sessions: SessionPage;
    question_count: number;
    attempts_today: number;
    daily_limit: number;
    can_start: boolean;
};

export default function HrAssessmentIndex({
    sessions,
    question_count,
    attempts_today,
    daily_limit,
    can_start,
}: Props) {
    return (
        <AssessmentHome
            kind="hr"
            title="Assessment HR"
            sessions={sessions}
            questionCount={question_count}
            attemptsToday={attempts_today}
            dailyLimit={daily_limit}
            canStart={can_start}
        />
    );
}
