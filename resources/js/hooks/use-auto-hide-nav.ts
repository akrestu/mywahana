import { useEffect, useRef, useState } from 'react';

const THRESHOLD = 8;

export function useAutoHideNav(resetKey?: string) {
    const [visible, setVisible] = useState(true);
    const lastY = useRef(0);

    useEffect(() => {
        lastY.current = window.scrollY;

        // eslint-disable-next-line react-hooks/set-state-in-effect -- resets nav visibility when navigating to a new page
        setVisible(true);
    }, [resetKey]);

    useEffect(() => {
        const onScroll = () => {
            const currentY = window.scrollY;

            if (currentY < THRESHOLD) {
                setVisible(true);
                lastY.current = currentY;

                return;
            }

            const delta = currentY - lastY.current;

            if (delta > THRESHOLD) {
                setVisible(false);
                lastY.current = currentY;
            } else if (delta < -THRESHOLD) {
                setVisible(true);
                lastY.current = currentY;
            }
        };

        window.addEventListener('scroll', onScroll, { passive: true });

        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return visible;
}
