import { Badge } from '@/components/ui/badge';

type RiskLevel = 'AA' | 'A' | 'B' | 'C';

const config: Record<RiskLevel, { label: string; className: string }> = {
    AA: { label: 'AA — Very High', className: 'bg-red-100 text-red-800 border-red-200' },
    A:  { label: 'A — High',      className: 'bg-orange-100 text-orange-800 border-orange-200' },
    B:  { label: 'B — Medium',    className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    C:  { label: 'C — Low',       className: 'bg-green-100 text-green-800 border-green-200' },
};

export function RiskBadge({ level }: { level: RiskLevel }) {
    const { label, className } = config[level] ?? config.C;
    return (
        <Badge variant="outline" className={className}>
            {label}
        </Badge>
    );
}
