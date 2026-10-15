import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const tones = {
    success: 'bg-success-soft text-success',
    warning: 'bg-warning-soft text-warning',
    danger: 'bg-destructive-soft text-destructive',
    accent: 'bg-accent text-accent-foreground',
};

/** Outcome screen after a submission: icon, title, summary and up to two CTAs. */
export function ResultScreen({
    icon: Icon,
    tone = 'success',
    title,
    description,
    children,
    actions,
}: {
    icon: LucideIcon;
    tone?: keyof typeof tones;
    title: string;
    description?: ReactNode;
    children?: ReactNode;
    actions?: ReactNode;
}) {
    return (
        <div className="relative flex flex-col items-center gap-5 overflow-hidden py-8 text-center">
            <div
                aria-hidden
                className="topo-motif pointer-events-none absolute inset-x-0 top-0 h-56"
            />
            <span
                className={cn(
                    'relative flex size-20 animate-in items-center justify-center rounded-full duration-500 zoom-in-75',
                    tones[tone],
                )}
            >
                <Icon className="size-9" strokeWidth={1.8} />
            </span>
            <div className="relative flex flex-col gap-2" aria-live="polite">
                <h1 className="text-2xl font-extrabold tracking-tight">
                    {title}
                </h1>
                {description && (
                    <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {children && (
                <div className="relative w-full text-left">{children}</div>
            )}
            {actions && (
                <div className="relative flex w-full flex-col gap-3 sm:flex-row-reverse [&>*]:flex-1">
                    {actions}
                </div>
            )}
        </div>
    );
}
