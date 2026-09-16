import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);

    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function usePushNotification() {
    const { auth, vapidPublicKey } = usePage().props;
    const userId = auth?.user?.id;

    useEffect(() => {
        if (!userId || !vapidPublicKey) {
            return;
        }

        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            return;
        }

        async function subscribe() {
            const reg = await navigator.serviceWorker.register('/sw.js');

            const permission = await Notification.requestPermission();

            if (permission !== 'granted') {
                return;
            }

            const existing = await reg.pushManager.getSubscription();
            const sub =
                existing ??
                (await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: (() => {
                        const key = urlBase64ToUint8Array(vapidPublicKey as string);

                        return key.buffer.slice(key.byteOffset, key.byteOffset + key.byteLength) as ArrayBuffer;
                    })(),
                }));

            const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
            const response = await fetch('/push-subscription', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                },
                body: JSON.stringify(sub.toJSON()),
            });

            if (!response.ok) {
                throw new Error(`Push subscription failed (${response.status})`);
            }
        }

        subscribe().catch(console.error);
    }, [userId, vapidPublicKey]);
}
