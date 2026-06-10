import { Link, usePage } from '@inertiajs/react';
import { AlertTriangle, HeartPulse, LayoutGrid, ShieldCheck, Users } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator,
} from '@/components/ui/sidebar';
import { home as dashboardRoute } from '@/routes/app';
import { index as bugarSelamatIndex } from '@/routes/bugar-selamat';
import { index as laporanBahayaIndex } from '@/routes/laporan-bahaya';
import { index as adminIndex } from '@/routes/admin';
import type { Auth } from '@/types/auth';
import type { NavGroup } from '@/components/nav-main';

export function AppSidebar() {
    const { auth } = usePage<{ auth: Auth }>().props;
    const dashboardUrl = dashboardRoute.url();

    const isAdmin = auth?.user?.is_admin === true;

    const navGroups: NavGroup[] = isAdmin
        ? [
            {
                label: 'Dashboard',
                items: [
                    { title: 'Ringkasan Admin', href: adminIndex.url(), icon: ShieldCheck },
                ],
            },
            {
                label: 'Monitoring',
                items: [
                    { title: 'Bugar Selamat', href: '/admin/bugar-selamat', icon: HeartPulse },
                    { title: 'Laporan Bahaya', href: '/admin/laporan-bahaya', icon: AlertTriangle },
                ],
            },
            {
                label: 'Manajemen',
                items: [
                    { title: 'Kelola Pengguna', href: '/admin/users', icon: Users },
                ],
            },
          ]
        : [
            {
                items: [
                    { title: 'Dashboard', href: dashboardUrl, icon: LayoutGrid },
                    { title: 'Bugar Selamat', href: bugarSelamatIndex.url(), icon: HeartPulse },
                    { title: 'Laporan Bahaya', href: laporanBahayaIndex.url(), icon: AlertTriangle },
                ],
            },
          ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader className="pb-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="hover:bg-sidebar-accent/60">
                            <Link href={dashboardUrl} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarSeparator className="mx-0 opacity-50" />

            <SidebarContent className="pt-2">
                <NavMain groups={navGroups} />
            </SidebarContent>

            <SidebarSeparator className="mx-0 opacity-50" />

            <SidebarFooter className="pt-2">
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
