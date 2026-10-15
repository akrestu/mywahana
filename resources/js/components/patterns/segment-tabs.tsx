import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';

export type SegmentTab<K extends string> = {
    key: K;
    label: string;
    count?: number;
};

/** Pill segmented control used for list tabs (e.g. Saya · Perlu tindakan · Riwayat). */
export function SegmentTabs<K extends string>({
    tabs,
    value,
    onChange,
    label,
}: {
    tabs: SegmentTab<K>[];
    value: K;
    onChange: (key: K) => void;
    label: string;
}) {
    return (
        <div
            role="tablist"
            aria-label={label}
            className="flex rounded-full bg-muted p-1"
        >
            {tabs.map((t) => {
                const selected = value === t.key;

                return (
                    <button
                        key={t.key}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        onClick={() => onChange(t.key)}
                        className={cn(
                            'flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-full px-2 text-[13px] leading-tight transition-all duration-200 focus-visible:outline-2 focus-visible:outline-ring',
                            selected
                                ? 'bg-card font-bold shadow-[0_1px_2px_oklch(0.191_0_0/0.08)] dark:bg-primary dark:text-primary-foreground'
                                : 'font-semibold text-muted-foreground hover:text-foreground',
                        )}
                    >
                        {t.label}
                        {!!t.count && t.count > 0 && (
                            <span className="tabular flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-extrabold text-accent-foreground">
                                {t.count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

/** Previous / next links for Laravel simple pagination. */
export function Pager({
    prev,
    next,
}: {
    prev: string | null;
    next: string | null;
}) {
    if (!prev && !next) {
        return null;
    }

    return (
        <div className="flex justify-between gap-3">
            {prev ? (
                <Link
                    href={prev}
                    preserveScroll={false}
                    className="flex h-11 items-center rounded-full border border-border bg-card px-5 text-sm font-semibold hover:bg-muted"
                >
                    ← Sebelumnya
                </Link>
            ) : (
                <span />
            )}
            {next && (
                <Link
                    href={next}
                    preserveScroll={false}
                    className="flex h-11 items-center rounded-full border border-border bg-card px-5 text-sm font-semibold hover:bg-muted"
                >
                    Berikutnya →
                </Link>
            )}
        </div>
    );
}
