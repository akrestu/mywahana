import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Selected / idle surface for card-like options (tiles, list rows, quiz answers). */
export function choiceSurface(on: boolean) {
    return on
        ? 'border-2 border-foreground bg-accent-soft'
        : 'border border-border bg-card hover:bg-muted';
}

/** Selected / idle fill for pill chips (Ya/Tidak, jam tidur, skor). */
export function choiceChip(on: boolean, danger = false) {
    if (!on) {
        return 'border border-border bg-card hover:bg-muted';
    }

    return danger
        ? 'border-2 border-destructive bg-destructive text-destructive-foreground'
        : 'border-2 border-primary bg-primary text-primary-foreground';
}

/** Large radio option (at least 52 px tall) for shift, yes/no and similar choices. */
export function ChoiceCard({
    name,
    value,
    checked,
    onChange,
    title,
    description,
    icon,
    className,
}: {
    name: string;
    value: string;
    checked: boolean;
    onChange: (value: string) => void;
    title: ReactNode;
    description?: ReactNode;
    icon?: ReactNode;
    className?: string;
}) {
    return (
        <label
            className={cn(
                'flex min-h-[52px] cursor-pointer items-center gap-3 rounded-lg p-4 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
                choiceSurface(checked),
                className,
            )}
        >
            <input
                type="radio"
                name={name}
                value={value}
                checked={checked}
                onChange={() => onChange(value)}
                className="sr-only"
            />
            {icon && (
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
                    {icon}
                </span>
            )}
            <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-bold">{title}</span>
                {description && (
                    <span className="block text-xs text-muted-foreground">
                        {description}
                    </span>
                )}
            </span>
            <span
                aria-hidden
                className={cn(
                    'flex size-5 shrink-0 items-center justify-center rounded-full border-2',
                    checked ? 'border-foreground' : 'border-border',
                )}
            >
                {checked && (
                    <span className="size-2.5 rounded-full bg-foreground" />
                )}
            </span>
        </label>
    );
}
