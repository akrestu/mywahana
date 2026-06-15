import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { useEffect } from 'react';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function usePushNotification() {
    const { auth, vapidPublicKey } = usePage().props;

    useEffect(() => {
        if (!auth?.user || !vapidPublicKey) return;
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

        async function subscribe() {
            const reg = await navigator.serviceWorker.register('/sw.js');

            const permission = await Notification.requestPermission();
            if (permission !== 'granted') return;

            const existing = await reg.pushManager.getSubscription();
            const sub =
                existing ??
                (await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey as string),
                }));

            await axios.post('/push-subscription', sub.toJSON());
        }

        subscribe().catch(console.error);
    }, [auth?.user?.id]);
}
