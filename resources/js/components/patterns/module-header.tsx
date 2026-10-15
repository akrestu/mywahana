import { Link } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';

/** Page header used inside modules: back button, eyebrow, title, optional step counter. */
export function ModuleHeader({
    backHref,
    eyebrow,
    title,
    step,
    actions,
}: {
    backHref?: string;
    eyebrow?: string;
    title: string;
    step?: { current: number; total: number };
    actions?: ReactNode;
}) {
    return (
        <div className="flex items-center gap-3 pb-2">
            {backHref && (
                <Link
                    href={backHref}
                    aria-label="Kembali"
                    className="flex size-11 shrink-0 items-center justify-center rounded-full bg-card shadow-[0_1px_2px_oklch(0.191_0_0/0.06)] transition-colors hover:bg-muted"
                >
                    <ChevronLeft className="size-5" strokeWidth={1.8} />
                </Link>
            )}
            <div className="min-w-0 flex-1">
                {eyebrow && (
                    <div className="text-xs text-muted-foreground">
                        {eyebrow}
                    </div>
                )}
                <h1 className="truncate text-xl font-extrabold tracking-tight">
                    {title}
                </h1>
            </div>
            {step && (
                <span
                    className="tabular shrink-0 text-sm font-semibold text-muted-foreground"
                    aria-label={`Langkah ${step.current} dari ${step.total}`}
                >
                    {step.current}/{step.total}
                </span>
            )}
            {actions}
        </div>
    );
}

/** Uppercase section label used across module pages. */
export function SectionLabel({
    children,
    action,
}: {
    children: ReactNode;
    action?: ReactNode;
}) {
    return (
        <div className="mt-1 flex items-baseline justify-between">
            <h2 className="text-xs font-bold tracking-[0.12em] text-muted-foreground uppercase">
                {children}
            </h2>
            {action}
        </div>
    );
}
