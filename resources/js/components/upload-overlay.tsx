import { Loader2 } from 'lucide-react';

interface Props {
    open: boolean;
    progress?: number | null;
    label?: string;
}

export function UploadOverlay({ open, progress, label = 'Menyimpan...' }: Props) {
    if (!open) return null;

    const hasProgress = progress != null && progress > 0;

    return (
        <div className="fixed inset-0 z-[9990] flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4 rounded-2xl border bg-card px-10 py-8 shadow-xl">
                <Loader2 size={36} className="text-primary animate-spin" />
                <p className="text-sm font-semibold text-foreground">{label}</p>
                {hasProgress && (
                    <div className="w-48">
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div
                                className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
                                style={{ width: `${Math.min(progress!, 100)}%` }}
                            />
                        </div>
                        <p className="mt-1.5 text-center text-xs text-muted-foreground">
                            {Math.round(Math.min(progress!, 100))}%
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
