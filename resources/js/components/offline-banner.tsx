import { WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';

/** Thin banner shown while the device has no connection. Drafts stay on the device. */
export function OfflineBanner() {
    const [online, setOnline] = useState(() =>
        typeof navigator === 'undefined' ? true : navigator.onLine,
    );

    useEffect(() => {
        const up = () => setOnline(true);
        const down = () => setOnline(false);
        window.addEventListener('online', up);
        window.addEventListener('offline', down);

        return () => {
            window.removeEventListener('online', up);
            window.removeEventListener('offline', down);
        };
    }, []);

    if (online) {
        return null;
    }

    return (
        <div
            role="status"
            className="sticky top-0 z-30 flex items-center justify-center gap-2 bg-[oklch(0.191_0_0)] px-4 py-2 pt-[calc(0.5rem+env(safe-area-inset-top))] text-xs font-semibold text-white"
        >
            <WifiOff className="size-3.5 text-accent" />
            Offline · isian form tetap tersimpan di perangkat ini
        </div>
    );
}
