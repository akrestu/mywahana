import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

/** Empty list placeholder with the contour motif. */
export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
}: {
    icon: LucideIcon;
    title: string;
    description?: string;
    action?: ReactNode;
}) {
    return (
        <div className="relative flex flex-col items-center gap-3 overflow-hidden rounded-lg bg-card px-6 py-10 text-center">
            <div
                aria-hidden
                className="topo-motif pointer-events-none absolute inset-0"
            />
            <span className="relative flex size-12 items-center justify-center rounded-full bg-muted">
                <Icon
                    className="size-5 text-muted-foreground"
                    strokeWidth={1.8}
                />
            </span>
            <div className="relative">
                <p className="font-bold">{title}</p>
                {description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {action && <div className="relative mt-1">{action}</div>}
        </div>
    );
}
