import { router, usePage } from '@inertiajs/react';
import { formatDistanceToNow, isToday } from 'date-fns';
import { id } from 'date-fns/locale';
import { Bell, BellOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { SectionLabel } from '@/components/patterns/module-header';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import * as notificationRoutes from '@/routes/notifications';

type Notif = {
    id: string;
    message: string;
    url: string | null;
    read_at: string | null;
    created_at: string;
};

/** Bell button with unread count; opens the notification panel as a sheet. */
export function NotificationBell({ className }: { className?: string } = {}) {
    const { notifications, unread_notifications_count } = usePage<{
        notifications: Notif[];
        unread_notifications_count: number;
    }>().props;
    const [open, setOpen] = useState(false);
    const [confirmClear, setConfirmClear] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({
                only: ['notifications', 'unread_notifications_count'],
            });
        }, 60_000);

        return () => clearInterval(interval);
    }, []);

    const read = (n: Notif) => {
        setOpen(false);
        router.post(
            notificationRoutes.read.url(n.id),
            {},
            { onFinish: () => n.url && router.visit(n.url) },
        );
    };

    const groups = [
        {
            label: 'Hari ini',
            items: notifications.filter((n) => isToday(new Date(n.created_at))),
        },
        {
            label: 'Sebelumnya',
            items: notifications.filter(
                (n) => !isToday(new Date(n.created_at)),
            ),
        },
    ].filter((g) => g.items.length > 0);

    return (
        <>
            <Button
                aria-label={
                    unread_notifications_count > 0
                        ? `Notifikasi, ${unread_notifications_count} belum dibaca`
                        : 'Notifikasi'
                }
                variant="ghost"
                size="icon"
                className={cn('relative', className)}
                onClick={() => setOpen(true)}
            >
                <Bell className="size-5" strokeWidth={1.8} />
                {unread_notifications_count > 0 && (
                    <span className="tabular absolute top-2 right-2 flex h-[18px] min-w-[18px] translate-x-1/3 -translate-y-1/3 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-extrabold text-accent-foreground ring-2 ring-background">
                        {unread_notifications_count > 99
                            ? '99+'
                            : unread_notifications_count}
                    </span>
                )}
            </Button>

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent
                    side="right"
                    className="w-full gap-0 border-0 p-0 sm:max-w-md"
                >
                    <SheetHeader className="flex-row items-center justify-between gap-3 px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-3">
                        <div>
                            <SheetTitle className="text-left text-2xl font-extrabold tracking-tight">
                                Notifikasi
                            </SheetTitle>
                            <SheetDescription className="text-left">
                                {unread_notifications_count > 0
                                    ? `${unread_notifications_count} belum dibaca`
                                    : 'Semua sudah dibaca'}
                            </SheetDescription>
                        </div>
                        {unread_notifications_count > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="mr-8"
                                onClick={() =>
                                    router.post(
                                        notificationRoutes.markAllRead.url(),
                                    )
                                }
                            >
                                Tandai dibaca
                            </Button>
                        )}
                    </SheetHeader>

                    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 py-16 text-center">
                                <span className="flex size-12 items-center justify-center rounded-full bg-muted">
                                    <BellOff className="size-5 text-muted-foreground" />
                                </span>
                                <p className="font-bold">
                                    Belum ada notifikasi
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Persetujuan dan pengingat akan muncul di
                                    sini.
                                </p>
                            </div>
                        ) : (
                            <>
                                {groups.map((g) => (
                                    <section
                                        key={g.label}
                                        className="flex flex-col gap-2"
                                    >
                                        <SectionLabel>{g.label}</SectionLabel>
                                        <ul className="overflow-hidden rounded-lg bg-card">
                                            {g.items.map((n) => (
                                                <li
                                                    key={n.id}
                                                    className="border-b border-border/60 last:border-0"
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => read(n)}
                                                        className={cn(
                                                            'flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted',
                                                            !n.read_at &&
                                                                'bg-accent-soft/50',
                                                        )}
                                                    >
                                                        <span
                                                            aria-hidden
                                                            className={cn(
                                                                'mt-1.5 size-2 shrink-0 rounded-full',
                                                                n.read_at
                                                                    ? 'bg-transparent'
                                                                    : 'bg-accent ring-2 ring-accent/30',
                                                            )}
                                                        />
                                                        <span className="min-w-0 flex-1">
                                                            <span
                                                                className={cn(
                                                                    'block text-sm leading-snug',
                                                                    !n.read_at &&
                                                                        'font-semibold',
                                                                )}
                                                            >
                                                                {n.message}
                                                            </span>
                                                            <span className="mt-0.5 block text-xs text-muted-foreground">
                                                                {formatDistanceToNow(
                                                                    new Date(
                                                                        n.created_at,
                                                                    ),
                                                                    {
                                                                        addSuffix: true,
                                                                        locale: id,
                                                                    },
                                                                )}
                                                            </span>
                                                        </span>
                                                        {!n.read_at && (
                                                            <span className="sr-only">
                                                                Belum dibaca
                                                            </span>
                                                        )}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                ))}
                                <Button
                                    variant="ghost"
                                    className="self-center text-destructive hover:text-destructive"
                                    onClick={() => setConfirmClear(true)}
                                >
                                    Hapus semua notifikasi
                                </Button>
                            </>
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            <ConfirmDialog
                open={confirmClear}
                onOpenChange={setConfirmClear}
                title="Hapus semua notifikasi?"
                description="Semua notifikasi akan dihapus permanen dan tidak dapat dikembalikan."
                confirmLabel="Hapus semua"
                destructive
                onConfirm={() =>
                    router.delete(notificationRoutes.clearAll.url(), {
                        onFinish: () => setConfirmClear(false),
                    })
                }
            />
        </>
    );
}
