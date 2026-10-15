import { Badge } from '@/components/ui/badge';
import { riskLabels } from '@/lib/risk';
import type { RiskLevel } from '@/lib/risk';

const variants: Record<RiskLevel, 'success' | 'warning' | 'danger'> = {
    AA: 'danger',
    A: 'danger',
    B: 'warning',
    C: 'success',
};

export function RiskBadge({ level }: { level: RiskLevel }) {
    const key = level in variants ? level : 'C';

    return (
        <Badge
            variant={variants[key]}
            className={key === 'AA' ? 'bg-risk-extreme text-white dark:text-[oklch(0.191_0_0)]' : undefined}
        >
            <span className="font-bold tabular">{key}</span>
            {riskLabels[key]}
        </Badge>
    );
}
