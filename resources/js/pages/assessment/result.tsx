import { AssessmentResult } from '@/components/assessment/assessment-result';
import type {
    AttendanceInfo,
    ResultSession,
    ReviewItem,
} from '@/components/assessment/assessment-result';

type Props = {
    session: ResultSession & { departemen: string; tags: 'S' | 'NS' };
    review: ReviewItem[];
    attendance: AttendanceInfo;
    attempts_today: number;
    daily_limit: number;
    can_retry: boolean;
};

export default function AssessmentResultPage({
    session,
    review,
    attendance,
    attempts_today,
    daily_limit,
    can_retry,
}: Props) {
    return (
        <AssessmentResult
            kind="safety"
            title="Assessment Safety"
            meta={[
                session.departemen,
                session.tags === 'S' ? 'Staff' : 'Non staff',
            ]
                .filter(Boolean)
                .join(' · ')}
            session={session}
            review={review}
            attendance={attendance}
            attemptsToday={attempts_today}
            dailyLimit={daily_limit}
            canRetry={can_retry}
        />
    );
}
