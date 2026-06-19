import { useEffect, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { Bell } from 'lucide-react';
import * as notificationRoutes from '@/routes/notifications';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function NotificationBell() {
    const { notifications, unread_notifications_count } = usePage().props;
    const [confirmClear, setConfirmClear] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({ only: ['notifications', 'unread_notifications_count'] });
        }, 60_000);
        return () => clearInterval(interval);
    }, []);

    function handleRead(notifId: string, url: string | null) {
        router.post(
            notificationRoutes.read.url(notifId),
            {},
            { onFinish: () => url && router.visit(url) },
        );
    }

    function handleMarkAllRead() {
        router.post(notificationRoutes.markAllRead.url());
    }

    function handleClearAll() {
        router.delete(notificationRoutes.clearAll.url(), {
            onFinish: () => setConfirmClear(false),
        });
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-4 w-4" />
                        {unread_notifications_count > 0 && (
                            <Badge className="absolute -top-1 -right-1 h-4 min-w-4 rounded-full px-1 text-[10px] leading-none flex items-center justify-center">
                                {unread_notifications_count > 99 ? '99+' : unread_notifications_count}
                            </Badge>
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                    <div className="flex items-center justify-between px-3 py-2">
                        <span className="text-sm font-semibold">Notifikasi</span>
                        <div className="flex gap-1">
                            {unread_notifications_count > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                    onClick={handleMarkAllRead}
                                >
                                    Tandai semua dibaca
                                </Button>
                            )}
                            {notifications.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                                    onClick={() => setConfirmClear(true)}
                                >
                                    Hapus semua
                                </Button>
                            )}
                        </div>
                    </div>
                    <DropdownMenuSeparator />
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                                Tidak ada notifikasi
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <DropdownMenuItem
                                    key={notif.id}
                                    className={`flex flex-col items-start gap-1 px-3 py-2 cursor-pointer ${!notif.read_at ? 'bg-muted/50' : ''}`}
                                    onClick={() => handleRead(notif.id, notif.url)}
                                >
                                    <div className="flex items-start gap-2 w-full">
                                        {!notif.read_at && (
                                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                                        )}
                                        <span className={`text-sm leading-snug ${!notif.read_at ? '' : 'pl-4'}`}>
                                            {notif.message}
                                        </span>
                                    </div>
                                    <span className="text-xs text-muted-foreground pl-4">
                                        {formatDistanceToNow(new Date(notif.created_at), {
                                            addSuffix: true,
                                            locale: id,
                                        })}
                                    </span>
                                </DropdownMenuItem>
                            ))
                        )}
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus semua notifikasi?</DialogTitle>
                        <DialogDescription>
                            Semua notifikasi akan dihapus secara permanen dan tidak dapat dikembalikan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmClear(false)}>
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={handleClearAll}>
                            Hapus semua
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
