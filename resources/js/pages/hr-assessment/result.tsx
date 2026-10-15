import { AssessmentResult } from '@/components/assessment/assessment-result';
import type {
    AttendanceInfo,
    ResultSession,
    ReviewItem,
} from '@/components/assessment/assessment-result';

type Props = {
    session: ResultSession;
    review: ReviewItem[];
    attendance: AttendanceInfo;
    attempts_today: number;
    daily_limit: number;
    can_retry: boolean;
};

export default function HrAssessmentResult({
    session,
    review,
    attendance,
    attempts_today,
    daily_limit,
    can_retry,
}: Props) {
    return (
        <AssessmentResult
            kind="hr"
            title="Assessment HR"
            session={session}
            review={review}
            attendance={attendance}
            attemptsToday={attempts_today}
            dailyLimit={daily_limit}
            canRetry={can_retry}
        />
    );
}
