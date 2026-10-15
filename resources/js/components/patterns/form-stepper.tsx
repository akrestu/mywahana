import type { ReactNode } from 'react';

/**
 * Multi-step form frame: progress bar on top, sticky footer with the
 * secondary action on the left and the primary action on the right.
 */
export function FormStepper({
    step,
    total,
    labels,
    children,
    secondary,
    primary,
}: {
    step: number;
    total: number;
    labels?: string[];
    children: ReactNode;
    secondary?: ReactNode;
    primary: ReactNode;
}) {
    const label = labels?.[step - 1];

    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
                <div
                    className="flex gap-1.5"
                    role="progressbar"
                    aria-valuemin={1}
                    aria-valuemax={total}
                    aria-valuenow={step}
                    aria-valuetext={
                        label
                            ? `Langkah ${step}: ${label}`
                            : `Langkah ${step} dari ${total}`
                    }
                >
                    {Array.from({ length: total }, (_, i) => (
                        <span
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i < step ? 'bg-foreground' : 'bg-border'}`}
                        />
                    ))}
                </div>
                {label && <p className="text-sm font-semibold">{label}</p>}
            </div>

            <div
                key={step}
                className="flex animate-in flex-col gap-4 duration-300 fade-in-0 slide-in-from-right-4"
            >
                {children}
            </div>

            <div className="sticky bottom-0 z-10 -mx-4 flex gap-3 bg-gradient-to-t from-background via-background to-background/0 px-4 pt-6 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:bottom-0 lg:mx-0 lg:px-0">
                {secondary && (
                    <div className="flex-1 [&>*]:w-full">{secondary}</div>
                )}
                <div className="flex-[2] [&>*]:w-full">{primary}</div>
            </div>
        </div>
    );
}
