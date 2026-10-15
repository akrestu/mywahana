import { Head, Link } from '@inertiajs/react';
import { ClipboardCheck, Plus } from 'lucide-react';
import { useState } from 'react';
import { ModuleHeader } from '@/components/patterns/module-header';
import { RecordList } from '@/components/patterns/record-list';
import type { RecordRow } from '@/components/patterns/record-list';
import { SegmentTabs } from '@/components/patterns/segment-tabs';
import { Button } from '@/components/ui/button';

type UserInfo = { id: number; name: string };
type OKRecord = {
    id: number;
    tanggal: string;
    jenis_pekerjaan: string;
    lokasi_kerja: string;
    status: 'menunggu_konfirmasi' | 'dikonfirmasi' | 'ditolak';
    penanggung_jawab?: UserInfo | null;
    user?: UserInfo | null;
};
type Paginated = {
    data: OKRecord[];
    next_page_url: string | null;
    prev_page_url: string | null;
};
type Props = {
    myRecords: Paginated;
    pendingKonfirmasi: Paginated;
    confirmedAsPJ: Paginated;
};

const STATUS: Record<OKRecord['status'], RecordRow['status']> = {
    menunggu_konfirmasi: { label: 'Menunggu konfirmasi', tone: 'warning' },
    dikonfirmasi: { label: 'Dikonfirmasi', tone: 'success' },
    ditolak: { label: 'Ditolak', tone: 'danger' },
};

const EMPTY = {
    icon: ClipboardCheck,
    title: 'Belum ada observasi',
    description: 'Form observasi keselamatan akan muncul di sini.',
};

function toRows(page: Paginated, mode: 'my' | 'pending' | 'done'): RecordRow[] {
    return page.data.map((r) => {
        const date = new Date(r.tanggal).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
        });
        const who =
            mode === 'my'
                ? r.penanggung_jawab
                    ? `PJ ${r.penanggung_jawab.name}`
                    : null
                : r.user
                  ? `oleh ${r.user.name}`
                  : null;

        return {
            key: r.id,
            href:
                mode === 'pending'
                    ? `/sap/observasi-keselamatan/${r.id}/konfirmasi`
                    : `/sap/observasi-keselamatan/${r.id}`,
            tanggal: r.tanggal,
            title: r.jenis_pekerjaan,
            subtitle: [date, r.lokasi_kerja, who].filter(Boolean).join(' · '),
            status: STATUS[r.status] ?? STATUS.menunggu_konfirmasi,
            action: mode === 'pending' ? 'Konfirmasi' : undefined,
        };
    });
}

export default function ObservasiKeselamatanIndex({
    myRecords,
    pendingKonfirmasi,
    confirmedAsPJ,
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
              : confirmedAsPJ;

    return (
        <>
            <Head title="Observasi Keselamatan" />
            <div className="flex flex-col gap-4 pt-2">
                <ModuleHeader
                    backHref="/k3"
                    eyebrow="WBK-HSE-FO-037"
                    title="Observasi Keselamatan"
                    actions={
                        <Button
                            asChild
                            size="sm"
                            className="hidden sm:inline-flex"
                        >
                            <Link href="/sap/observasi-keselamatan/create">
                                <Plus /> Buat
                            </Link>
                        </Button>
                    }
                />

                <SegmentTabs
                    label="Kategori observasi"
                    value={tab}
                    onChange={setTab}
                    tabs={[
                        { key: 'my', label: 'Form saya' },
                        {
                            key: 'pending',
                            label: 'Perlu konfirmasi',
                            count: pending,
                        },
                        { key: 'done', label: 'Riwayat PJ' },
                    ]}
                />

                <RecordList
                    rows={toRows(page, tab)}
                    prev={page.prev_page_url}
                    next={page.next_page_url}
                    empty={EMPTY}
                />

                <Button asChild size="lg" className="sm:hidden">
                    <Link href="/sap/observasi-keselamatan/create">
                        <Plus /> Buat observasi
                    </Link>
                </Button>
            </div>
        </>
    );
}
