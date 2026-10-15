import { Check, X } from 'lucide-react';
import { SectionLabel } from '@/components/patterns/module-header';
import { cn } from '@/lib/utils';

type UserInfo = { id: number; name: string; jabatan?: string | null };
type ChecklistVal = 'aman' | 'beresiko' | null;

export type ObservasiRecord = {
    id: number;
    user: UserInfo;
    penanggung_jawab: UserInfo | null;
    tanggal: string;
    jenis_pekerjaan: string;
    lokasi_kerja: string;
    peralatan_digunakan: string | null;
    status_temuan: string[] | null;
    catatan: string | null;
    [key: string]: unknown;
};

const CHECKLIST_CATEGORIES = [
    {
        label: '1.0 Prosedur',
        items: [
            {
                key: 'cl_prosedur_mine_permit',
                label: '1.1 Mine Permit / Ijin Masuk Lokasi Tambang',
            },
            {
                key: 'cl_prosedur_komisioning',
                label: '1.2 Komisioning / Inspeksi',
            },
            {
                key: 'cl_prosedur_p2h',
                label: '1.3 Pelaksanaan Pemeriksaan Harian (P2H)',
            },
            {
                key: 'cl_prosedur_instruksi_kerja',
                label: '1.4 Instruksi Kerja / Tata Cara Kerja Aman',
            },
            {
                key: 'cl_prosedur_loto',
                label: '1.5 Sistem Penguncian & Pelabelan (LOTO)',
            },
            { key: 'cl_prosedur_sop_jsa', label: '1.6 SOP / JSA' },
        ],
    },
    {
        label: '2.0 Alat Pelindung Diri (APD)',
        items: [
            { key: 'cl_apd_kepala', label: '2.1 Kepala' },
            { key: 'cl_apd_mata_wajah', label: '2.2 Mata dan Wajah' },
            { key: 'cl_apd_pendengaran', label: '2.3 Pendengaran' },
            { key: 'cl_apd_pernapasan', label: '2.4 Sistem Pernapasan' },
            {
                key: 'cl_apd_pelindung_jatuh',
                label: '2.5 Alat Pelindung Jatuh',
            },
            {
                key: 'cl_apd_pelindung_tenggelam',
                label: '2.6 Alat Pelindung Tenggelam',
            },
            { key: 'cl_apd_lengan_tangan', label: '2.7 Lengan dan Tangan' },
            { key: 'cl_apd_paha_kaki', label: '2.8 Paha dan Kaki' },
        ],
    },
    {
        label: '3.0 Posisi Badan & Reaksi Orang',
        items: [
            {
                key: 'cl_posisi_mengangkat',
                label: '3.1 Cara Mengangkat, Mendorong, Menarik',
            },
            { key: 'cl_posisi_mengubah_posisi', label: '3.2 Mengubah Posisi' },
            {
                key: 'cl_posisi_mengatur_pekerjaan',
                label: '3.3 Mengatur Pekerjaan',
            },
            {
                key: 'cl_posisi_dekat_listrik',
                label: '3.4 Dekat dengan Arus Listrik Bertegangan',
            },
            {
                key: 'cl_posisi_dekat_berbahaya',
                label: '3.5 Dekat dengan Area atau Bahan Berbahaya',
            },
            {
                key: 'cl_posisi_dekat_longsor',
                label: '3.6 Dekat dengan Dinding/Galian Rawan Longsor',
            },
            { key: 'cl_posisi_dekat_air', label: '3.6b Dekat dengan Air' },
            { key: 'cl_posisi_turun_naik', label: '3.7 Turun / Naik' },
        ],
    },
    {
        label: '4.0 Berkendara & Mengoperasikan Unit',
        items: [
            { key: 'cl_kendaraan_sim_sio', label: '4.1 SIM / SIO / SIMPER' },
            { key: 'cl_kendaraan_sabuk', label: '4.2 Sabuk Keselamatan' },
            { key: 'cl_kendaraan_kecepatan', label: '4.3 Batas Kecepatan' },
            {
                key: 'cl_kendaraan_jarak',
                label: '4.4 Jarak Kendaraan / Beriringan',
            },
            { key: 'cl_kendaraan_haluan', label: '4.5 Cara Mengambil Haluan' },
            {
                key: 'cl_kendaraan_buggy_whip',
                label: '4.6 Bendera Tanda Kendaraan / Buggy Whip',
            },
            { key: 'cl_kendaraan_radio', label: '4.7 Radio Komunikasi' },
            {
                key: 'cl_kendaraan_lampu',
                label: '4.8 Lampu Rotary / Lampu Utama',
            },
        ],
    },
    {
        label: '5.0 Peralatan dan Perlindungan',
        items: [
            {
                key: 'cl_peralatan_pemilihan',
                label: '5.1 Pemilihan & Penggunaan Peralatan',
            },
            {
                key: 'cl_peralatan_safety_guard',
                label: '5.2 Pelindung Peralatan / Safety Guard',
            },
            { key: 'cl_peralatan_pemakaian', label: '5.3 Pemakaian Peralatan' },
            { key: 'cl_peralatan_angkat', label: '5.4 Peralatan Angkat' },
            {
                key: 'cl_peralatan_elektrikal',
                label: '5.5 Peralatan Elektrikal',
            },
            { key: 'cl_peralatan_tangan', label: '5.6 Peralatan Tangan' },
        ],
    },
    {
        label: '6.0 Daerah Kerja & Lingkungan',
        items: [
            {
                key: 'cl_lingkungan_kebersihan',
                label: '6.1 Kebersihan & Kerapian Area Kerja',
            },
            {
                key: 'cl_lingkungan_tumpahan',
                label: '6.2 Pencegahan Tumpahan / Kebocoran',
            },
            {
                key: 'cl_lingkungan_pencahayaan',
                label: '6.3 Pencahayaan / Penerangan',
            },
            {
                key: 'cl_lingkungan_kebisingan',
                label: '6.4 Kebisingan, Suhu, Getaran',
            },
            {
                key: 'cl_lingkungan_barikade',
                label: '6.5 Perlindungan / Barikade',
            },
            {
                key: 'cl_lingkungan_rambu',
                label: '6.6 Rambu-Rambu Peringatan & Delineator',
            },
            {
                key: 'cl_lingkungan_limbah',
                label: '6.7 Pengaturan Limbah & Sampah',
            },
        ],
    },
];

const STATUS_TEMUAN_LABELS: Record<string, string> = {
    sudah_selesai: 'Sudah diperbaiki / selesai',
    perlu_penanganan: 'Perlu penanganan khusus',
    sedang_diperbaiki: 'Sedang diperbaiki',
    menunggu_material: 'Menunggu material / peralatan',
};

const NARASI = [
    {
        key: 'tindakan_kondisi_aman',
        label: 'Tindakan / kondisi aman yang diamati',
    },
    {
        key: 'tindakan_meningkatkan_selamat',
        label: 'Tindakan untuk meningkatkan kerja selamat',
    },
    {
        key: 'tindakan_kondisi_tidak_aman',
        label: 'Kondisi tidak aman yang diamati',
        bad: true,
    },
    { key: 'tindakan_segera', label: 'Tindakan yang diambil segera' },
    {
        key: 'tindakan_mencegah_terulang',
        label: 'Tindakan untuk mencegah terulang kembali',
    },
];

function ResultChip({ value }: { value: 'aman' | 'beresiko' }) {
    return (
        <span
            className={cn(
                'inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold',
                value === 'aman'
                    ? 'bg-success-soft text-success'
                    : 'bg-destructive-soft text-destructive',
            )}
        >
            {value === 'aman' ? (
                <Check className="size-3.5" />
            ) : (
                <X className="size-3.5" />
            )}
            {value === 'aman' ? 'Aman' : 'Beresiko'}
        </span>
    );
}

/** Read-only summary of an Observasi Keselamatan form, shared by detail and confirmation pages. */
export function ObservasiReview({ record }: { record: ObservasiRecord }) {
    const categories = [
        ...CHECKLIST_CATEGORIES,
        {
            label: '7.0 Lain-lain',
            items: [1, 2, 3, 4].map((n) => ({
                key: `ll_${n}_nilai`,
                label: `7.${n} ${(record[`ll_${n}_label`] as string) || `Item ${n}`}`,
            })),
        },
    ];
    const all = categories
        .flatMap((c) => c.items)
        .map((i) => record[i.key] as ChecklistVal);
    const aman = all.filter((v) => v === 'aman').length;
    const beresiko = all.filter((v) => v === 'beresiko').length;

    const info = [
        {
            label: 'Observer',
            value: `${record.user.name}${record.user.jabatan ? ` · ${record.user.jabatan}` : ''}`,
        },
        {
            label: 'Penanggung jawab',
            value: record.penanggung_jawab?.name ?? '—',
        },
        { label: 'Lokasi kerja', value: record.lokasi_kerja },
        { label: 'Jenis pekerjaan', value: record.jenis_pekerjaan },
        { label: 'Peralatan', value: record.peralatan_digunakan || '—' },
    ];

    return (
        <>
            <dl className="overflow-hidden rounded-lg bg-card">
                {info.map((r) => (
                    <div
                        key={r.label}
                        className="flex justify-between gap-4 border-b border-border/60 px-4 py-3 text-sm last:border-0"
                    >
                        <dt className="shrink-0 text-muted-foreground">
                            {r.label}
                        </dt>
                        <dd className="text-right font-semibold">{r.value}</dd>
                    </div>
                ))}
            </dl>

            <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-lg bg-success-soft px-4 py-3 text-success">
                    <p className="tabular text-2xl font-extrabold">{aman}</p>
                    <p className="text-xs font-semibold">item aman</p>
                </div>
                <div
                    className={cn(
                        'rounded-lg px-4 py-3',
                        beresiko > 0
                            ? 'bg-destructive-soft text-destructive'
                            : 'bg-muted text-muted-foreground',
                    )}
                >
                    <p className="tabular text-2xl font-extrabold">
                        {beresiko}
                    </p>
                    <p className="text-xs font-semibold">item beresiko</p>
                </div>
            </div>

            {categories.map((cat) => {
                const filled = cat.items.filter((i) => record[i.key]);

                if (filled.length === 0) {
                    return null;
                }

                return (
                    <section key={cat.label} className="flex flex-col gap-2">
                        <SectionLabel>{cat.label}</SectionLabel>
                        <ul className="overflow-hidden rounded-lg bg-card">
                            {filled.map((item) => {
                                const val = record[item.key] as
                                    | 'aman'
                                    | 'beresiko';

                                return (
                                    <li
                                        key={item.key}
                                        className={cn(
                                            'flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3 last:border-0',
                                            val === 'beresiko' &&
                                                'bg-destructive-soft/60',
                                        )}
                                    >
                                        <span className="text-sm">
                                            {item.label}
                                        </span>
                                        <ResultChip value={val} />
                                    </li>
                                );
                            })}
                        </ul>
                    </section>
                );
            })}

            {NARASI.filter(({ key }) => record[key]).map(
                ({ key, label, bad }) => (
                    <section
                        key={key}
                        className={cn(
                            'flex flex-col gap-1.5 rounded-lg px-4 py-3',
                            bad ? 'bg-destructive-soft' : 'bg-card',
                        )}
                    >
                        <h3
                            className={cn(
                                'text-xs font-bold tracking-[0.08em] uppercase',
                                bad
                                    ? 'text-destructive'
                                    : 'text-muted-foreground',
                            )}
                        >
                            {label}
                        </h3>
                        <p className="text-sm leading-relaxed whitespace-pre-line">
                            {record[key] as string}
                        </p>
                    </section>
                ),
            )}

            {record.status_temuan && record.status_temuan.length > 0 && (
                <div className="flex flex-col gap-2">
                    <SectionLabel>Status temuan</SectionLabel>
                    <div className="flex flex-wrap gap-2">
                        {record.status_temuan.map((s) => (
                            <span
                                key={s}
                                className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold"
                            >
                                {STATUS_TEMUAN_LABELS[s] ?? s}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {record.catatan && (
                <section className="flex flex-col gap-1.5 rounded-lg bg-card px-4 py-3">
                    <h3 className="text-xs font-bold tracking-[0.08em] text-muted-foreground uppercase">
                        Catatan
                    </h3>
                    <p className="text-sm leading-relaxed whitespace-pre-line">
                        {record.catatan}
                    </p>
                </section>
            )}
        </>
    );
}
