/**
 * Outbox for form submissions made while the device is offline.
 * Entries live in IndexedDB (files as Blobs) and are replayed as plain
 * multipart POSTs once the connection returns.
 */

export type QueuedSubmission = {
    id: string;
    url: string;
    label: string;
    createdAt: string;
    fields: Record<string, string>;
    files: Record<string, Blob>;
    /** Substring of the final URL after a successful submit (e.g. "?hasil=1"). */
    successMatch?: string;
};

const DB_NAME = 'mywahana-offline';
const STORE = 'queue';
export const QUEUE_EVENT = 'offline-queue-change';

function openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () =>
            req.result.createObjectStore(STORE, { keyPath: 'id' });
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function run<T>(
    mode: IDBTransactionMode,
    fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
    const db = await openDb();

    return new Promise((resolve, reject) => {
        const req = fn(db.transaction(STORE, mode).objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

const notify = () => window.dispatchEvent(new Event(QUEUE_EVENT));

export function isOffline(): boolean {
    return typeof navigator !== 'undefined' && navigator.onLine === false;
}

export async function enqueue(
    entry: Omit<QueuedSubmission, 'id' | 'createdAt'>,
): Promise<void> {
    await run('readwrite', (s) =>
        s.put({
            ...entry,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
        }),
    );
    notify();
}

export async function listQueued(): Promise<QueuedSubmission[]> {
    try {
        return await run(
            'readonly',
            (s) => s.getAll() as IDBRequest<QueuedSubmission[]>,
        );
    } catch {
        return [];
    }
}

async function remove(id: string): Promise<void> {
    await run('readwrite', (s) => s.delete(id));
    notify();
}

function csrfToken(): string {
    const cookie = document.cookie
        .split('; ')
        .find((c) => c.startsWith('XSRF-TOKEN='));

    if (cookie) {
        return decodeURIComponent(cookie.split('=')[1]);
    }

    return (
        document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
            ?.content ?? ''
    );
}

let flushing = false;

/**
 * Sends every queued entry. Returns how many were sent and which ones the
 * server rejected (those are removed so they do not block the queue).
 */
export async function flushQueue(): Promise<{
    sent: number;
    rejected: string[];
}> {
    if (flushing || isOffline()) {
        return { sent: 0, rejected: [] };
    }

    flushing = true;
    let sent = 0;
    const rejected: string[] = [];

    try {
        for (const entry of await listQueued()) {
            const body = new FormData();
            Object.entries(entry.fields).forEach(([k, v]) => body.append(k, v));
            Object.entries(entry.files).forEach(([k, f]) =>
                body.append(k, f, `${k}.jpg`),
            );

            const token = csrfToken();
            let res: Response;

            try {
                res = await fetch(entry.url, {
                    method: 'POST',
                    body,
                    credentials: 'same-origin',
                    // JSON accept makes validation failures come back as 422 instead of a redirect.
                    headers: {
                        Accept: 'application/json',
                        'X-XSRF-TOKEN': token,
                    },
                });
            } catch {
                break; // Still no network; try again on the next online event.
            }

            const landedOnSuccess =
                res.ok &&
                (!entry.successMatch || res.url.includes(entry.successMatch));

            if (landedOnSuccess) {
                sent++;
                await remove(entry.id);
            } else if (res.ok || res.status === 422 || res.status === 403) {
                // Redirected back or rejected by validation: drop it so it cannot block the queue.
                rejected.push(entry.label);
                await remove(entry.id);
            } else {
                break;
            }
        }
    } finally {
        flushing = false;
    }

    return { sent, rejected };
}
