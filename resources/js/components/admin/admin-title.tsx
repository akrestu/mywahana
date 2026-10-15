import type { ReactNode } from 'react';

/** Admin page title block: section eyebrow, large title, optional note. */
export function AdminTitle({
    eyebrow,
    title,
    description,
}: {
    eyebrow: string;
    title: ReactNode;
    description?: ReactNode;
}) {
    return (
        <div>
            <p className="text-xs font-semibold text-muted-foreground">
                {eyebrow}
            </p>
            <h1 className="text-[28px] font-extrabold tracking-tight">
                {title}
            </h1>
            {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
            )}
        </div>
    );
}
