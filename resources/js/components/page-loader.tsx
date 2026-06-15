import { useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';

export function PageLoader() {
    const [visible, setVisible] = useState(false);
    const [progress, setProgress] = useState(0);
    const [leaving, setLeaving] = useState(false);
    const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const animRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const clearAll = () => {
            if (timeout.current) clearTimeout(timeout.current);
            if (animRef.current) clearTimeout(animRef.current);
        };

        const offStart = router.on('start', () => {
            clearAll();
            setLeaving(false);
            setProgress(0);
            // delay 150ms sebelum muncul agar fast navigation tidak flicker
            timeout.current = setTimeout(() => {
                setVisible(true);
                setProgress(30);
            }, 150);
        });

        const offProgress = router.on('progress', (e) => {
            const pct = e.detail.progress?.percentage;
            if (pct) setProgress(Math.min((pct / 100) * 90, 90));
        });

        const offFinish = router.on('finish', (e) => {
            clearAll();
            setProgress(100);
            animRef.current = setTimeout(() => {
                setLeaving(true);
                animRef.current = setTimeout(() => {
                    setVisible(false);
                    setProgress(0);
                    setLeaving(false);
                }, 300);
            }, 200);
        });

        return () => {
            clearAll();
            offStart();
            offProgress();
            offFinish();
        };
    }, []);

    if (!visible) return null;

    return (
        <>
            {/* Top progress bar */}
            <div
                className="fixed top-0 left-0 right-0 z-[9999] h-[3px] bg-primary/20 pointer-events-none"
            >
                <div
                    className="h-full bg-primary transition-all ease-out"
                    style={{
                        width: `${progress}%`,
                        transitionDuration: progress === 100 ? '200ms' : '600ms',
                        opacity: leaving ? 0 : 1,
                        transition: leaving
                            ? 'opacity 300ms ease'
                            : `width ${progress === 100 ? '200ms' : '600ms'} ease-out`,
                    }}
                />
            </div>
            {/* Subtle page dim overlay */}
            <div
                className="fixed inset-0 z-[9998] bg-background/30 pointer-events-none transition-opacity duration-300"
                style={{ opacity: leaving ? 0 : 1 }}
            />
        </>
    );
}
