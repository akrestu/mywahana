import { Link, usePage } from '@inertiajs/react';
import { AlertTriangle, BedDouble, BookOpen, Building2, ClipboardCheck, HeartPulse, LayoutGrid, MapPin, Mountain, ShieldCheck, Target, Users, Wrench } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { AppearanceToggleButton } from '@/components/appearance-toggle-button';
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
import { index as okIndex } from '@/routes/sap/observasi-keselamatan';
import { index as inspeksiKantorIndex } from '@/routes/sap/inspeksi-kantor';
import { index as inspeksiTambangIndex } from '@/routes/sap/inspeksi-tambang';
import { index as inspeksiWorkshopIndex } from '@/routes/sap/inspeksi-workshop';
import { index as inspeksiMessIndex } from '@/routes/sap/inspeksi-mess';
import { index as komunikasiJsaIndex } from '@/routes/sap/komunikasi-jsa';
import type { Auth } from '@/types/auth';
import type { NavGroup } from '@/components/nav-main';

export function AppSidebar() {
    const { auth } = usePage<{ auth: Auth }>().props;
    const dashboardUrl = dashboardRoute.url();

    const isAdmin = auth?.user?.is_admin === true;
    const isStaff = !isAdmin && ['staff', 'srstaff'].includes((auth?.user as { participation_level?: string })?.participation_level ?? '');

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
                    { title: 'Bugar Selamat',          href: '/admin/bugar-selamat',          icon: HeartPulse },
                    { title: 'Laporan Bahaya',          href: '/admin/laporan-bahaya',          icon: AlertTriangle },
                    { title: 'Observasi Keselamatan',   href: '/admin/observasi-keselamatan',   icon: ClipboardCheck },
                    { title: 'Inspeksi Kantor',         href: '/admin/inspeksi-kantor',         icon: Building2 },
                    { title: 'Inspeksi Tambang',        href: '/admin/inspeksi-tambang',        icon: Mountain },
                    { title: 'Inspeksi Workshop',       href: '/admin/inspeksi-workshop',       icon: Wrench },
                    { title: 'Inspeksi Mess',           href: '/admin/inspeksi-mess',           icon: BedDouble },
                ],
            },
            {
                label: 'Manajemen',
                items: [
                    { title: 'Kelola Pengguna', href: '/admin/users',    icon: Users },
                    { title: 'Kelola Site',     href: '/admin/sites',    icon: MapPin },
                    { title: 'Target Kinerja',  href: '/admin/targets',  icon: Target },
                ],
            },
          ]
        : [
            {
                label: 'Menu Utama',
                items: [
                    { title: 'Dashboard', href: dashboardUrl, icon: LayoutGrid },
                    { title: 'Bugar Selamat', href: bugarSelamatIndex.url(), icon: HeartPulse },
                    { title: 'Laporan Bahaya', href: laporanBahayaIndex.url(), icon: AlertTriangle },
                ],
            },
            ...(isStaff ? [{
                label: 'SAP',
                items: [
                    { title: 'Observasi Keselamatan', href: okIndex.url(), icon: ClipboardCheck },
                    { title: 'Komunikasi JSA',       href: komunikasiJsaIndex.url(),   icon: BookOpen },
                    { title: 'Inspeksi Kantor',       href: inspeksiKantorIndex.url(),   icon: Building2 },
                    { title: 'Inspeksi Tambang',      href: inspeksiTambangIndex.url(),  icon: Mountain },
                    { title: 'Inspeksi Workshop',     href: inspeksiWorkshopIndex.url(), icon: Wrench },
                    { title: 'Inspeksi Mess',         href: inspeksiMessIndex.url(),     icon: BedDouble },
                ],
            }] : []),
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
