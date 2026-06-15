import { Link, router, usePage } from '@inertiajs/react';
import { Bell, BookOpen, ClipboardCheck, ClipboardList, Home, LogOut, TriangleAlert, User } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { usePushNotification } from '@/hooks/use-push-notification';
import type { Auth } from '@/types';

type AppNotification = {
    id: string;
    message: string;
    url: string | null;
};

type Props = {
    children: ReactNode;
    title?: string;
    showBack?: boolean;
    backHref?: string;
};

const baseNavItems = [
    {
        href: '/home',
        label: 'Beranda',
        icon: Home,
        activeColor: 'text-blue-600 dark:text-blue-400',
        activeBg: 'bg-blue-100 dark:bg-blue-950',
        inactiveColor: 'text-slate-400 dark:text-slate-500',
    },
    {
        href: '/bugar-selamat',
        label: 'Bugar Selamat',
        icon: ClipboardList,
        activeColor: 'text-green-600 dark:text-green-400',
        activeBg: 'bg-green-100 dark:bg-green-950',
        inactiveColor: 'text-slate-400 dark:text-slate-500',
    },
    {
        href: '/laporan-bahaya',
        label: 'Laporan Bahaya',
        icon: TriangleAlert,
        activeColor: 'text-red-500 dark:text-red-400',
        activeBg: 'bg-red-100 dark:bg-red-950',
        inactiveColor: 'text-slate-400 dark:text-slate-500',
    },
    {
        href: '/settings/profile',
        label: 'Profil',
        icon: User,
        activeColor: 'text-purple-600 dark:text-purple-400',
        activeBg: 'bg-purple-100 dark:bg-purple-950',
        inactiveColor: 'text-slate-400 dark:text-slate-500',
    },
];

export default function MobileLayout({ children, title, showBack, backHref }: Props) {
    usePushNotification();

    const { url } = usePage();
    const { auth, notifications } = usePage<{ auth: Auth; notifications: AppNotification[] }>().props;

    const participationLevel = (auth?.user as { participation_level?: string })?.participation_level ?? '';
    const isStaff = !auth?.user?.is_admin && ['staff', 'srstaff'].includes(participationLevel);
    const navItems = [
        ...baseNavItems.slice(0, 3),
        ...(isStaff ? [
            {
                href: '/sap/observasi-keselamatan',
                label: 'OK',
                icon: ClipboardCheck,
                activeColor: 'text-teal-600 dark:text-teal-400',
                activeBg: 'bg-teal-100 dark:bg-teal-950',
                inactiveColor: 'text-slate-400 dark:text-slate-500',
            },
            {
                href: '/sap/komunikasi-jsa',
                label: 'Kom. JSA',
                icon: BookOpen,
                activeColor: 'text-indigo-600 dark:text-indigo-400',
                activeBg: 'bg-indigo-100 dark:bg-indigo-950',
                inactiveColor: 'text-slate-400 dark:text-slate-500',
            },
        ] : []),
        baseNavItems[3],
    ];
    const [showNotif, setShowNotif] = useState(false);

    const isActive = (href: string) => {
        if (href === '/home') return url === '/home';
        return url.startsWith(href);
    };

    return (
        <div className="flex min-h-screen flex-col bg-background">
            {/* Header */}
            <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="mx-auto flex h-14 max-w-lg items-center gap-3 px-4">
                    {showBack && backHref ? (
                        <Link
                            href={backHref}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M15 18l-6-6 6-6" />
                            </svg>
                        </Link>
                    ) : (
                        <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-md">
                            <img src="/logo.png" alt="MyWahana" className="size-8 object-contain" />
                        </div>
                    )}
                    <div className="flex-1">
                        <h1 className="text-sm font-semibold leading-tight">
                            {title ?? 'MyWahana'}
                        </h1>
                    </div>
                    {auth?.user?.is_admin && !showBack && (
                        <Link
                            href="/admin"
                            className="rounded-md bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/20"
                        >
                            Admin
                        </Link>
                    )}
                    {/* Bell icon */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotif((v) => !v)}
                            className="relative flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                        >
                            <Bell size={18} />
                            {notifications.length > 0 && (
                                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                                    {notifications.length}
                                </span>
                            )}
                        </button>
                        {showNotif && (
                            <div className="absolute right-0 top-10 z-50 w-72 rounded-xl border bg-background shadow-lg">
                                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground border-b">
                                    Notifikasi
                                </div>
                                {notifications.length === 0 ? (
                                    <p className="px-3 py-4 text-center text-xs text-muted-foreground">Tidak ada notifikasi</p>
                                ) : (
                                    <ul>
                                        {notifications.map((n) => (
                                            <li key={n.id} className="border-b last:border-0">
                                                <div className="flex items-start gap-2 px-3 py-2.5">
                                                    <p className="flex-1 text-xs leading-snug">{n.message}</p>
                                                    <button
                                                        onClick={() => {
                                                            router.post(`/notifications/${n.id}/read`, {}, {
                                                                preserveScroll: true,
                                                                onSuccess: () => {
                                                                    if (n.url) router.visit(n.url);
                                                                    else setShowNotif(false);
                                                                },
                                                            });
                                                        }}
                                                        className="shrink-0 rounded bg-primary px-2 py-1 text-[10px] font-medium text-primary-foreground"
                                                    >
                                                        Isi
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>
                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                    >
                        <LogOut size={13} />
                        Keluar
                    </Link>
                </div>
            </header>

            {/* Content */}
            <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4 pb-24">
                {children}
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 z-10 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                <div className="mx-auto flex h-[68px] max-w-lg items-center justify-around px-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex flex-1 flex-col items-center gap-1 py-2 transition-all"
                            >
                                <div className={`flex items-center justify-center rounded-2xl px-4 py-1.5 transition-all ${
                                    active ? `${item.activeBg} ${item.activeColor}` : item.inactiveColor
                                }`}>
                                    <Icon size={22} strokeWidth={active ? 2.5 : 1.75} />
                                </div>
                                <span className={`text-[10px] font-semibold leading-none transition-colors ${
                                    active ? item.activeColor : item.inactiveColor
                                }`}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
