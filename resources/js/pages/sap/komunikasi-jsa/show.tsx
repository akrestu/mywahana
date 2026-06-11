import { Head, Link, router } from '@inertiajs/react';
import { BookOpen, Calendar, Clock, MapPin, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { konfirmasi as konfirmasiRoute } from '@/routes/sap/komunikasi-jsa';

type UserInfo = { id: number; name: string; nik?: string | null; jabatan?: string | null; site?: string | null };

type Peserta = { nama: string; jabatan: string; nik: string; tanda_tangan: string };

type Record = {
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
    supervisor_signature: string | null;
    tl_signature: string | null;
    tl_dikonfirmasi_at: string | null;
    foto_kelompok: string;
    foto_dokumen: string;
    user: UserInfo;
    team_leader: UserInfo | null;
};

type Props = { record: Record; isTeamLeader: boolean };

function StatusBadge({ status }: { status: Record['status'] }) {
    if (status === 'selesai') return <Badge className="bg-green-100 text-green-700 border-green-300 hover:bg-green-100 dark:bg-green-950/40 dark:text-green-400">Selesai</Badge>;
    if (status === 'dikonfirmasi') return <Badge className="bg-green-100 text-green-700 border-green-300 hover:bg-green-100 dark:bg-green-950/40 dark:text-green-400">Dikonfirmasi</Badge>;
    if (status === 'ditolak') return <Badge className="bg-red-100 text-red-700 border-red-300 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400">Ditolak</Badge>;
    return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-100 dark:bg-yellow-950/40 dark:text-yellow-400">Menunggu Konfirmasi</Badge>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
            <div className="text-sm">{children}</div>
        </div>
    );
}

export default function KomunikasiJsaShow({ record, isTeamLeader }: Props) {
    return (
        <>
            <Head title="Detail Komunikasi JSA" />
            <div className="flex flex-col gap-5 max-w-2xl">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-bold">Lembar Komunikasi JSA/SOP/IK</h2>
                        <p className="text-sm text-muted-foreground mt-0.5">WBK-HSE-FO-026</p>
                    </div>
                    <StatusBadge status={record.status} />
                </div>

                {/* Info Dasar */}
                <Card>
                    <CardContent className="flex flex-col gap-4 pt-5">
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Tanggal">
                                <span className="flex items-center gap-1.5"><Calendar size={13} /> {new Date(record.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            </Field>
                            <Field label="Shift">
                                <Badge variant="outline" className="capitalize">{record.shift}</Badge>
                            </Field>
                        </div>
                        <Field label="Lokasi">
                            <span className="flex items-center gap-1.5"><MapPin size={13} /> {record.lokasi}</span>
                        </Field>
                        <Field label="Durasi">
                            <span className="flex items-center gap-1.5"><Clock size={13} /> {record.durasi} menit</span>
                        </Field>
                        <Field label="Kegiatan">
                            <p className="whitespace-pre-line">{record.kegiatan}</p>
                        </Field>
                        <Field label="Judul JSA / SOP / IK">
                            <span className="flex items-center gap-1.5 font-medium"><BookOpen size={13} /> {record.judul_dokumen}</span>
                        </Field>
                        {record.catatan && (
                            <Field label="Catatan / Masukan">
                                <p className="whitespace-pre-line text-muted-foreground">{record.catatan}</p>
                            </Field>
                        )}
                        <Separator />
                        <Field label="Dibuat Oleh">
                            <p>{record.user.name}</p>
                            {record.user.jabatan && <p className="text-muted-foreground text-xs">{record.user.jabatan}</p>}
                        </Field>
                        {record.team_leader && (
                            <Field label="Team Leader / Supervisor">
                                <p>{record.team_leader.name}</p>
                                {record.team_leader.jabatan && <p className="text-muted-foreground text-xs">{record.team_leader.jabatan}</p>}
                            </Field>
                        )}
                    </CardContent>
                </Card>

                {/* Daftar Peserta */}
                <div className="flex flex-col gap-3">
                    <h3 className="text-base font-bold flex items-center gap-2">
                        <Users size={16} />
                        Daftar Peserta ({record.peserta.length})
                    </h3>
                    <p className="text-sm text-muted-foreground -mt-1">
                        Yang bertanda tangan di bawah ini menyatakan sudah mendiskusikan/membaca JSA/SOP/IK, memahami dan akan melaksanakannya.
                    </p>
                    <div className="flex flex-col gap-2">
                        {record.peserta.map((p, idx) => (
                            <Card key={idx}>
                                <CardContent className="flex items-center gap-4 py-3 px-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold">{p.nama || '-'}</p>
                                        <div className="flex gap-3 text-xs text-muted-foreground flex-wrap">
                                            {p.jabatan && <span>{p.jabatan}</span>}
                                            {p.nik && <span>NIK: {p.nik}</span>}
                                        </div>
                                    </div>
                                    {p.tanda_tangan && (
                                        <img src={p.tanda_tangan} alt={`TTD ${p.nama}`} className="h-12 w-24 object-contain border rounded bg-white" />
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Foto Bukti */}
                <div className="flex flex-col gap-3">
                    <h3 className="text-base font-bold">Foto Bukti Komunikasi</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-1.5">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Foto Kelompok</p>
                            <img src={`/storage/${record.foto_kelompok}`} alt="Foto kelompok" className="w-full rounded-lg border object-cover max-h-56" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Foto Dokumen JSA/SOP/IK</p>
                            <img src={`/storage/${record.foto_dokumen}`} alt="Foto dokumen" className="w-full rounded-lg border object-cover max-h-56" />
                        </div>
                    </div>
                </div>

                {/* Tanda Tangan */}
                {(record.supervisor_signature || record.tl_signature) && (
                    <div className="flex flex-col gap-3">
                        <h3 className="text-base font-bold">Tanda Tangan</h3>
                        {record.supervisor_signature && (
                            <div className="flex flex-col gap-1.5">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Supervisor</p>
                                <p className="text-sm">{record.team_leader ? record.user.name : record.user.name}</p>
                                <img src={record.supervisor_signature} alt="TTD Supervisor" className="h-20 border rounded bg-white object-contain" />
                            </div>
                        )}
                        {record.tl_signature && (
                            <div className="flex flex-col gap-1.5">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Team Leader</p>
                                <p className="text-sm">{record.team_leader?.name}</p>
                                <img src={record.tl_signature} alt="TTD Team Leader" className="h-20 border rounded bg-white object-contain" />
                                {record.tl_dikonfirmasi_at && (
                                    <p className="text-xs text-muted-foreground">
                                        Dikonfirmasi: {new Date(record.tl_dikonfirmasi_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Tombol Konfirmasi untuk TL */}
                {isTeamLeader && record.status === 'menunggu_konfirmasi' && (
                    <Link href={konfirmasiRoute(record.id).url}>
                        <Button className="w-full h-12 text-base font-bold gap-2">
                            Konfirmasi Form Ini
                        </Button>
                    </Link>
                )}
            </div>
        </>
    );
}
