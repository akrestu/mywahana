import { Link, router, usePage } from '@inertiajs/react';
import { AlertTriangle, BedDouble, BookOpen, Building2, ClipboardCheck, ClipboardList, FileQuestion, GraduationCap, HeartPulse, Home, Inbox, LayoutGrid, LogOut, MapPin, Mountain, Search, Settings, ShieldCheck, Target, UserCheck, Users, Wrench } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState  } from 'react';
import type {ReactNode} from 'react';
import { AppearanceToggleButton } from '@/components/appearance-toggle-button';
import { BottomNav, isFocusedFlow } from '@/components/bottom-nav';
import { CommandPalette } from '@/components/command-palette';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { NotificationBell } from '@/components/notification-bell';
import { OfflineBanner } from '@/components/offline-banner';
import { AdminTableSkeleton, ModuleSkeleton } from '@/components/patterns/skeletons';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarProvider,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import { useAutoHideNav } from '@/hooks/use-auto-hide-nav';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { useNavigating } from '@/hooks/use-navigating';
import { cn } from '@/lib/utils';
import { modules, programsFor } from '@/modules/registry';
import { logout } from '@/routes';
import { edit as editProfile } from '@/routes/profile';
import type { Auth } from '@/types';

/**
 * Sidebar view of a module's programs: the four inspection types collapse into
 * one entry for the /sap/inspeksi hub (the quick-action sheet still lists each
 * type), and long labels are shortened to match the admin sidebar.
 */
function sidebarItems(programs: ReturnType<typeof programsFor>) {
    const items: { title: string; href: string; icon: LucideIcon; match?: string }[] = [];
    let inspeksiAdded = false;

    for (const p of programs) {
        if (p.key.startsWith('inspeksi-')) {
            if (!inspeksiAdded) {
                items.push({ title: 'Inspeksi', href: '/sap/inspeksi', icon: ClipboardList, match: '/sap/inspeksi' });
                inspeksiAdded = true;
            }

            continue;
        }

        items.push({ title: p.key === 'observasi' ? 'Observasi' : p.label, href: p.href, icon: p.icon });
    }

    return items;
}

type Props = {
    children: ReactNode;
    title?: string;
    showBack?: boolean;
    backHref?: string;
};

// Admin navbar: Ringkasan, Bugar, Laporan, Pengguna, [Menu: every desktop sidebar entry]
const adminMobileNavItems = [
    {
        href: '/home',
        label: 'Ringkasan',
        icon: ShieldCheck,
        activeColor: 'text-info',
        activeBg: 'bg-info-soft',
        inactiveColor: 'text-muted-foreground',
    },
    {
        href: '/admin/bugar-selamat',
        label: 'Bugar',
        icon: HeartPulse,
        activeColor: 'text-success',
        activeBg: 'bg-success-soft',
        inactiveColor: 'text-muted-foreground',
    },
    {
        href: '/admin/laporan-bahaya',
        label: 'Laporan',
        icon: AlertTriangle,
        activeColor: 'text-destructive',
        activeBg: 'bg-destructive-soft',
        inactiveColor: 'text-muted-foreground',
    },
    {
        href: '/admin/users',
        label: 'Pengguna',
        icon: Users,
        activeColor: 'text-info',
        activeBg: 'bg-info-soft',
        inactiveColor: 'text-muted-foreground',
    },
];

function MobileHeader({ title, showBack, backHref, isAdmin }: { title?: string; showBack?: boolean; backHref?: string; isAdmin?: boolean }) {
    return (
        <header className="sticky top-0 z-10 bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-background/70 [view-transition-name:app-header] lg:hidden">
            <div className="mx-auto flex h-14 max-w-lg items-center gap-3 px-4">
                {showBack && backHref ? (
                    <Link
                        href={backHref}
                        aria-label="Kembali"
                        className="-ml-2 flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                        <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </Link>
                ) : (
                    <img src="/logo.png" alt="" className="size-8 object-contain" />
                )}
                <div className="flex-1">
                    <span className="text-[15px] font-extrabold leading-tight tracking-tight">{title ?? 'MyWahana'}</span>
                </div>
                {isAdmin && !showBack && (
                    <Link
                        href="/admin"
                        className="rounded-md bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/20"
                    >
                        Admin
                    </Link>
                )}
                <AppearanceToggleButton />
                <NotificationBell />
            </div>
        </header>
    );
}

type AdminMenuGroup = { label?: string; items: { title: string; href: string; icon: LucideIcon; match?: string }[] };

/** Expands the desktop "Inspeksi" entry into its four monitors, since the mobile menu has no in-page switcher. */
function adminMenuGroups(groups: AdminMenuGroup[]): AdminMenuGroup[] {
    const inspeksi = [
        { title: 'Inspeksi Kantor',   href: '/admin/inspeksi-kantor',   icon: Building2 },
        { title: 'Inspeksi Tambang',  href: '/admin/inspeksi-tambang',  icon: Mountain },
        { title: 'Inspeksi Workshop', href: '/admin/inspeksi-workshop', icon: Wrench },
        { title: 'Inspeksi Mess',     href: '/admin/inspeksi-mess',     icon: BedDouble },
    ];

    return groups.map((g) => ({
        ...g,
        items: g.items.flatMap((item) => (item.match === '/admin/inspeksi-' ? inspeksi : [item])),
    }));
}

function AdminBottomNav({ url, groups }: { url: string; groups: AdminMenuGroup[] }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const navVisible = useAutoHideNav(url);
    const cleanup = useMobileNavigation();
    const path = url.split('?')[0];

    const isActive = (href: string) =>
        href === '/home' ? path === '/home' || path === '/admin' : path === href || path.startsWith(href + '/');
    const menuGroups = adminMenuGroups(groups);
    const isMenuActive = !adminMobileNavItems.some((item) => isActive(item.href));

    // Same shell as BottomNav: ink pill, icon-only slots, accent circle on the active one.
    const slotClass = 'relative flex h-full items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-[-6px] focus-visible:outline-accent';
    const iconClass = (active: boolean) =>
        cn('flex size-11 items-center justify-center rounded-full transition-colors duration-200', active ? 'bg-accent text-accent-foreground' : 'text-ink-muted');
    const rowClass = (active: boolean) =>
        cn('flex min-h-12 items-center gap-3 rounded-md px-3 text-sm font-semibold transition-colors', active ? 'bg-accent-soft text-foreground' : 'text-foreground hover:bg-muted');

    const NavLink = ({ item }: { item: (typeof adminMobileNavItems)[number] }) => {
        const Icon = item.icon;
        const active = isActive(item.href);

        return (
            <Link href={item.href} aria-label={item.label} aria-current={active ? 'page' : undefined} className={slotClass}>
                <span className={iconClass(active)}>
                    <Icon className="size-[22px]" strokeWidth={active ? 1.9 : 1.6} />
                </span>
            </Link>
        );
    };

    return (
        <nav
            aria-label="Navigasi admin"
            className={cn(
                'fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-20 mx-auto grid h-16 max-w-md grid-cols-5 items-center nav-glass rounded-full transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] lg:hidden',
                navVisible ? 'translate-y-0' : 'translate-y-[calc(100%+2rem)]',
            )}
        >
            {adminMobileNavItems.map((item) => (
                <NavLink key={item.href} item={item} />
            ))}
            <button type="button" onClick={() => setMenuOpen(true)} aria-label="Semua menu admin" aria-haspopup="dialog" className={slotClass}>
                <span className={iconClass(isMenuActive)}>
                    <LayoutGrid className="size-[22px]" strokeWidth={isMenuActive ? 1.9 : 1.6} />
                </span>
            </button>

            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetContent side="bottom" className="mx-auto max-w-lg gap-0">
                    <SheetHeader className="pb-2">
                        <SheetTitle className="text-left text-xl font-extrabold">Menu admin</SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-6">
                        {menuGroups.map((group, gi) => (
                            <div key={group.label ?? gi} className="flex flex-col gap-0.5">
                                {group.label && (
                                    <p className="px-3 pb-1 text-[11px] font-bold tracking-[0.12em] text-muted-foreground uppercase">{group.label}</p>
                                )}
                                {group.items.map((item) => {
                                    const Icon = item.icon;
                                    const active = isActive(item.href);

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            aria-current={active ? 'page' : undefined}
                                            onClick={() => setMenuOpen(false)}
                                            className={rowClass(active)}
                                        >
                                            <Icon size={20} strokeWidth={active ? 2.2 : 1.75} className="shrink-0" />
                                            {item.title}
                                        </Link>
                                    );
                                })}
                            </div>
                        ))}
                        <div className="flex flex-col gap-0.5">
                            <p className="px-3 pb-1 text-[11px] font-bold tracking-[0.12em] text-muted-foreground uppercase">Akun</p>
                            <Link
                                href={editProfile()}
                                onClick={() => {
                                    cleanup();
                                    setMenuOpen(false);
                                }}
                                className={rowClass(path.startsWith('/settings'))}
                            >
                                <Settings size={20} strokeWidth={1.75} className="shrink-0" />
                                Profil &amp; pengaturan
                            </Link>
                            <Link
                                href={logout()}
                                as="button"
                                onClick={() => {
                                    cleanup();
                                    router.flushAll();
                                }}
                                className={cn(rowClass(false), 'w-full text-destructive hover:bg-destructive-soft')}
                            >
                                <LogOut size={20} strokeWidth={1.75} className="shrink-0" />
                                Keluar
                            </Link>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </nav>
    );
}

export default function ResponsiveLayout({ children, title, showBack, backHref }: Props) {
    const { url } = usePage();
    const { auth, sidebarOpen } = usePage<{
        auth: Auth;
        sidebarOpen?: boolean;
    }>().props;

    const dashboardUrl = '/home';

    const isAdmin = auth?.user?.is_admin === true;
    const participationLevel = (auth?.user as { participation_level?: string })?.participation_level ?? '';
    const immersive = !isAdmin && (url === '/home' || url.startsWith('/home?'));
    const inboxCount = (usePage<{ inbox_count?: number }>().props.inbox_count ?? 0);
    const navigatingTo = useNavigating();
    const [searchOpen, setSearchOpen] = useState(false);

    const mainNavGroups = isAdmin
        ? [
            { items: [
                { title: 'Ringkasan', href: '/home', icon: ShieldCheck },
            ]},
            { label: 'K3 / Safety', items: [
                { title: 'Bugar Selamat',     href: '/admin/bugar-selamat',         icon: HeartPulse },
                { title: 'Laporan Bahaya',    href: '/admin/laporan-bahaya',        icon: AlertTriangle },
                { title: 'Observasi',         href: '/admin/observasi-keselamatan', icon: ClipboardCheck },
                { title: 'Komunikasi JSA',    href: '/admin/komunikasi-jsa',        icon: BookOpen },
                { title: 'Inspeksi',          href: '/admin/inspeksi-kantor',       icon: Building2, match: '/admin/inspeksi-' },
            ]},
            { label: 'Assessment', items: [
                { title: 'Safety',           href: '/admin/assessment',                    icon: GraduationCap },
                { title: 'HR',               href: '/admin/hr-assessment',                 icon: UserCheck },
                { title: 'Lembar penilaian', href: '/admin/assessment/feedback',           icon: ClipboardList },
                { title: 'Bank soal Safety', href: '/admin/assessment/questions',          icon: FileQuestion },
                { title: 'Bank soal HR',     href: '/admin/hr-assessment/questions',       icon: FileQuestion },
            ]},
            { label: 'Manajemen', items: [
                { title: 'Pengguna',       href: '/admin/users',   icon: Users },
                { title: 'Site',           href: '/admin/sites',   icon: MapPin },
                { title: 'Target kinerja', href: '/admin/targets', icon: Target },
            ]},
          ]
        : [
            { items: [
                { title: 'Beranda', href: dashboardUrl, icon: Home },
                { title: 'Modul', href: '/modules', icon: LayoutGrid },
                { title: 'Inbox', href: '/inbox', icon: Inbox, badge: inboxCount > 0 ? inboxCount : undefined },
            ]},
            ...modules
                .filter((m) => m.status === 'active')
                .map((m) => ({
                    label: m.label,
                    items: sidebarItems(programsFor(m, participationLevel)),
                })),
          ];

    return (
        <SidebarProvider defaultOpen={sidebarOpen ?? true}>
            {/* ── Desktop sidebar (hidden on mobile) ── */}
            <Sidebar collapsible="icon" className="hidden lg:flex">
                <SidebarHeader className="px-3.5 pt-5 pb-2 group-data-[collapsible=icon]:px-3">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                size="lg"
                                asChild
                                className="gap-2.5 rounded-[12px] px-2 hover:bg-background group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0!"
                                tooltip={{ children: 'MyWahana' }}
                            >
                                <Link href={dashboardUrl} prefetch="mount">
                                    <img src="/logo.png" alt="Logo PT.WBK" className="size-8 shrink-0 object-contain" />
                                    <span className="text-[15px] font-extrabold group-data-[collapsible=icon]:hidden">MyWahana</span>
                                    {isAdmin && (
                                        <span className="ml-auto rounded-full bg-primary px-[7px] py-[3px] text-[10px] font-bold text-accent group-data-[collapsible=icon]:hidden dark:text-primary-foreground">
                                            ADMIN
                                        </span>
                                    )}
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarHeader>

                <SidebarContent className="gap-0 px-3.5 pb-4 group-data-[collapsible=icon]:px-3">
                    <NavMain groups={mainNavGroups} />
                </SidebarContent>

                <SidebarFooter className="gap-2 border-t border-sidebar-border px-3.5 pt-3 pb-4 group-data-[collapsible=icon]:px-3">
                    <NavUser />
                </SidebarFooter>
            </Sidebar>

            {/* ── Main content area ── */}
            <SidebarInset>
                <OfflineBanner />
                {/* Desktop top bar (hidden on mobile) */}
                <header className="hidden h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 [view-transition-name:app-topbar] lg:flex">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mx-1 h-4" />
                    <span className="text-sm font-medium text-muted-foreground">
                        {title ?? 'MyWahana'}
                    </span>
                    <div className="ml-auto flex items-center gap-1">
                        {!isAdmin && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setSearchOpen(true)}
                                    className="mr-1 flex h-9 w-64 items-center gap-2 rounded-full bg-muted px-3.5 text-sm text-muted-foreground transition-colors hover:bg-border/60"
                                >
                                    <Search className="size-4" />
                                    <span className="flex-1 text-left">Cari…</span>
                                    <kbd className="rounded-md bg-card px-1.5 py-0.5 text-[11px] font-semibold">Ctrl K</kbd>
                                </button>
                            </>
                        )}
                        <AppearanceToggleButton />
                        <NotificationBell />
                    </div>
                </header>

                {/* Mobile header — Beranda draws its own hero instead */}
                {!immersive && <MobileHeader
                    title={title}
                    showBack={showBack}
                    backHref={backHref}
                    isAdmin={auth?.user?.is_admin}
                />}

                {/* Page content */}
                <main className={cn('min-w-0 flex-1 px-4 py-4 lg:p-6 lg:pb-6', !isAdmin && isFocusedFlow(url) ? 'pb-0' : 'pb-[calc(7rem+env(safe-area-inset-bottom))]')}>
                    {/* Mobile: constrain to phone-width; Desktop: full width */}
                    <div className="mx-auto w-full min-w-0 max-w-lg lg:max-w-none">
                        {navigatingTo ? (
                            isAdmin &&
                            (navigatingTo.startsWith('/admin') ||
                                navigatingTo === '/home') ? (
                                <AdminTableSkeleton />
                            ) : (
                                <ModuleSkeleton />
                            )
                        ) : (
                            children
                        )}
                    </div>
                </main>

                {/* Mobile bottom nav */}
                {isAdmin ? (
                    <AdminBottomNav url={url} groups={mainNavGroups} />
                ) : (
                    <>
                        <BottomNav />
                        <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
                    </>
                )}
            </SidebarInset>
        </SidebarProvider>
    );
}
