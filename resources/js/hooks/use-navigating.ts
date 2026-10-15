import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

/**
 * Path of the page being navigated to, or null when idle. Only full page
 * visits count: partial reloads and state-preserving visits (filters, pagers)
 * keep the current content on screen. A short delay avoids flashing a
 * skeleton on fast transitions.
 */
export function useNavigating(delay = 150): string | null {
    const [target, setTarget] = useState<string | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const clear = () => {
            if (timer.current) {
                clearTimeout(timer.current);
                timer.current = null;
            }
        };

        const offStart = router.on('start', (event) => {
            const visit = event.detail.visit;

            if (
                visit.method.toLowerCase() !== 'get' ||
                visit.only.length > 0 ||
                visit.preserveState === true
            ) {
                return;
            }

            clear();
            timer.current = setTimeout(
                () => setTarget(visit.url.pathname),
                delay,
            );
        });

        const offFinish = router.on('finish', () => {
            clear();
            setTarget(null);
        });

        return () => {
            clear();
            offStart();
            offFinish();
        };
    }, [delay]);

    return target;
}
