import { Link, usePage } from '@inertiajs/react';
import { Home, Inbox, LayoutGrid, Plus, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { QuickActionSheet } from '@/components/quick-action-sheet';
import { useAutoHideNav } from '@/hooks/use-auto-hide-nav';
import { cn } from '@/lib/utils';
import { moduleForUrl } from '@/modules/registry';

type Slot = {
    href: string;
    label: string;
    icon: LucideIcon;
    active: (url: string) => boolean;
};

const startsWith = (url: string, prefix: string) =>
    url === prefix ||
    url.startsWith(`${prefix}/`) ||
    url.startsWith(`${prefix}?`);

const slots: [Slot, Slot, Slot, Slot] = [
    {
        href: '/home',
        label: 'Beranda',
        icon: Home,
        active: (u) => startsWith(u, '/home'),
    },
    {
        href: '/modules',
        label: 'Modul',
        icon: LayoutGrid,
        active: (u) => startsWith(u, '/modules') || !!moduleForUrl(u),
    },
    {
        href: '/inbox',
        label: 'Inbox',
        icon: Inbox,
        active: (u) => startsWith(u, '/inbox'),
    },
    {
        href: '/settings/profile',
        label: 'Profil',
        icon: User,
        active: (u) => startsWith(u, '/settings'),
    },
];

const FOCUSED_FLOW = /\/(create|konfirmasi|re-inspeksi|quiz|feedback)(\/|\?|$)/;

export function isFocusedFlow(url: string): boolean {
    return FOCUSED_FLOW.test(url);
}

/** Floating mobile navigation: Beranda · Modul · [+] · Inbox · Profil. */
export function BottomNav() {
    const { url, props } = usePage<{ inbox_count?: number }>();
    const [quickOpen, setQuickOpen] = useState(false);
    const visible = useAutoHideNav(url);
    const inboxCount = props.inbox_count ?? 0;

    // Form flows are full-screen: their sticky footer takes the nav's place.
    if (isFocusedFlow(url)) {
        return null;
    }

    const renderSlot = (slot: Slot) => {
        const active = slot.active(url);
        const Icon = slot.icon;
        const badge =
            slot.href === '/inbox' && inboxCount > 0 ? inboxCount : null;

        return (
            <Link
                key={slot.href}
                href={slot.href}
                aria-label={
                    badge
                        ? `${slot.label}, ${badge} perlu tindakan`
                        : slot.label
                }
                aria-current={active ? 'page' : undefined}
                className="relative flex h-full items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-[-6px] focus-visible:outline-accent"
            >
                <span
                    className={cn(
                        'flex size-11 items-center justify-center rounded-full transition-colors duration-200',
                        active
                            ? 'bg-accent text-accent-foreground'
                            : 'text-ink-muted',
                    )}
                >
                    <Icon
                        className="size-[22px]"
                        strokeWidth={active ? 1.9 : 1.6}
                    />
                </span>
                {badge && (
                    <span className="tabular absolute top-2 right-[calc(50%-22px)] flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-extrabold text-accent-foreground ring-2 ring-ink dark:ring-card">
                        {badge > 99 ? '99+' : badge}
                    </span>
                )}
            </Link>
        );
    };

    return (
        <>
            <nav
                aria-label="Navigasi utama"
                className={cn(
                    'nav-glass fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-20 mx-auto grid h-16 max-w-md grid-cols-5 items-center rounded-full transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] [view-transition-name:bottom-nav] lg:hidden',
                    visible ? 'translate-y-0' : 'translate-y-[calc(100%+2rem)]',
                )}
            >
                {renderSlot(slots[0])}
                {renderSlot(slots[1])}
                <button
                    type="button"
                    onClick={() => setQuickOpen(true)}
                    aria-label="Aksi cepat"
                    aria-haspopup="dialog"
                    className="flex h-full items-center justify-center rounded-full text-white focus-visible:outline-2 focus-visible:outline-offset-[-6px] focus-visible:outline-accent"
                >
                    <span className="flex size-11 items-center justify-center rounded-full ring-[1.8px] ring-white/90 transition-transform active:scale-95">
                        <Plus className="size-5" strokeWidth={2} />
                    </span>
                </button>
                {renderSlot(slots[2])}
                {renderSlot(slots[3])}
            </nav>
            <QuickActionSheet open={quickOpen} onOpenChange={setQuickOpen} />
        </>
    );
}
