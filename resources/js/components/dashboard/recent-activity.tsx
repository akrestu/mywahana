import { Link } from '@inertiajs/react';
import { tindakanLabels } from '@/lib/status';
import { cn } from '@/lib/utils';

type Tone = 'ok' | 'warn' | 'bad';

export type RecentBugar = {
    id: number;
    tanggal: string;
    shift: string;
    status_kelayakan: 'layak' | 'catatan' | 'dilarang';
};
export type RecentLaporan = {
    id: number;
    tanggal: string;
    lokasi: string;
    tingkat_risiko: string;
    status_tindakan: 'pending' | 'continue' | 'progress' | 'close';
};
export type RecentObservasi = {
    id: number;
    tanggal: string;
    jenis_pekerjaan: string;
    lokasi_kerja: string;
    status: string;
};
export type RecentInspeksi = {
    id: number;
    tanggal: string;
    status: string;
    risk_level: string | null;
    jenis: 'Kantor' | 'Tambang' | 'Workshop' | 'Mess';
};
export type RecentJsa = {
    id: number;
    tanggal: string;
    lokasi: string;
    judul_dokumen: string;
    status: string;
};

type Item = {
    key: string;
    tanggal: string;
    type: string;
    detail: string;
    status: string;
    tone: Tone;
    href: string;
};

const TONE: Record<Tone, string> = {
    ok: 'border-success/30 bg-success-soft text-success',
    warn: 'border-warning/30 bg-warning-soft text-warning',
    bad: 'border-destructive/30 bg-destructive-soft text-destructive',
};

const KELAYAKAN: Record<RecentBugar['status_kelayakan'], [string, Tone]> = {
    layak: ['Layak', 'ok'],
    catatan: ['Catatan', 'warn'],
    dilarang: ['Dilarang', 'bad'],
};

const TINDAKAN: Record<RecentLaporan['status_tindakan'], [string, Tone]> = {
    pending: [tindakanLabels.pending, 'bad'],
    continue: [tindakanLabels.continue, 'warn'],
    progress: [tindakanLabels.progress, 'warn'],
    close: [tindakanLabels.close, 'ok'],
};

// Status form SAP: menunggu_* = menunggu pihak lain, ditolak = perlu diperbaiki.
function formStatus(status: string): [string, Tone] {
    const label = status
        .replace(/_/g, ' ')
        .replace(/^\w/, (c) => c.toUpperCase());

    if (status.includes('tolak')) {
        return [label, 'bad'];
    }

    return [label, status.startsWith('menunggu') ? 'warn' : 'ok'];
}

export function RecentActivity({
    bugar,
    laporan,
    observasi,
    inspeksi,
    jsa,
    limit = 5,
}: {
    bugar: RecentBugar[];
    laporan: RecentLaporan[];
    observasi: RecentObservasi[];
    inspeksi: RecentInspeksi[];
    jsa: RecentJsa[];
    limit?: number;
}) {
    const items: Item[] = [
        ...bugar.map((r) => {
            const [status, tone] =
                KELAYAKAN[r.status_kelayakan] ?? KELAYAKAN.layak;

            return {
                key: `b${r.id}`,
                tanggal: r.tanggal,
                type: 'Bugar Selamat',
                detail: `Shift ${r.shift}`,
                status,
                tone,
                href: `/bugar-selamat/${r.id}`,
            };
        }),
        ...laporan.map((r) => {
            const [status, tone] =
                TINDAKAN[r.status_tindakan] ?? TINDAKAN.pending;

            return {
                key: `l${r.id}`,
                tanggal: r.tanggal,
                type: 'Laporan Bahaya',
                detail: r.lokasi,
                status,
                tone,
                href: `/laporan-bahaya/${r.id}`,
            };
        }),
        ...observasi.map((r) => {
            const [status, tone] = formStatus(r.status);

            return {
                key: `o${r.id}`,
                tanggal: r.tanggal,
                type: 'Observasi',
                detail: r.lokasi_kerja,
                status,
                tone,
                href: `/sap/observasi-keselamatan/${r.id}`,
            };
        }),
        ...inspeksi.map((r) => {
            const [status, tone] = formStatus(r.status);

            return {
                key: `i${r.jenis}${r.id}`,
                tanggal: r.tanggal,
                type: `Inspeksi ${r.jenis}`,
                detail: r.risk_level ? `Risiko ${r.risk_level}` : '',
                status,
                tone,
                href: `/sap/inspeksi-${r.jenis.toLowerCase()}/${r.id}`,
            };
        }),
        ...jsa.map((r) => {
            const [status, tone] = formStatus(r.status);

            return {
                key: `j${r.id}`,
                tanggal: r.tanggal,
                type: 'Komunikasi JSA',
                detail: r.judul_dokumen,
                status,
                tone,
                href: `/sap/komunikasi-jsa/${r.id}`,
            };
        }),
    ]
        .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
        .slice(0, limit);

    return (
        <section aria-labelledby="riwayat-title" className="space-y-2">
            <h2 id="riwayat-title" className="text-[15px] font-semibold">
                Riwayat terakhir
            </h2>
            <div className="overflow-hidden rounded-xl border bg-card">
                {items.length === 0 ? (
                    <p className="px-3.5 py-5 text-center text-sm text-muted-foreground">
                        Belum ada laporan yang Anda kirim.
                    </p>
                ) : (
                    items.map((item, i) => (
                        <Link
                            key={item.key}
                            href={item.href}
                            className={cn(
                                'flex min-h-[54px] items-center gap-3 px-3.5 transition-colors hover:bg-muted',
                                i > 0 && 'border-t',
                            )}
                        >
                            <span className="w-11 shrink-0 text-[13px] text-muted-foreground tabular-nums">
                                {new Date(item.tanggal).toLocaleDateString(
                                    'id-ID',
                                    { day: 'numeric', month: 'short' },
                                )}
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block text-sm font-medium">
                                    {item.type}
                                </span>
                                {item.detail && (
                                    <span className="block truncate text-[13px] text-muted-foreground">
                                        {item.detail}
                                    </span>
                                )}
                            </span>
                            <span
                                className={cn(
                                    'shrink-0 rounded-md border px-2 py-0.5 text-xs font-semibold',
                                    TONE[item.tone],
                                )}
                            >
                                {item.status}
                            </span>
                        </Link>
                    ))
                )}
            </div>
        </section>
    );
}
