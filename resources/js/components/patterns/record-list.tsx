import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { EmptyState } from '@/components/patterns/empty-state';
import { SectionLabel } from '@/components/patterns/module-header';
import { Pager } from '@/components/patterns/segment-tabs';
import { cn } from '@/lib/utils';

export type RecordRow = {
    key: string | number;
    href: string;
    tanggal: string;
    title: string;
    subtitle: string;
    status: {
        label: string;
        tone: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'ink';
    };
    action?: string;
};

const TONE = {
    success: 'bg-success-soft text-success',
    warning: 'bg-warning-soft text-warning',
    danger: 'bg-destructive-soft text-destructive',
    info: 'bg-info-soft text-info',
    neutral: 'bg-muted text-foreground',
    ink: 'bg-primary text-primary-foreground',
};

/** Month-grouped list of submissions with status chip and pager. */
export function RecordList({
    rows,
    prev,
    next,
    empty,
}: {
    rows: RecordRow[];
    prev: string | null;
    next: string | null;
    empty: { icon: LucideIcon; title: string; description?: string };
}) {
    if (rows.length === 0) {
        return (
            <EmptyState
                icon={empty.icon}
                title={empty.title}
                description={empty.description}
            />
        );
    }

    const groups: Record<string, RecordRow[]> = {};

    for (const r of rows) {
        const k = new Date(r.tanggal).toLocaleDateString('id-ID', {
            month: 'long',
            year: 'numeric',
        });
        (groups[k] ??= []).push(r);
    }

    return (
        <div className="flex flex-col gap-4">
            {Object.entries(groups).map(([month, items]) => (
                <section key={month} className="flex flex-col gap-2">
                    <SectionLabel>{month}</SectionLabel>
                    <ul className="overflow-hidden rounded-lg bg-card">
                        {items.map((r) => {
                            return (
                                <li
                                    key={r.key}
                                    className="border-b border-border/60 last:border-0"
                                >
                                    <Link
                                        href={r.href}
                                        className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted"
                                    >
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-bold">
                                                {r.title}
                                            </span>
                                            <span className="block truncate text-xs text-muted-foreground">
                                                {r.subtitle}
                                            </span>
                                        </span>
                                        {r.action ? (
                                            <span className="shrink-0 rounded-full bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground">
                                                {r.action}
                                            </span>
                                        ) : (
                                            <span
                                                className={cn(
                                                    'shrink-0 rounded-full px-2.5 py-[5px] text-[11px] font-bold',
                                                    TONE[r.status.tone],
                                                )}
                                            >
                                                {r.status.label}
                                            </span>
                                        )}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </section>
            ))}
            <Pager prev={prev} next={next} />
        </div>
    );
}
