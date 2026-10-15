import { useEffect, useRef } from 'react';

/**
 * Keeps a form draft in localStorage so a dropped signal or closed tab does
 * not lose what the worker already filled in. Storage failures are ignored.
 */
export function useDraft<T extends object>(
    key: string,
    data: T,
    restore: (draft: Partial<T>) => void,
    isValid: (draft: Partial<T>) => boolean = () => true,
) {
    const storageKey = `draft:${key}`;
    const restored = useRef(false);

    useEffect(() => {
        if (restored.current) {
            return;
        }

        restored.current = true;

        try {
            const raw = localStorage.getItem(storageKey);

            if (raw) {
                const draft = JSON.parse(raw) as Partial<T>;

                if (isValid(draft)) {
                    restore(draft);
                } else {
                    localStorage.removeItem(storageKey);
                }
            }
        } catch {
            // Storage blocked or draft corrupt: start fresh.
        }
        // Restore only once on mount.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!restored.current) {
            return;
        }

        try {
            localStorage.setItem(storageKey, JSON.stringify(data));
        } catch {
            // Ignore quota or privacy-mode errors.
        }
    }, [storageKey, data]);

    return {
        clear: () => {
            try {
                localStorage.removeItem(storageKey);
            } catch {
                // Ignore.
            }
        },
    };
}
