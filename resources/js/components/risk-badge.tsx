import { Badge } from '@/components/ui/badge';
import { riskLabels } from '@/lib/risk';
import type { RiskLevel } from '@/lib/risk';
import { cn } from '@/lib/utils';

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
            className={cn('font-extrabold', key === 'AA' && 'bg-risk-extreme text-on-solid')}
        >
            {riskLabels[key]} · {key}
        </Badge>
    );
}
