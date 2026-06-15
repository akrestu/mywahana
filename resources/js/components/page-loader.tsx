import { useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';

export function PageLoader() {
    const [visible, setVisible] = useState(false);
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
            timeout.current = setTimeout(() => {
                setVisible(true);
            }, 150);
        });

        const offFinish = router.on('finish', () => {
            clearAll();
            animRef.current = setTimeout(() => {
                setLeaving(true);
                animRef.current = setTimeout(() => {
                    setVisible(false);
                    setLeaving(false);
                }, 300);
            }, 200);
        });

        return () => {
            clearAll();
            offStart();
            offFinish();
        };
    }, []);

    if (!visible) return null;

    return (
        <>
            <style>{`
                .page-loader-spinner {
                    width: 40px;
                    height: 40px;
                    --c: no-repeat linear-gradient(orange 0 0);
                    background: var(--c), var(--c), var(--c), var(--c);
                    background-size: 21px 21px;
                    animation: page-loader-l5 1.5s infinite cubic-bezier(0.3,1,0,1);
                }
                @keyframes page-loader-l5 {
                    0%   { background-position: 0 0, 100% 0, 100% 100%, 0 100%; }
                    33%  { background-position: 0 0, 100% 0, 100% 100%, 0 100%; width: 60px; height: 60px; }
                    66%  { background-position: 100% 0, 100% 100%, 0 100%, 0 0; width: 60px; height: 60px; }
                    100% { background-position: 100% 0, 100% 100%, 0 100%, 0 0; }
                }
            `}</style>
            <div
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-white dark:bg-black pointer-events-none transition-opacity duration-300"
                style={{ opacity: leaving ? 0 : 1 }}
            >
                <div className="page-loader-spinner" />
            </div>
        </>
    );
}
