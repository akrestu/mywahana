import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface Props {
    open: boolean;
    progress?: number | null;
    label?: string;
}

export function UploadOverlay({ open, progress, label = 'Menyimpan...' }: Props) {
    if (!open) {
return null;
}

    const pct = Math.min(Math.round(progress ?? 0), 100);
    const hasProgress = progress != null && progress > 0;

    return (
        <div
            className="fixed inset-0 z-[9990] flex items-center justify-center bg-background/80 backdrop-blur-md"
            aria-modal="true"
            role="dialog"
        >
            <div className="flex w-72 flex-col items-center gap-6 rounded-3xl border bg-card px-8 py-10 shadow-2xl">
                {/* Spinner with pulsing ring */}
                <div className="relative flex items-center justify-center">
                    <span className="absolute size-20 animate-ping rounded-full bg-primary/20" />
                    <span className="absolute size-16 rounded-full bg-primary/10" />
                    <Loader2 size={40} className="relative text-primary animate-spin" />
                </div>

                {/* Label */}
                <div className="text-center">
                    <p className="text-base font-bold text-foreground">{label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Mohon tunggu sebentar...</p>
                </div>

                {/* Progress */}
                {hasProgress && (
                    <div className="w-full flex flex-col gap-2">
                        <Progress value={pct} className="h-2.5" />
                        <p className="text-center text-sm font-semibold tabular-nums text-muted-foreground">
                            {pct}%
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
