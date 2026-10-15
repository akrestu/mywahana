import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/*
 * Loading placeholders from DSKomponen "State · Loading": 40px tiles with two
 * text bars, a 64px block, shimmer 1.2 s. Shapes mirror the real layouts so
 * content does not jump when it arrives.
 */

/** One list row: icon tile, title bar and subtitle bar. */
function RowSkeleton({ i }: { i: number }) {
    return (
        <div className="flex items-center gap-3 px-4 py-3.5">
            <Skeleton className="size-10 shrink-0 rounded-[14px]" />
            <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton
                    className="h-2.5"
                    style={{ width: `${70 - (i % 3) * 10}%` }}
                />
                <Skeleton
                    className="h-2 opacity-70"
                    style={{ width: `${45 - (i % 2) * 10}%` }}
                />
            </div>
        </div>
    );
}

/** Card of list rows, as used by RecordList and the inbox. */
export function ListSkeleton({
    rows = 3,
    className,
}: {
    rows?: number;
    className?: string;
}) {
    return (
        <div
            role="status"
            aria-label="Memuat…"
            className={cn(
                'divide-y divide-border/60 overflow-hidden rounded-lg bg-card',
                className,
            )}
        >
            {Array.from({ length: rows }, (_, i) => (
                <RowSkeleton key={i} i={i} />
            ))}
        </div>
    );
}

/** Employee/module page: header, summary block and a list. */
export function ModuleSkeleton() {
    return (
        <div
            role="status"
            aria-label="Memuat halaman…"
            className="flex flex-col gap-4 pt-2"
        >
            <div className="flex items-center gap-3 pb-2">
                <Skeleton className="size-11 shrink-0" />
                <div className="flex flex-1 flex-col gap-2">
                    <Skeleton className="h-2.5 w-24 opacity-70" />
                    <Skeleton className="h-4 w-48" />
                </div>
            </div>
            <Skeleton className="h-16 w-full rounded-[16px]" />
            <Skeleton className="h-2.5 w-28 opacity-70" />
            <ListSkeleton rows={4} />
        </div>
    );
}

/** Admin page: title, filter chips and a bordered table. */
export function AdminTableSkeleton() {
    return (
        <div
            role="status"
            aria-label="Memuat halaman…"
            className="flex flex-col gap-[18px]"
        >
            <div className="flex flex-col gap-2.5">
                <Skeleton className="h-2.5 w-24 opacity-70" />
                <Skeleton className="h-7 w-64" />
            </div>
            <div className="flex flex-wrap gap-2">
                <Skeleton className="h-10 w-64 rounded-[12px]" />
                {[96, 112, 104, 120].map((w) => (
                    <Skeleton
                        key={w}
                        className="h-10"
                        style={{ width: w }}
                    />
                ))}
            </div>
            <div className="overflow-hidden rounded-lg border border-border bg-card">
                <div className="flex gap-6 bg-background px-4 py-3.5">
                    {[48, 96, 72, 120, 80].map((w, i) => (
                        <Skeleton
                            key={i}
                            className="h-2 opacity-70"
                            style={{ width: w }}
                        />
                    ))}
                </div>
                {Array.from({ length: 6 }, (_, i) => (
                    <div
                        key={i}
                        className="flex items-center gap-6 border-t border-border/60 px-4 py-3.5"
                    >
                        <Skeleton className="size-5 rounded-[6px]" />
                        <Skeleton
                            className="h-2.5"
                            style={{ width: 96 + (i % 3) * 24 }}
                        />
                        <Skeleton className="h-2.5 w-20 opacity-70" />
                        <Skeleton className="h-2.5 flex-1 opacity-70" />
                        <Skeleton className="h-5 w-16" />
                    </div>
                ))}
            </div>
        </div>
    );
}
