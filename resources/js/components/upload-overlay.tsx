interface Props {
    open: boolean;
    progress?: number | null;
    label?: string;
}

const RING_RADIUS = 42;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

/**
 * Full-screen sending state for form submissions. Follows the error and
 * result screens: logo at the centre, topo motif, extrabold title and the
 * ink-on-border progress track used by FormStepper.
 */
export function UploadOverlay({
    open,
    progress,
    label = 'Menyimpan...',
}: Props) {
    if (!open) {
        return null;
    }

    const pct = Math.min(Math.round(progress ?? 0), 100);
    const uploading = progress != null && progress > 0 && pct < 100;
    const phase = uploading
        ? `Mengunggah lampiran · ${pct}%`
        : 'Menyimpan ke server, mohon tunggu sebentar.';

    return (
        <div
            className="fixed inset-0 isolate z-[9990] flex animate-in flex-col items-center justify-center overflow-hidden bg-background px-6 py-12 duration-200 fade-in-0"
            role="dialog"
            aria-modal="true"
            aria-busy="true"
            aria-labelledby="upload-overlay-title"
            aria-describedby="upload-overlay-phase"
        >
            <img
                src="/images/topo.png"
                alt=""
                aria-hidden
                className="pointer-events-none absolute -right-[280px] -bottom-[160px] -z-10 w-[760px] max-w-none opacity-30 dark:opacity-10 dark:invert"
            />

            <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
                <div className="relative flex size-24 items-center justify-center">
                    <svg
                        viewBox="0 0 96 96"
                        aria-hidden
                        className={`absolute inset-0 size-full -rotate-90 ${uploading ? '' : 'motion-safe:animate-[spin_1.1s_linear_infinite]'}`}
                    >
                        <circle
                            cx="48"
                            cy="48"
                            r={RING_RADIUS}
                            fill="none"
                            strokeWidth="4"
                            className="stroke-border"
                        />
                        <circle
                            cx="48"
                            cy="48"
                            r={RING_RADIUS}
                            fill="none"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeDasharray={RING_LENGTH}
                            strokeDashoffset={
                                uploading
                                    ? RING_LENGTH * (1 - pct / 100)
                                    : RING_LENGTH * 0.72
                            }
                            className="stroke-foreground transition-[stroke-dashoffset] duration-300"
                        />
                    </svg>
                    <img src="/logo.png" alt="" className="size-12" />
                </div>

                <div className="space-y-2">
                    <h1
                        id="upload-overlay-title"
                        className="text-xl font-extrabold tracking-tight"
                    >
                        {label}
                    </h1>
                    <p
                        id="upload-overlay-phase"
                        className="tabular text-sm leading-relaxed text-muted-foreground"
                        aria-live="polite"
                    >
                        {phase}
                    </p>
                </div>

                <div className="w-full">
                    <div
                        className="h-1.5 w-full overflow-hidden rounded-full bg-border"
                        role="progressbar"
                        aria-label="Progres pengiriman"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={uploading ? pct : undefined}
                    >
                        <div
                            className={`h-full rounded-full bg-foreground transition-[width] duration-300 ${uploading ? '' : 'motion-safe:animate-pulse'}`}
                            style={{ width: `${uploading ? pct : 100}%` }}
                        />
                    </div>
                </div>

                <p className="text-xs text-muted-foreground">
                    Jangan tutup aplikasi atau pindah halaman sampai selesai.
                </p>

                <p className="pt-4 text-xs text-muted-foreground/60">
                    Datang sehat — kerja aman — pulang selamat
                </p>
            </div>
        </div>
    );
}
