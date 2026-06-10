import { Link, usePage } from '@inertiajs/react';
import { AlertTriangle, ClipboardList, HeartPulse, Home, LayoutGrid, LogOut, ShieldCheck, User, Users } from 'lucide-react';
import { type ReactNode } from 'react';
import AppLogo from '@/components/app-logo';
import { AppearanceToggleButton } from '@/components/appearance-toggle-button';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { TeamSwitcher } from '@/components/team-switcher';
import { Separator } from '@/components/ui/separator';
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
import type { Auth } from '@/types';

type Props = {
    children: ReactNode;
    title?: string;
    showBack?: boolean;
    backHref?: string;
};

const userMobileNavItems = [
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

function MobileBottomNav({ url, isAdmin }: { url: string; isAdmin: boolean }) {
    const navItems = isAdmin ? adminMobileNavItems : userMobileNavItems;

    const isActive = (href: string) => {
        if (href === '/admin' || href === '/home') return url === href;
        return url.startsWith(href);
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-10 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden">
            <div className="mx-auto flex h-[72px] max-w-lg items-center justify-around px-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex flex-1 flex-col items-center gap-1 py-2 transition-all"
                        >
                            <div className={`flex items-center justify-center rounded-2xl px-5 py-1.5 transition-all ${
                                active ? `${item.activeBg} ${item.activeColor}` : item.inactiveColor
                            }`}>
                                <Icon size={24} strokeWidth={active ? 2.5 : 1.75} />
                            </div>
                            <span className={`text-[11px] font-semibold leading-none transition-colors ${
                                active ? item.activeColor : item.inactiveColor
                            }`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
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

    const mainNavItems = isAdmin
        ? [
            { title: 'Admin', href: adminIndex.url(), icon: ShieldCheck },
            { title: 'Monitor Bugar Selamat', href: '/admin/bugar-selamat', icon: HeartPulse },
            { title: 'Monitor Laporan Bahaya', href: '/admin/laporan-bahaya', icon: AlertTriangle },
            { title: 'Kelola Pengguna', href: '/admin/users', icon: Users },
          ]
        : [
            { title: 'Dashboard', href: dashboardUrl, icon: LayoutGrid },
            { title: 'Bugar Selamat', href: bugarSelamatIndex.url(), icon: HeartPulse },
            { title: 'Laporan Bahaya', href: laporanBahayaIndex.url(), icon: AlertTriangle },
          ];

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
                    <NavMain items={mainNavItems} />
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
                <MobileBottomNav url={url} isAdmin={isAdmin} />
            </SidebarInset>
        </SidebarProvider>
    );
}
