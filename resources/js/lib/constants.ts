// Shared UI constants: department and level lists.

export const DEPTS = ['Production', 'Maintenance', 'Supply Chain', 'Engineering', 'HSE', 'HRGA'] as const;

export const LEVEL_LABELS: Record<string, string> = { nonstaff: 'Non-Staff', staff: 'Staff', srstaff: 'Sr. Staff' };

export const TREND_SERIES = [
    { key: 'bugar',     name: 'Bugar Selamat',        color: 'var(--chart-4)' },
    { key: 'laporan',   name: 'Laporan Bahaya',        color: 'var(--chart-5)' },
    { key: 'observasi', name: 'Observasi Keselamatan', color: 'var(--chart-3)' },
    { key: 'inspeksi',  name: 'Inspeksi',              color: 'var(--chart-2)' },
] as const;

export function fmtMonth(month: string): string {
    const [y, m] = month.split('-');

    return new Date(Number(y), Number(m) - 1).toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
}
