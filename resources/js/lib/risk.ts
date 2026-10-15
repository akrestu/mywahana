export type RiskLevel = 'AA' | 'A' | 'B' | 'C';

// Must match LaporanBahaya::computeRiskLevel() on the backend.
export function computeRisk(p: number, f: number, s: number) {
    const nilai = p * f * s;
    const level: RiskLevel =
        nilai >= 125 ? 'AA' : nilai >= 25 ? 'A' : nilai >= 10 ? 'B' : 'C';

    return { nilai, level };
}

export const riskLabels: Record<RiskLevel, string> = {
    AA: 'Ekstrem',
    A: 'Tinggi',
    B: 'Sedang',
    C: 'Rendah',
};
