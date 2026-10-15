import { SectionLabel } from '@/components/patterns/module-header';

type UserInfo = { id: number; name: string; jabatan?: string | null };
type Peserta = {
    nama: string;
    jabatan: string;
    nik: string;
    tanda_tangan: string;
};

export type JsaRecord = {
    id: number;
    tanggal: string;
    lokasi: string;
    shift: 'siang' | 'malam';
    durasi: number;
    kegiatan: string;
    judul_dokumen: string;
    catatan: string | null;
    status: 'selesai' | 'menunggu_konfirmasi' | 'dikonfirmasi' | 'ditolak';
    peserta: Peserta[];
    supervisor_signature?: string | null;
    tl_signature?: string | null;
    tl_dikonfirmasi_at?: string | null;
    foto_kelompok: string;
    foto_dokumen: string;
    user: UserInfo;
    team_leader: UserInfo | null;
};

/** Read-only summary of a Komunikasi JSA form, shared by detail and confirmation pages. */
export function JsaReview({ record }: { record: JsaRecord }) {
    const info = [
        { label: 'Dokumen', value: record.judul_dokumen },
        { label: 'Lokasi', value: record.lokasi },
        { label: 'Shift', value: record.shift === 'malam' ? 'Malam' : 'Siang' },
        { label: 'Durasi', value: `${record.durasi} menit` },
        {
            label: 'Supervisor',
            value: `${record.user.name}${record.user.jabatan ? ` · ${record.user.jabatan}` : ''}`,
        },
        ...(record.team_leader
            ? [{ label: 'Team leader', value: record.team_leader.name }]
            : []),
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

            <section className="flex flex-col gap-1.5 rounded-lg bg-card px-4 py-3">
                <h3 className="text-xs font-bold tracking-[0.08em] text-muted-foreground uppercase">
                    Kegiatan
                </h3>
                <p className="text-sm leading-relaxed whitespace-pre-line">
                    {record.kegiatan}
                </p>
            </section>

            {record.catatan && (
                <section className="flex flex-col gap-1.5 rounded-lg bg-card px-4 py-3">
                    <h3 className="text-xs font-bold tracking-[0.08em] text-muted-foreground uppercase">
                        Catatan / masukan
                    </h3>
                    <p className="text-sm leading-relaxed whitespace-pre-line">
                        {record.catatan}
                    </p>
                </section>
            )}

            <SectionLabel
                action={
                    <span className="tabular text-xs font-semibold text-muted-foreground">
                        {record.peserta.length} orang
                    </span>
                }
            >
                Peserta
            </SectionLabel>
            <ul className="overflow-hidden rounded-lg bg-card">
                {record.peserta.map((p, i) => (
                    <li
                        key={i}
                        className="flex items-center gap-3 border-b border-border/60 px-4 py-3 last:border-0"
                    >
                        <span className="tabular flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                            {i + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold">
                                {p.nama}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                                {[p.jabatan, p.nik]
                                    .filter(Boolean)
                                    .join(' · ') || '—'}
                            </span>
                        </span>
                        {p.tanda_tangan && (
                            <img
                                src={p.tanda_tangan}
                                alt={`Tanda tangan ${p.nama}`}
                                className="h-10 w-20 shrink-0 rounded-md bg-white object-contain"
                            />
                        )}
                    </li>
                ))}
            </ul>

            <SectionLabel>Foto bukti</SectionLabel>
            <div className="grid grid-cols-2 gap-2.5">
                {[
                    { src: record.foto_kelompok, label: 'Kelompok' },
                    { src: record.foto_dokumen, label: 'Dokumen' },
                ].map((f) => (
                    <a
                        key={f.label}
                        href={`/storage/${f.src}`}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex flex-col gap-1.5"
                    >
                        <img
                            src={`/storage/${f.src}`}
                            alt={`Foto ${f.label.toLowerCase()}`}
                            className="aspect-[4/3] w-full rounded-lg bg-muted object-cover"
                        />
                        <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground">
                            {f.label}
                        </span>
                    </a>
                ))}
            </div>
        </>
    );
}
