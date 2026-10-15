export default function Heading({
    title,
    description,
    variant = 'default',
}: {
    title: string;
    description?: string;
    variant?: 'default' | 'small';
}) {
    return (
        <header className={variant === 'small' ? '' : 'mb-4 space-y-0.5'}>
            <h2
                className={
                    variant === 'small'
                        ? 'mb-0.5 text-sm font-bold'
                        : 'text-lg font-extrabold tracking-tight'
                }
            >
                {title}
            </h2>
            {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
            )}
        </header>
    );
}
