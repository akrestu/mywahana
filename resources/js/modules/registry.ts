import {
    AlertTriangle,
    BedDouble,
    BookOpen,
    Building2,
    CalendarDays,
    ClipboardCheck,
    Clock,
    FileText,
    GraduationCap,
    HeartPulse,
    Megaphone,
    Mountain,
    ShieldCheck,
    UserCheck,
    Users,
    Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type Level = 'nonstaff' | 'staff' | 'srstaff';

export type Program = {
    key: string;
    label: string;
    href: string;
    icon: LucideIcon;
    /** Lowest participation level that can open this program. */
    minLevel?: Level;
    /** Shown in the [+] quick-action sheet when set. */
    createHref?: string;
    createLabel?: string;
};

export type ModuleDef = {
    key: string;
    label: string;
    description: string;
    icon: LucideIcon;
    /** Tailwind background for the module tile icon. */
    tint: string;
    status: 'active' | 'soon';
    href?: string;
    /** URL prefixes that belong to this module, for active-state matching. */
    match?: string[];
    programs: Program[];
    /** Two-letter mark for modules that are not built yet. */
    abbr?: string;
};

/**
 * Single source for modules: the launcher, desktop sidebar, quick-action
 * sheet and command palette all read from here. A new module is one entry
 * plus its pages.
 */
export const modules: ModuleDef[] = [
    {
        key: 'k3',
        label: 'K3 / Safety',
        description: 'Bugar, bahaya, inspeksi, JSA',
        icon: ShieldCheck,
        tint: 'bg-accent-soft',
        status: 'active',
        href: '/k3',
        match: ['/k3', '/bugar-selamat', '/laporan-bahaya', '/sap'],
        programs: [
            {
                key: 'bugar-selamat',
                label: 'Bugar Selamat',
                href: '/bugar-selamat',
                icon: HeartPulse,
                createHref: '/bugar-selamat/create',
                createLabel: 'Isi Bugar Selamat',
            },
            {
                key: 'laporan-bahaya',
                label: 'Laporan Bahaya',
                href: '/laporan-bahaya',
                icon: AlertTriangle,
                createHref: '/laporan-bahaya/create',
                createLabel: 'Lapor Bahaya',
            },
            {
                key: 'observasi',
                label: 'Observasi Keselamatan',
                href: '/sap/observasi-keselamatan',
                icon: ClipboardCheck,
                minLevel: 'staff',
                createHref: '/sap/observasi-keselamatan/create',
                createLabel: 'Observasi',
            },
            {
                key: 'jsa',
                label: 'Komunikasi JSA',
                href: '/sap/komunikasi-jsa',
                icon: BookOpen,
                minLevel: 'staff',
                createHref: '/sap/komunikasi-jsa/create',
                createLabel: 'Komunikasi JSA',
            },
            {
                key: 'inspeksi-kantor',
                label: 'Inspeksi Kantor',
                href: '/sap/inspeksi-kantor',
                icon: Building2,
                minLevel: 'staff',
                createHref: '/sap/inspeksi-kantor/create',
                createLabel: 'Inspeksi Kantor',
            },
            {
                key: 'inspeksi-tambang',
                label: 'Inspeksi Tambang',
                href: '/sap/inspeksi-tambang',
                icon: Mountain,
                minLevel: 'staff',
                createHref: '/sap/inspeksi-tambang/create',
                createLabel: 'Inspeksi Tambang',
            },
            {
                key: 'inspeksi-workshop',
                label: 'Inspeksi Workshop',
                href: '/sap/inspeksi-workshop',
                icon: Wrench,
                minLevel: 'staff',
                createHref: '/sap/inspeksi-workshop/create',
                createLabel: 'Inspeksi Workshop',
            },
            {
                key: 'inspeksi-mess',
                label: 'Inspeksi Mess',
                href: '/sap/inspeksi-mess',
                icon: BedDouble,
                minLevel: 'staff',
                createHref: '/sap/inspeksi-mess/create',
                createLabel: 'Inspeksi Mess',
            },
        ],
    },
    {
        key: 'assessment',
        label: 'Assessment',
        description: 'Safety & HR',
        icon: GraduationCap,
        tint: 'bg-info-soft',
        status: 'active',
        href: '/assessment',
        match: ['/assessment', '/hr-assessment'],
        programs: [
            {
                key: 'assessment-safety',
                label: 'Assessment Safety',
                href: '/assessment',
                icon: GraduationCap,
            },
            {
                key: 'assessment-hr',
                label: 'Assessment HR',
                href: '/hr-assessment',
                icon: UserCheck,
            },
        ],
    },
    {
        key: 'hr',
        label: 'HR & Kepegawaian',
        description: 'Data diri, slip, kontrak',
        icon: Users,
        tint: 'bg-muted',
        status: 'soon',
        abbr: 'HR',
        programs: [],
    },
    {
        key: 'cuti',
        label: 'Cuti & Izin',
        description: 'Ajukan dan pantau persetujuan',
        icon: CalendarDays,
        tint: 'bg-muted',
        status: 'soon',
        abbr: 'CI',
        programs: [],
    },
    {
        key: 'absensi',
        label: 'Absensi',
        description: 'Kehadiran dan lembur',
        icon: Clock,
        tint: 'bg-muted',
        status: 'soon',
        abbr: 'AB',
        programs: [],
    },
    {
        key: 'pengumuman',
        label: 'Pengumuman',
        description: 'Info perusahaan per site',
        icon: Megaphone,
        tint: 'bg-muted',
        status: 'soon',
        abbr: 'PG',
        programs: [],
    },
    {
        key: 'dokumen',
        label: 'Dokumen',
        description: 'SOP, form, dan arsip',
        icon: FileText,
        tint: 'bg-muted',
        status: 'soon',
        abbr: 'DK',
        programs: [],
    },
];

const rank: Record<Level, number> = { nonstaff: 0, staff: 1, srstaff: 2 };

export function canAccess(
    program: Program,
    level: string | undefined,
): boolean {
    const userRank = rank[(level as Level) ?? 'nonstaff'] ?? 0;

    return userRank >= rank[program.minLevel ?? 'nonstaff'];
}

export function programsFor(
    module: ModuleDef,
    level: string | undefined,
): Program[] {
    return module.programs.filter((p) => canAccess(p, level));
}

export function quickActionsFor(level: string | undefined): Program[] {
    return modules
        .filter((m) => m.status === 'active')
        .flatMap((m) => programsFor(m, level))
        .filter((p) => p.createHref);
}

export function moduleForUrl(url: string): ModuleDef | undefined {
    return modules.find((m) =>
        m.match?.some(
            (prefix) =>
                url === prefix ||
                url.startsWith(`${prefix}/`) ||
                url.startsWith(`${prefix}?`),
        ),
    );
}
