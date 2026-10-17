import { Link, usePage } from '@inertiajs/react';
import { Home, Inbox, LayoutGrid, Plus, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { QuickActionSheet } from '@/components/quick-action-sheet';
import { useAutoHideNav } from '@/hooks/use-auto-hide-nav';
import { cn } from '@/lib/utils';
import { moduleForUrl } from '@/modules/registry';

type NavItem = {
    label: string;
    href: string;
    icon: LucideIcon;
    match: (url: string) => boolean;
};

const startsWith = (url: string, prefix: string) =>
    url === prefix ||
    url.startsWith(`${prefix}/`) ||
    url.startsWith(`${prefix}?`);

const ITEMS: [NavItem, NavItem, NavItem, NavItem] = [
    {
        label: 'Beranda',
        href: '/home',
        icon: Home,
        match: (u) => startsWith(u, '/home'),
    },
    {
        label: 'Modul',
        href: '/modules',
        icon: LayoutGrid,
        match: (u) => startsWith(u, '/modules') || !!moduleForUrl(u),
    },
    {
        label: 'Inbox',
        href: '/inbox',
        icon: Inbox,
        match: (u) => startsWith(u, '/inbox'),
    },
    {
        label: 'Profil',
        href: '/settings/profile',
        icon: User,
        match: (u) => startsWith(u, '/settings'),
    },
];

const FOCUSED_FLOW = /\/(create|konfirmasi|re-inspeksi|quiz|feedback)(\/|\?|$)/;

export function isFocusedFlow(url: string): boolean {
    return FOCUSED_FLOW.test(url);
}

/**
 * Bottom navbar E1: bar kaca dengan label selalu tampil dan tombol Buat
 * bulat besar di tengah. Beranda · Modul · [+] · Inbox · Profil.
 */
export function BottomNav() {
    const { url, props } = usePage<{ inbox_count?: number }>();
    const [quickOpen, setQuickOpen] = useState(false);
    const visible = useAutoHideNav(url);
    const inboxCount = props.inbox_count ?? 0;

    // Form flows are full-screen: their sticky footer takes the nav's place.
    if (isFocusedFlow(url)) {
        return null;
    }

    const renderItem = (item: NavItem) => {
        const active = item.match(url);
        const Icon = item.icon;
        const showBadge = item.href === '/inbox' && inboxCount > 0;

        return (
            <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                aria-label={
                    showBadge
                        ? `${item.label}, ${inboxCount} perlu tindakan`
                        : item.label
                }
                className={cn(
                    'relative flex min-h-11 min-w-11 flex-col items-center justify-center gap-1 rounded-2xl',
                    'transition-transform duration-75 active:scale-[0.92] motion-reduce:transition-none',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                    active
                        ? 'text-[#141414] dark:text-white'
                        : 'text-[#3A3833] dark:text-[#D9D4C9]',
                )}
            >
                <span className="relative flex h-[30px] min-w-11 items-center justify-center">
                    <Icon className="size-[22px]" strokeWidth={1.8} aria-hidden />
                    {showBadge && (
                        <span
                            aria-hidden
                            className="tabular absolute -top-1 right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-[5px] text-[10px] font-extrabold text-[#141414]"
                        >
                            {inboxCount > 99 ? '99+' : inboxCount}
                        </span>
                    )}
                </span>
                <span
                    className={cn(
                        'text-[11px] leading-none',
                        active ? 'font-bold' : 'font-medium',
                    )}
                >
                    {item.label}
                </span>
            </Link>
        );
    };

    return (
        <>
            <nav
                data-glass
                aria-label="Navigasi utama"
                className={cn(
                    'fixed inset-x-3 z-50 mx-auto grid h-[72px] max-w-md grid-cols-5 items-stretch rounded-[28px] px-1 lg:hidden',
                    'bottom-[calc(12px+env(safe-area-inset-bottom))]',
                    // material kaca
                    'border border-white/70 bg-white/55 shadow-[0_10px_30px_rgba(20,20,20,0.18)]',
                    'backdrop-blur-[18px] backdrop-saturate-[1.4]',
                    'dark:border-white/15 dark:bg-[#181816]/55',
                    // fallback tanpa blur
                    'supports-[not(backdrop-filter:blur(1px))]:bg-white/92 dark:supports-[not(backdrop-filter:blur(1px))]:bg-[#181816]/92',
                    // sembunyi saat scroll ke bawah
                    'transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none',
                    visible ? 'translate-y-0' : 'translate-y-[calc(100%+3rem)]',
                )}
            >
                {renderItem(ITEMS[0])}
                {renderItem(ITEMS[1])}
                <div className="flex items-start justify-center">
                    <button
                        type="button"
                        onClick={() => setQuickOpen(true)}
                        aria-label="Buat (aksi cepat)"
                        aria-haspopup="dialog"
                        className={cn(
                            '-mt-[13px] flex size-[60px] items-center justify-center rounded-full',
                            'bg-[#141414] text-accent dark:bg-accent dark:text-[#141414]',
                            'shadow-[0_0_0_5px_rgba(255,255,255,0.75),0_10px_24px_rgba(20,20,20,0.28)]',
                            'dark:shadow-[0_0_0_5px_rgba(255,255,255,0.18),0_10px_24px_rgba(20,20,20,0.28)]',
                            'transition-transform duration-75 active:scale-[0.92] motion-reduce:transition-none',
                            'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent',
                        )}
                    >
                        <Plus className="size-[26px]" strokeWidth={2} aria-hidden />
                    </button>
                </div>
                {renderItem(ITEMS[2])}
                {renderItem(ITEMS[3])}
            </nav>
            <QuickActionSheet open={quickOpen} onOpenChange={setQuickOpen} />
        </>
    );
}
