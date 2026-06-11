// Shared UI constants for inspection risk levels, statuses, and department lists.

export const RISK_LEVEL_CONFIG = {
    L:  { label: 'Baik',            className: 'bg-green-100 text-green-700 border-green-300' },
    M:  { label: 'Cukup',           className: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
    H:  { label: 'Perhatian',       className: 'bg-orange-100 text-orange-700 border-orange-300' },
    VH: { label: 'Perlu Tindakan',  className: 'bg-red-100 text-red-700 border-red-300' },
} as const;

export type RiskLevel = keyof typeof RISK_LEVEL_CONFIG;

export const INSPECTION_STATUS_CONFIG = {
    selesai:               { label: 'Selesai',              className: 'bg-green-100 text-green-700 border-green-300',  barColor: 'bg-green-500' },
    ditolak:               { label: 'Ditolak',              className: 'bg-red-100 text-red-700 border-red-300',        barColor: 'bg-red-500' },
    menunggu_re_inspeksi:  { label: 'Menunggu Re-Inspeksi', className: 'bg-yellow-100 text-yellow-700 border-yellow-300', barColor: 'bg-yellow-500' },
} as const;

export type InspectionStatus = keyof typeof INSPECTION_STATUS_CONFIG;

export const DEPTS = ['Production', 'Maintenance', 'Supply Chain', 'Engineering', 'HSE', 'HRGA'] as const;

export const RISK_COLORS: Record<string, string> = { AA: '#ef4444', A: '#f97316', B: '#eab308', C: '#22c55e' };
export const RISK_LABELS: Record<string, string>  = { AA: 'Sangat Tinggi', A: 'Tinggi', B: 'Sedang', C: 'Rendah' };
export const LEVEL_LABELS: Record<string, string> = { nonstaff: 'Non-Staff', staff: 'Staff', srstaff: 'Sr. Staff' };

export const TREND_SERIES = [
    { key: 'bugar',     name: 'Bugar Selamat',        color: '#22c55e' },
    { key: 'laporan',   name: 'Laporan Bahaya',        color: '#f97316' },
    { key: 'observasi', name: 'Observasi Keselamatan', color: '#8b5cf6' },
    { key: 'inspeksi',  name: 'Inspeksi',              color: '#14b8a6' },
] as const;

export function fmtMonth(month: string): string {
    const [y, m] = month.split('-');
    return new Date(Number(y), Number(m) - 1).toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
}
