import { AssessmentHome } from '@/components/assessment/assessment-home';
import type { SessionPage } from '@/components/assessment/assessment-home';

type Props = {
    sessions: SessionPage;
    user: {
        departemen: string | null;
        tags: 'S' | 'NS' | null;
        question_count: number | null;
    };
    profile_incomplete: boolean;
    attempts_today: number;
    daily_limit: number;
    can_start: boolean;
};

export default function AssessmentIndex({
    sessions,
    user,
    profile_incomplete,
    attempts_today,
    daily_limit,
    can_start,
}: Props) {
    const level = user.tags
        ? user.tags === 'S'
            ? 'Staff'
            : 'Non staff'
        : null;

    return (
        <AssessmentHome
            kind="safety"
            title="Assessment Safety"
            meta={[user.departemen, level].filter(Boolean).join(' · ') || null}
            sessions={sessions}
            questionCount={user.question_count}
            attemptsToday={attempts_today}
            dailyLimit={daily_limit}
            canStart={can_start}
            profileIncomplete={profile_incomplete}
        />
    );
}
