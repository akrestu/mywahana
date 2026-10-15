import { router } from '@inertiajs/react';
import { CloudUpload, WifiOff } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { flushQueue, listQueued, QUEUE_EVENT } from '@/lib/offline-queue';

/**
 * Shows connection state and the offline outbox, and sends queued forms as
 * soon as the device is back online.
 */
export function OfflineBanner() {
    const [online, setOnline] = useState(() =>
        typeof navigator === 'undefined' ? true : navigator.onLine,
    );
    const [queued, setQueued] = useState(0);
    const [sending, setSending] = useState(false);

    const refresh = useCallback(
        async () => setQueued((await listQueued()).length),
        [],
    );

    const send = useCallback(async () => {
        if ((await listQueued()).length === 0) {
            return;
        }

        setSending(true);
        const { sent, rejected } = await flushQueue();
        setSending(false);

        if (sent > 0) {
            toast.success(
                `${sent} laporan dari mode offline berhasil dikirim.`,
            );
            router.reload();
        }

        rejected.forEach((label) =>
            toast.error(`${label} ditolak server. Silakan isi ulang.`),
        );
    }, []);

    useEffect(() => {
        const up = () => {
            setOnline(true);
            void send();
        };
        const down = () => setOnline(false);
        const changed = () => void refresh();

        window.addEventListener('online', up);
        window.addEventListener('offline', down);
        window.addEventListener(QUEUE_EVENT, changed);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- initial read of the IndexedDB outbox
        void refresh();
        void send();

        return () => {
            window.removeEventListener('online', up);
            window.removeEventListener('offline', down);
            window.removeEventListener(QUEUE_EVENT, changed);
        };
    }, [refresh, send]);

    if (online && queued === 0) {
        return null;
    }

    return (
        <div
            role="status"
            className="sticky top-0 z-30 flex items-center justify-center gap-2 bg-[oklch(0.191_0_0)] px-4 py-2 pt-[calc(0.5rem+env(safe-area-inset-top))] text-xs font-semibold text-white"
        >
            {online ? (
                <CloudUpload className="size-3.5 text-accent" />
            ) : (
                <WifiOff className="size-3.5 text-accent" />
            )}
            {online
                ? sending
                    ? `Mengirim ${queued} laporan antre…`
                    : `${queued} laporan antre`
                : queued > 0
                  ? `Offline · ${queued} laporan antre, dikirim otomatis saat online`
                  : 'Offline · isian form tetap tersimpan di perangkat ini'}
            {online && !sending && queued > 0 && (
                <button
                    type="button"
                    onClick={() => void send()}
                    className="ml-1 rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-bold text-accent-foreground"
                >
                    Kirim
                </button>
            )}
        </div>
    );
}
