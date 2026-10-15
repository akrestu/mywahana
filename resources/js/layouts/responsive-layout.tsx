import { Link, usePage } from '@inertiajs/react';
import { AlertTriangle, BedDouble, BookOpen, Building2, ClipboardCheck, ClipboardList, GraduationCap, HeartPulse, Home, Inbox, LayoutGrid, MapPin, Mountain, Plus, Search, ShieldCheck, Target, User, UserCheck, Users, Wrench } from 'lucide-react';
import { useState  } from 'react';
import type {ReactNode} from 'react';
import AppLogo from '@/components/app-logo';
import { AppearanceToggleButton } from '@/components/appearance-toggle-button';
import { BottomNav, isFocusedFlow } from '@/components/bottom-nav';
import { CommandPalette } from '@/components/command-palette';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { NotificationBell } from '@/components/notification-bell';
import { OfflineBanner } from '@/components/offline-banner';
import { QuickActionSheet } from '@/components/quick-action-sheet';
import { Button } from '@/components/ui/button';
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
import { cn } from '@/lib/utils';
import { modules, programsFor } from '@/modules/registry';
import type { Auth } from '@/types';

type Props = {
    children: ReactNode;
    title?: string;
    showBack?: boolean;
    backHref?: string;
};

const baseUserMobileNavItems = [
    {
        href: '/home',
        label: 'Beranda',
        icon: Home,
        activeColor: 'text-info',
        activeBg: 'bg-info-soft',
        inactiveColor: 'text-muted-foreground',
    },
    {
        href: '/bugar-selamat',
        label: 'Bugar',
        icon: ClipboardList,
        activeColor: 'text-success',
        activeBg: 'bg-success-soft',
        inactiveColor: 'text-muted-foreground',
    },
    {
        href: '/laporan-bahaya',
        label: 'Laporan',
        icon: AlertTriangle,
        activeColor: 'text-destructive',
        activeBg: 'bg-destructive-soft',
        inactiveColor: 'text-muted-foreground',
    },
    {
        href: '/settings/profile',
        label: 'Profil',
        icon: User,
        activeColor: 'text-info',
        activeBg: 'bg-info-soft',
        inactiveColor: 'text-muted-foreground',
    },
];

const sapMobileNavItems = [
    {
        href: '/laporan-bahaya',
        label: 'Laporan',
        fullLabel: 'Laporan Bahaya',
        icon: AlertTriangle,
        activeColor: 'text-destructive',
        activeBg: 'bg-destructive-soft',
        inactiveColor: 'text-muted-foreground',
    },
    {
        href: '/sap/observasi-keselamatan',
        label: 'OK',
        fullLabel: 'Observasi Keselamatan',
        icon: ClipboardCheck,
        activeColor: 'text-info',
        activeBg: 'bg-info-soft',
        inactiveColor: 'text-muted-foreground',
    },
    {
        href: '/sap/inspeksi-kantor',
        label: 'Kantor',
        fullLabel: 'Inspeksi Kantor',
        icon: Building2,
        activeColor: 'text-info',
        activeBg: 'bg-info-soft',
        inactiveColor: 'text-muted-foreground',
    },
    {
        href: '/sap/inspeksi-tambang',
        label: 'Tambang',
        fullLabel: 'Inspeksi Tambang',
        icon: Mountain,
        activeColor: 'text-info',
        activeBg: 'bg-info-soft',
        inactiveColor: 'text-muted-foreground',
    },
    {
        href: '/sap/inspeksi-workshop',
        label: 'Workshop',
        fullLabel: 'Inspeksi Workshop',
        icon: Wrench,
        activeColor: 'text-info',
        activeBg: 'bg-info-soft',
        inactiveColor: 'text-muted-foreground',
    },
    {
        href: '/sap/inspeksi-mess',
        label: 'Mess',
        fullLabel: 'Inspeksi Mess',
        icon: BedDouble,
        activeColor: 'text-info',
        activeBg: 'bg-info-soft',
        inactiveColor: 'text-muted-foreground',
    },
    {
        href: '/sap/komunikasi-jsa',
        label: 'Kom. JSA',
        fullLabel: 'Komunikasi JSA',
        icon: BookOpen,
        activeColor: 'text-info',
        activeBg: 'bg-info-soft',
        inactiveColor: 'text-muted-foreground',
    },
];

const assessmentDrawerItems = [
    { href: '/assessment',    fullLabel: 'Safety Assessment', icon: GraduationCap, activeColor: 'text-info', activeBg: 'bg-info-soft' },
    { href: '/hr-assessment', fullLabel: 'HR Assessment',     icon: UserCheck,     activeColor: 'text-info', activeBg: 'bg-info-soft' },
];

const adminSapDrawerItems = [
    { href: '/admin/observasi-keselamatan', fullLabel: 'Monitor Observasi Keselamatan', icon: ClipboardCheck },
    { href: '/admin/komunikasi-jsa',        fullLabel: 'Monitor Komunikasi JSA',        icon: BookOpen },
    { href: '/admin/inspeksi-kantor',       fullLabel: 'Monitor Inspeksi Kantor',       icon: Building2 },
    { href: '/admin/inspeksi-tambang',      fullLabel: 'Monitor Inspeksi Tambang',      icon: Mountain },
    { href: '/admin/inspeksi-workshop',     fullLabel: 'Monitor Inspeksi Workshop',     icon: Wrench },
    { href: '/admin/inspeksi-mess',         fullLabel: 'Monitor Inspeksi Mess',         icon: BedDouble },
    { href: '/admin/sites',                 fullLabel: 'Kelola Site',                   icon: MapPin },
    { href: '/admin/assessment',            fullLabel: 'Assessment Safety',             icon: GraduationCap },
    { href: '/admin/hr-assessment',         fullLabel: 'Assessment HR',                 icon: UserCheck },
];

// Admin navbar: Admin, Bugar, Laporan, [SAP button], Pengguna
const adminMobileNavItems = [
    {
        href: '/home',
        label: 'Admin',
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
        <header className="sticky top-0 z-10 bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-background/70 lg:hidden">
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

function MobileBottomNav({ url, isAdmin, isStaff, navItems }: { url: string; isAdmin: boolean; isStaff: boolean; navItems: typeof baseUserMobileNavItems }) {
    const [sapDrawerOpen, setSapDrawerOpen] = useState(false);
    const [assessmentDrawerOpen, setAssessmentDrawerOpen] = useState(false);
    const navVisible = useAutoHideNav(url);
    const items = isAdmin ? adminMobileNavItems : navItems;
    const isSapActive = url.startsWith('/sap/') || url.startsWith('/laporan-bahaya') || url.startsWith('/admin/inspeksi-') || url.startsWith('/admin/observasi-keselamatan') || url.startsWith('/admin/komunikasi-jsa');
    const isAssessmentActive = url.startsWith('/assessment') || url.startsWith('/hr-assessment') || url.startsWith('/admin/assessment') || url.startsWith('/admin/hr-assessment');

    const isActive = (href: string) => {
        if (href === '/home') {
return url === href || url.startsWith('/home?');
}

        if (href === '/admin') {
return url === href;
}

        return url.startsWith(href);
    };

    const NavLink = ({ item, active }: { item: typeof baseUserMobileNavItems[number]; active: boolean }) => {
        const Icon = item.icon;

        return (
            <Link
                href={item.href}
                className="flex shrink-0 flex-col items-center gap-1 px-1 py-2 transition-all"
                style={{ minWidth: '4rem' }}
            >
                <div className={`flex items-center justify-center rounded-2xl px-3 py-1.5 transition-all ${
                    active ? 'bg-accent text-accent-foreground' : 'text-[oklch(0.82_0.02_88)]'
                }`}>
                    <Icon size={22} strokeWidth={active ? 2.5 : 1.75} />
                </div>
                <span className={`text-[11px] font-semibold leading-none transition-colors ${
                    active ? 'text-white' : 'text-[oklch(0.82_0.02_88)]'
                }`}>
                    {item.label}
                </span>
            </Link>
        );
    };

    return (
        <nav aria-label="Navigasi admin" className={`fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-20 mx-auto max-w-md rounded-[28px] bg-[oklch(0.191_0_0)] shadow-[0_12px_28px_oklch(0.191_0_0/0.18)] transition-transform duration-300 lg:hidden dark:border dark:border-border dark:bg-card ${navVisible ? 'translate-y-0' : 'translate-y-[calc(100%+2rem)]'}`}>
            <div className="flex h-[68px] items-center justify-around px-1">
                {isAdmin ? (
                    <>
                        {/* Admin: Admin, Bugar, Laporan, SAP(drawer), Pengguna */}
                        {items.slice(0, 3).map((item) => (
                            <NavLink key={item.href} item={item} active={isActive(item.href)} />
                        ))}
                        <button
                            onClick={() => setSapDrawerOpen(true)}
                            className="flex shrink-0 flex-col items-center gap-1 px-1 py-2 transition-all"
                            style={{ minWidth: '3.5rem' }}
                        >
                            <div className={`flex items-center justify-center rounded-2xl px-3 py-1.5 transition-all ${
                                isSapActive ? 'bg-accent text-accent-foreground' : 'text-[oklch(0.82_0.02_88)]'
                            }`}>
                                <ClipboardCheck size={22} strokeWidth={isSapActive ? 2.5 : 1.75} />
                            </div>
                            <span className={`text-[11px] font-semibold leading-none transition-colors ${
                                isSapActive ? 'text-white' : 'text-[oklch(0.82_0.02_88)]'
                            }`}>SAP</span>
                        </button>
                        {items.slice(3).map((item) => (
                            <NavLink key={item.href} item={item} active={isActive(item.href)} />
                        ))}
                    </>
                ) : isStaff ? (
                    <>
                        {/* Staff: Beranda, Bugar, SAP(drawer), Assessment(drawer), Profil */}
                        {navItems.slice(0, 2).map((item) => (
                            <NavLink key={item.href} item={item} active={isActive(item.href)} />
                        ))}
                        <button
                            onClick={() => setSapDrawerOpen(true)}
                            className="flex shrink-0 flex-col items-center gap-1 px-1 py-2 transition-all"
                            style={{ minWidth: '3.5rem' }}
                        >
                            <div className={`flex items-center justify-center rounded-2xl px-3 py-1.5 transition-all ${
                                isSapActive ? 'bg-accent text-accent-foreground' : 'text-[oklch(0.82_0.02_88)]'
                            }`}>
                                <ClipboardCheck size={22} strokeWidth={isSapActive ? 2.5 : 1.75} />
                            </div>
                            <span className={`text-[11px] font-semibold leading-none transition-colors ${
                                isSapActive ? 'text-white' : 'text-[oklch(0.82_0.02_88)]'
                            }`}>SAP</span>
                        </button>
                        <button
                            onClick={() => setAssessmentDrawerOpen(true)}
                            className="flex shrink-0 flex-col items-center gap-1 px-1 py-2 transition-all"
                            style={{ minWidth: '3.5rem' }}
                        >
                            <div className={`flex items-center justify-center rounded-2xl px-3 py-1.5 transition-all ${
                                isAssessmentActive ? 'bg-accent text-accent-foreground' : 'text-[oklch(0.82_0.02_88)]'
                            }`}>
                                <GraduationCap size={22} strokeWidth={isAssessmentActive ? 2.5 : 1.75} />
                            </div>
                            <span className={`text-[11px] font-semibold leading-none transition-colors ${
                                isAssessmentActive ? 'text-white' : 'text-[oklch(0.82_0.02_88)]'
                            }`}>Assessment</span>
                        </button>
                        {/* Profil — last item (skip Laporan at index 2, ada di SAP drawer) */}
                        {navItems.slice(3).map((item) => (
                            <NavLink key={item.href} item={item} active={isActive(item.href)} />
                        ))}
                    </>
                ) : (
                    /* Regular user: Beranda, Bugar, Laporan, Assessment(drawer), Profil */
                    <>
                        {navItems.slice(0, 3).map((item) => (
                            <NavLink key={item.href} item={item} active={isActive(item.href)} />
                        ))}
                        <button
                            onClick={() => setAssessmentDrawerOpen(true)}
                            className="flex shrink-0 flex-col items-center gap-1 px-1 py-2 transition-all"
                            style={{ minWidth: '3.5rem' }}
                        >
                            <div className={`flex items-center justify-center rounded-2xl px-3 py-1.5 transition-all ${
                                isAssessmentActive ? 'bg-accent text-accent-foreground' : 'text-[oklch(0.82_0.02_88)]'
                            }`}>
                                <GraduationCap size={22} strokeWidth={isAssessmentActive ? 2.5 : 1.75} />
                            </div>
                            <span className={`text-[11px] font-semibold leading-none transition-colors ${
                                isAssessmentActive ? 'text-white' : 'text-[oklch(0.82_0.02_88)]'
                            }`}>Assessment</span>
                        </button>
                        {/* Profil */}
                        {navItems.slice(3).map((item) => (
                            <NavLink key={item.href} item={item} active={isActive(item.href)} />
                        ))}
                    </>
                )}
            </div>

            {(isStaff || isAdmin) && (
                <Sheet open={sapDrawerOpen} onOpenChange={setSapDrawerOpen}>
                    <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-2xl">
                        <SheetHeader>
                            <SheetTitle className="text-left">SAP</SheetTitle>
                        </SheetHeader>
                        <div className="flex flex-col gap-1 px-4 pb-6">
                            {(isAdmin ? adminSapDrawerItems : sapMobileNavItems).map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.href);

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setSapDrawerOpen(false)}
                                        className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                                            active
                                                ? `${'activeBg' in item ? item.activeBg : 'bg-info-soft'} ${'activeColor' in item ? item.activeColor : 'text-info'}`
                                                : 'text-foreground hover:bg-muted'
                                        }`}
                                    >
                                        <Icon size={20} strokeWidth={active ? 2.5 : 1.75} />
                                        <span className="text-sm font-medium">{item.fullLabel}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </SheetContent>
                </Sheet>
            )}

            {/* Assessment drawer — semua user (non-staff/staff) */}
            {!isAdmin && (
                <Sheet open={assessmentDrawerOpen} onOpenChange={setAssessmentDrawerOpen}>
                    <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-2xl">
                        <SheetHeader>
                            <SheetTitle className="text-left">Assessment</SheetTitle>
                        </SheetHeader>
                        <div className="flex flex-col gap-1 px-4 pb-6">
                            {assessmentDrawerItems.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.href);

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setAssessmentDrawerOpen(false)}
                                        className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                                            active
                                                ? `${item.activeBg} ${item.activeColor}`
                                                : 'text-foreground hover:bg-muted'
                                        }`}
                                    >
                                        <Icon size={20} strokeWidth={active ? 2.5 : 1.75} />
                                        <span className="text-sm font-medium">{item.fullLabel}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </SheetContent>
                </Sheet>
            )}
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
    const isStaff = !isAdmin && ['staff', 'srstaff'].includes(participationLevel);
    const immersive = !isAdmin && (url === '/home' || url.startsWith('/home?'));

    const userMobileNavItems = baseUserMobileNavItems;
    const inboxCount = (usePage<{ inbox_count?: number }>().props.inbox_count ?? 0);
    const [quickOpen, setQuickOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);

    const mainNavGroups = isAdmin
        ? [
            { label: 'Dashboard', items: [
                { title: 'Ringkasan Admin', href: '/home', icon: ShieldCheck },
            ]},
            { label: 'Monitoring', items: [
                { title: 'Bugar Selamat',        href: '/admin/bugar-selamat',          icon: HeartPulse },
                { title: 'Laporan Bahaya',        href: '/admin/laporan-bahaya',         icon: AlertTriangle },
                { title: 'Observasi Keselamatan', href: '/admin/observasi-keselamatan',  icon: ClipboardCheck },
                { title: 'Komunikasi JSA',        href: '/admin/komunikasi-jsa',         icon: BookOpen },
                { title: 'Inspeksi Kantor',       href: '/admin/inspeksi-kantor',        icon: Building2 },
                { title: 'Inspeksi Tambang',      href: '/admin/inspeksi-tambang',       icon: Mountain },
                { title: 'Inspeksi Workshop',     href: '/admin/inspeksi-workshop',      icon: Wrench },
                { title: 'Inspeksi Mess',         href: '/admin/inspeksi-mess',          icon: BedDouble },
                { title: 'Assessment Safety',     href: '/admin/assessment',             icon: GraduationCap },
                { title: 'Assessment HR',         href: '/admin/hr-assessment',          icon: UserCheck },
            ]},
            { label: 'Manajemen', items: [
                { title: 'Kelola Pengguna', href: '/admin/users',    icon: Users },
                { title: 'Kelola Site',     href: '/admin/sites',    icon: MapPin },
                { title: 'Target Kinerja',  href: '/admin/targets',  icon: Target },
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
                    items: programsFor(m, participationLevel).map((p) => ({ title: p.label, href: p.href, icon: p.icon })),
                })),
          ];

    return (
        <SidebarProvider defaultOpen={sidebarOpen ?? true}>
            {/* ── Desktop sidebar (hidden on mobile) ── */}
            <Sidebar collapsible="icon" variant="inset" className="hidden lg:flex">
                <SidebarHeader className="border-b border-sidebar-border/50 pb-3">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                size="lg"
                                asChild
                                className="rounded-xl transition-colors hover:bg-sidebar-accent/50"
                                tooltip={{ children: 'MyWahana' }}
                            >
                                <Link href={dashboardUrl} prefetch="mount">
                                    <AppLogo />
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarHeader>

                <SidebarContent className="gap-1 px-2 py-2">
                    <NavMain groups={mainNavGroups} />
                </SidebarContent>

                <SidebarFooter className="gap-2 border-t border-sidebar-border/50 px-2 pt-3 pb-3">
                    <NavUser />
                </SidebarFooter>
            </Sidebar>

            {/* ── Main content area ── */}
            <SidebarInset>
                <OfflineBanner />
                {/* Desktop top bar (hidden on mobile) */}
                <header className="hidden h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 lg:flex">
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
                                <Button size="sm" onClick={() => setQuickOpen(true)} className="mr-1">
                                    <Plus />
                                    Buat
                                </Button>
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
                <main className={cn('flex-1 px-4 py-4 lg:p-6 lg:pb-6', !isAdmin && isFocusedFlow(url) ? 'pb-0' : 'pb-[calc(7rem+env(safe-area-inset-bottom))]')}>
                    {/* Mobile: constrain to phone-width; Desktop: full width */}
                    <div className="mx-auto w-full max-w-lg lg:max-w-none">
                        {children}
                    </div>
                </main>

                {/* Mobile bottom nav */}
                {isAdmin ? (
                    <MobileBottomNav url={url} isAdmin={isAdmin} isStaff={isStaff} navItems={userMobileNavItems} />
                ) : (
                    <>
                        <BottomNav />
                        <QuickActionSheet open={quickOpen} onOpenChange={setQuickOpen} />
                        <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
                    </>
                )}
            </SidebarInset>
        </SidebarProvider>
    );
}
