import { Link, usePage } from '@inertiajs/react';
import { AlertTriangle, BedDouble, Building2, ClipboardCheck, ClipboardList, HeartPulse, Home, LayoutGrid, LogOut, MapPin, Mountain, ShieldCheck, User, Users, Wrench } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import AppLogo from '@/components/app-logo';
import { AppearanceToggleButton } from '@/components/appearance-toggle-button';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { TeamSwitcher } from '@/components/team-switcher';
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
import { index as bugarSelamatIndex } from '@/routes/bugar-selamat';
import { index as laporanBahayaIndex } from '@/routes/laporan-bahaya';
import { index as adminIndex } from '@/routes/admin';
import { index as okIndex } from '@/routes/sap/observasi-keselamatan';
import { index as inspeksiKantorIndex } from '@/routes/sap/inspeksi-kantor';
import { index as inspeksiTambangIndex } from '@/routes/sap/inspeksi-tambang';
import { index as inspeksiWorkshopIndex } from '@/routes/sap/inspeksi-workshop';
import { index as inspeksiMessIndex } from '@/routes/sap/inspeksi-mess';
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
        activeColor: 'text-blue-600 dark:text-blue-400',
        activeBg: 'bg-blue-100 dark:bg-blue-950',
        inactiveColor: 'text-slate-400 dark:text-slate-500',
    },
    {
        href: '/bugar-selamat',
        label: 'Bugar',
        icon: ClipboardList,
        activeColor: 'text-green-600 dark:text-green-400',
        activeBg: 'bg-green-100 dark:bg-green-950',
        inactiveColor: 'text-slate-400 dark:text-slate-500',
    },
    {
        href: '/laporan-bahaya',
        label: 'Laporan',
        icon: AlertTriangle,
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

const sapMobileNavItems = [
    {
        href: '/laporan-bahaya',
        label: 'Laporan',
        fullLabel: 'Laporan Bahaya',
        icon: AlertTriangle,
        activeColor: 'text-red-500 dark:text-red-400',
        activeBg: 'bg-red-100 dark:bg-red-950',
        inactiveColor: 'text-slate-400 dark:text-slate-500',
    },
    {
        href: '/sap/observasi-keselamatan',
        label: 'OK',
        fullLabel: 'Observasi Keselamatan',
        icon: ClipboardCheck,
        activeColor: 'text-teal-600 dark:text-teal-400',
        activeBg: 'bg-teal-100 dark:bg-teal-950',
        inactiveColor: 'text-slate-400 dark:text-slate-500',
    },
    {
        href: '/sap/inspeksi-kantor',
        label: 'Kantor',
        fullLabel: 'Inspeksi Kantor',
        icon: Building2,
        activeColor: 'text-teal-600 dark:text-teal-400',
        activeBg: 'bg-teal-100 dark:bg-teal-950',
        inactiveColor: 'text-slate-400 dark:text-slate-500',
    },
    {
        href: '/sap/inspeksi-tambang',
        label: 'Tambang',
        fullLabel: 'Inspeksi Tambang',
        icon: Mountain,
        activeColor: 'text-teal-600 dark:text-teal-400',
        activeBg: 'bg-teal-100 dark:bg-teal-950',
        inactiveColor: 'text-slate-400 dark:text-slate-500',
    },
    {
        href: '/sap/inspeksi-workshop',
        label: 'Workshop',
        fullLabel: 'Inspeksi Workshop',
        icon: Wrench,
        activeColor: 'text-teal-600 dark:text-teal-400',
        activeBg: 'bg-teal-100 dark:bg-teal-950',
        inactiveColor: 'text-slate-400 dark:text-slate-500',
    },
    {
        href: '/sap/inspeksi-mess',
        label: 'Mess',
        fullLabel: 'Inspeksi Mess',
        icon: BedDouble,
        activeColor: 'text-teal-600 dark:text-teal-400',
        activeBg: 'bg-teal-100 dark:bg-teal-950',
        inactiveColor: 'text-slate-400 dark:text-slate-500',
    },
];

const adminSapDrawerItems = [
    { href: '/admin/observasi-keselamatan', fullLabel: 'Monitor Observasi Keselamatan', icon: ClipboardCheck },
    { href: '/admin/inspeksi-kantor',       fullLabel: 'Monitor Inspeksi Kantor',       icon: Building2 },
    { href: '/admin/inspeksi-tambang',      fullLabel: 'Monitor Inspeksi Tambang',      icon: Mountain },
    { href: '/admin/inspeksi-workshop',     fullLabel: 'Monitor Inspeksi Workshop',     icon: Wrench },
    { href: '/admin/inspeksi-mess',         fullLabel: 'Monitor Inspeksi Mess',         icon: BedDouble },
    { href: '/admin/sites',                 fullLabel: 'Kelola Site',                   icon: MapPin },
];

// Admin navbar: Admin, Bugar, Laporan, [SAP button], Pengguna
const adminMobileNavItems = [
    {
        href: '/admin',
        label: 'Admin',
        icon: ShieldCheck,
        activeColor: 'text-blue-600 dark:text-blue-400',
        activeBg: 'bg-blue-100 dark:bg-blue-950',
        inactiveColor: 'text-slate-400 dark:text-slate-500',
    },
    {
        href: '/admin/bugar-selamat',
        label: 'Bugar',
        icon: HeartPulse,
        activeColor: 'text-green-600 dark:text-green-400',
        activeBg: 'bg-green-100 dark:bg-green-950',
        inactiveColor: 'text-slate-400 dark:text-slate-500',
    },
    {
        href: '/admin/laporan-bahaya',
        label: 'Laporan',
        icon: AlertTriangle,
        activeColor: 'text-red-500 dark:text-red-400',
        activeBg: 'bg-red-100 dark:bg-red-950',
        inactiveColor: 'text-slate-400 dark:text-slate-500',
    },
    {
        href: '/admin/users',
        label: 'Pengguna',
        icon: Users,
        activeColor: 'text-purple-600 dark:text-purple-400',
        activeBg: 'bg-purple-100 dark:bg-purple-950',
        inactiveColor: 'text-slate-400 dark:text-slate-500',
    },
];

function MobileHeader({ title, showBack, backHref, isAdmin }: { title?: string; showBack?: boolean; backHref?: string; isAdmin?: boolean }) {
    return (
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden">
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
                    <h1 className="text-sm font-semibold leading-tight">{title ?? 'MyWahana'}</h1>
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
    );
}

function MobileBottomNav({ url, isAdmin, isStaff, navItems }: { url: string; isAdmin: boolean; isStaff: boolean; navItems: typeof baseUserMobileNavItems }) {
    const [sapDrawerOpen, setSapDrawerOpen] = useState(false);
    const items = isAdmin ? adminMobileNavItems : navItems;
    const isSapActive = url.startsWith('/sap/') || url.startsWith('/laporan-bahaya') || url.startsWith('/admin/inspeksi-') || url.startsWith('/admin/observasi-keselamatan');

    const isActive = (href: string) => {
        if (href === '/admin' || href === '/home') return url === href;
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
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-10 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden">
            <div className="flex h-[72px] items-center justify-around px-1">
                {isStaff || isAdmin ? (
                    <>
                        {/* Staff: Beranda, Bugar | Admin: Admin, Bugar, Laporan */}
                        {(isStaff ? navItems.slice(0, 2) : items.slice(0, 3)).map((item) => (
                            <NavLink key={item.href} item={item} active={isActive(item.href)} />
                        ))}
                        <button
                            onClick={() => setSapDrawerOpen(true)}
                            className="flex shrink-0 flex-col items-center gap-1 px-1 py-2 transition-all"
                            style={{ minWidth: '3.5rem' }}
                        >
                            <div className={`flex items-center justify-center rounded-2xl px-3 py-1.5 transition-all ${
                                isSapActive
                                    ? 'bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400'
                                    : 'text-slate-400 dark:text-slate-500'
                            }`}>
                                <ClipboardCheck size={22} strokeWidth={isSapActive ? 2.5 : 1.75} />
                            </div>
                            <span className={`text-[10px] font-semibold leading-none transition-colors ${
                                isSapActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500'
                            }`}>
                                SAP
                            </span>
                        </button>
                        {/* Staff: Profil (skip Laporan, ada di SAP drawer) | Admin: Pengguna (last item) */}
                        {(isStaff ? navItems.slice(3) : items.slice(3)).map((item) => (
                            <NavLink key={item.href} item={item} active={isActive(item.href)} />
                        ))}
                    </>
                ) : (
                    items.map((item) => (
                        <NavLink key={item.href} item={item} active={isActive(item.href)} />
                    ))
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
                                                ? `${'activeBg' in item ? item.activeBg : 'bg-teal-100 dark:bg-teal-950'} ${'activeColor' in item ? item.activeColor : 'text-teal-600 dark:text-teal-400'}`
                                                : 'text-foreground hover:bg-accent'
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
    const { auth, currentTeam, sidebarOpen } = usePage<{
        auth: Auth;
        currentTeam?: { slug: string } | null;
        sidebarOpen?: boolean;
    }>().props;

    const dashboardUrl = '/home';

    const isAdmin = auth?.user?.is_admin === true;
    const participationLevel = (auth?.user as { participation_level?: string })?.participation_level ?? '';
    const isStaff = !isAdmin && ['staff', 'srstaff'].includes(participationLevel);

    const userMobileNavItems = baseUserMobileNavItems;

    const mainNavGroups = isAdmin
        ? [
            { items: [
                { title: 'Admin', href: adminIndex.url(), icon: ShieldCheck },
                { title: 'Monitor Bugar Selamat', href: '/admin/bugar-selamat', icon: HeartPulse },
                { title: 'Monitor Laporan Bahaya', href: '/admin/laporan-bahaya', icon: AlertTriangle },
                { title: 'Monitor Observasi Keselamatan', href: '/admin/observasi-keselamatan', icon: ClipboardCheck },
                { title: 'Kelola Pengguna', href: '/admin/users', icon: Users },
                { title: 'Kelola Site', href: '/admin/sites', icon: MapPin },
            ]},
            { label: 'SAP', items: [
                { title: 'Monitor Inspeksi Kantor',   href: '/admin/inspeksi-kantor',   icon: Building2 },
                { title: 'Monitor Inspeksi Tambang',  href: '/admin/inspeksi-tambang',  icon: Mountain },
                { title: 'Monitor Inspeksi Workshop', href: '/admin/inspeksi-workshop', icon: Wrench },
                { title: 'Monitor Inspeksi Mess',     href: '/admin/inspeksi-mess',     icon: BedDouble },
            ]},
          ]
        : isStaff
        ? [
            { items: [
                { title: 'Dashboard', href: dashboardUrl, icon: LayoutGrid },
                { title: 'Bugar Selamat', href: bugarSelamatIndex.url(), icon: HeartPulse },
                { title: 'Laporan Bahaya', href: laporanBahayaIndex.url(), icon: AlertTriangle },
            ]},
            { label: 'SAP', items: [
                { title: 'Observasi Keselamatan', href: okIndex.url(),             icon: ClipboardCheck },
                { title: 'Inspeksi Kantor',       href: inspeksiKantorIndex.url(),   icon: Building2 },
                { title: 'Inspeksi Tambang',      href: inspeksiTambangIndex.url(),  icon: Mountain },
                { title: 'Inspeksi Workshop',     href: inspeksiWorkshopIndex.url(), icon: Wrench },
                { title: 'Inspeksi Mess',         href: inspeksiMessIndex.url(),     icon: BedDouble },
            ]},
          ]
        : [{ items: [
            { title: 'Dashboard', href: dashboardUrl, icon: LayoutGrid },
            { title: 'Bugar Selamat', href: bugarSelamatIndex.url(), icon: HeartPulse },
            { title: 'Laporan Bahaya', href: laporanBahayaIndex.url(), icon: AlertTriangle },
          ]}];

    return (
        <SidebarProvider defaultOpen={sidebarOpen ?? true}>
            {/* ── Desktop sidebar (hidden on mobile) ── */}
            <Sidebar collapsible="icon" variant="inset" className="hidden lg:flex">
                <SidebarHeader>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton size="lg" asChild>
                                <Link href={dashboardUrl} prefetch>
                                    <AppLogo />
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <TeamSwitcher />
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarHeader>

                <SidebarContent>
                    <NavMain groups={mainNavGroups} />
                </SidebarContent>

                <SidebarFooter>
                    <NavUser />
                </SidebarFooter>
            </Sidebar>

            {/* ── Main content area ── */}
            <SidebarInset>
                {/* Desktop top bar (hidden on mobile) */}
                <header className="hidden h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 lg:flex">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mx-1 h-4" />
                    <span className="text-sm font-medium text-muted-foreground">
                        {title ?? 'MyWahana'}
                    </span>
                    <div className="ml-auto">
                        <AppearanceToggleButton />
                    </div>
                </header>

                {/* Mobile header */}
                <MobileHeader
                    title={title}
                    showBack={showBack}
                    backHref={backHref}
                    isAdmin={auth?.user?.is_admin}
                />

                {/* Page content */}
                <main className="flex-1 px-4 py-4 pb-24 lg:p-6 lg:pb-6">
                    {/* Mobile: constrain to phone-width; Desktop: full width */}
                    <div className="mx-auto w-full max-w-lg lg:max-w-none">
                        {children}
                    </div>
                </main>

                {/* Mobile bottom nav */}
                <MobileBottomNav url={url} isAdmin={isAdmin} isStaff={isStaff} navItems={userMobileNavItems} />
            </SidebarInset>
        </SidebarProvider>
    );
}
