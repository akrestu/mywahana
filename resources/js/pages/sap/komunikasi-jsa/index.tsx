import { Head, Link } from '@inertiajs/react';
import { BookOpen, Plus } from 'lucide-react';
import { useState } from 'react';
import { ModuleHeader } from '@/components/patterns/module-header';
import { RecordList } from '@/components/patterns/record-list';
import type { RecordRow } from '@/components/patterns/record-list';
import { SegmentTabs } from '@/components/patterns/segment-tabs';
import { Button } from '@/components/ui/button';

type UserInfo = { id: number; name: string };
type JsaRecord = {
    id: number;
    tanggal: string;
    lokasi: string;
    shift: 'siang' | 'malam';
    kegiatan: string;
    judul_dokumen: string;
    status: 'selesai' | 'menunggu_konfirmasi' | 'dikonfirmasi' | 'ditolak';
    team_leader?: UserInfo | null;
    user?: UserInfo | null;
    peserta: { nama: string }[];
};
type Paginated = {
    data: JsaRecord[];
    next_page_url: string | null;
    prev_page_url: string | null;
};
type Props = {
    myRecords: Paginated;
    pendingKonfirmasi: Paginated;
    confirmedAsTL: Paginated;
};

const STATUS: Record<JsaRecord['status'], RecordRow['status']> = {
    selesai: { label: 'Selesai', tone: 'success' },
    dikonfirmasi: { label: 'Dikonfirmasi TL', tone: 'success' },
    menunggu_konfirmasi: { label: 'Menunggu TTD TL', tone: 'warning' },
    ditolak: { label: 'Ditolak', tone: 'danger' },
};

const EMPTY = {
    icon: BookOpen,
    title: 'Belum ada komunikasi JSA',
    description: 'Lembar komunikasi JSA/SOP/IK akan muncul di sini.',
};

function toRows(page: Paginated, mode: 'my' | 'pending' | 'done'): RecordRow[] {
    return page.data.map((r) => {
        const date = new Date(r.tanggal).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
        });
        const who =
            mode === 'my'
                ? r.team_leader
                    ? `TL ${r.team_leader.name}`
                    : null
                : r.user
                  ? `oleh ${r.user.name}`
                  : null;

        return {
            key: r.id,
            href:
                mode === 'pending'
                    ? `/sap/komunikasi-jsa/${r.id}/konfirmasi`
                    : `/sap/komunikasi-jsa/${r.id}`,
            tanggal: r.tanggal,
            title: r.judul_dokumen,
            subtitle: [date, r.lokasi, `${r.peserta?.length ?? 0} peserta`, who]
                .filter(Boolean)
                .join(' · '),
            status: STATUS[r.status] ?? STATUS.menunggu_konfirmasi,
            action: mode === 'pending' ? 'Tanda tangan' : undefined,
        };
    });
}

export default function KomunikasiJsaIndex({
    myRecords,
    pendingKonfirmasi,
    confirmedAsTL,
}: Props) {
    const pending = pendingKonfirmasi.data.length;
    const [tab, setTab] = useState<'my' | 'pending' | 'done'>(
        pending > 0 ? 'pending' : 'my',
    );
    const page =
        tab === 'my'
            ? myRecords
            : tab === 'pending'
              ? pendingKonfirmasi
              : confirmedAsTL;

    return (
        <>
            <Head title="Komunikasi JSA" />
            <div className="flex flex-col gap-4 pt-2">
                <ModuleHeader
                    backHref="/k3"
                    eyebrow="WBK-HSE-FO-026"
                    title="Komunikasi JSA"
                    actions={
                        <Button
                            asChild
                            size="sm"
                            className="hidden sm:inline-flex"
                        >
                            <Link href="/sap/komunikasi-jsa/create">
                                <Plus /> Buat
                            </Link>
                        </Button>
                    }
                />

                <SegmentTabs
                    label="Kategori JSA"
                    value={tab}
                    onChange={setTab}
                    tabs={[
                        { key: 'my', label: 'Form saya' },
                        { key: 'pending', label: 'Perlu TTD', count: pending },
                        { key: 'done', label: 'Riwayat TL' },
                    ]}
                />

                <RecordList
                    rows={toRows(page, tab)}
                    prev={page.prev_page_url}
                    next={page.next_page_url}
                    empty={EMPTY}
                />

                <Button asChild size="lg" className="sm:hidden">
                    <Link href="/sap/komunikasi-jsa/create">
                        <Plus /> Buat komunikasi JSA
                    </Link>
                </Button>
            </div>
        </>
    );
}
