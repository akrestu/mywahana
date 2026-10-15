import { Head, Link, usePage } from '@inertiajs/react';
import { AlertTriangle, Plus, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { ModuleHeader } from '@/components/patterns/module-header';
import { RecordList } from '@/components/patterns/record-list';
import type { RecordRow } from '@/components/patterns/record-list';
import { SegmentTabs } from '@/components/patterns/segment-tabs';
import { Button } from '@/components/ui/button';
import { tindakanLabels } from '@/lib/status';
import type { StatusTindakan } from '@/lib/status';

type LaporanRecord = {
    id: number;
    tanggal: string;
    lokasi: string;
    tingkat_risiko: 'AA' | 'A' | 'B' | 'C';
    nilai_risiko: number;
    status_tindakan: StatusTindakan;
    user?: { name: string };
};

type Paginated = {
    data: LaporanRecord[];
    next_page_url: string | null;
    prev_page_url: string | null;
};

type Props = {
    myRecords: Paginated;
    picRecords: Paginated;
    pendingPicCount: number;
};

const TONE: Record<StatusTindakan, RecordRow['status']['tone']> = {
    pending: 'warning',
    continue: 'warning',
    progress: 'neutral',
    close: 'success',
};

function toRows(page: Paginated, mode: 'my' | 'pic'): RecordRow[] {
    return page.data.map((r) => {
        const date = new Date(r.tanggal).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
        });
        const status =
            r.status_tindakan in TONE ? r.status_tindakan : 'pending';

        return {
            key: r.id,
            href: `/laporan-bahaya/${r.id}`,
            tanggal: r.tanggal,
            title: r.lokasi,
            subtitle: [
                date,
                `Risiko ${r.tingkat_risiko}`,
                mode === 'pic' && r.user ? `oleh ${r.user.name}` : null,
            ]
                .filter(Boolean)
                .join(' · '),
            status: { label: tindakanLabels[status], tone: TONE[status] },
        };
    });
}

export default function LaporanBahayaIndex({
    myRecords,
    picRecords,
    pendingPicCount,
}: Props) {
    // ?tab=pic dari reminder dashboard langsung membuka laporan yang ditugaskan.
    const { url } = usePage();
    const [tab, setTab] = useState<'my' | 'pic'>(() =>
        new URLSearchParams(url.split('?')[1] ?? '').get('tab') === 'pic'
            ? 'pic'
            : 'my',
    );
    const page = tab === 'my' ? myRecords : picRecords;

    return (
        <>
            <Head title="Laporan Bahaya" />
            <div className="flex flex-col gap-4 pt-2">
                <ModuleHeader
                    backHref="/k3"
                    eyebrow="Hazard report & penanganan"
                    title="Laporan Bahaya"
                    actions={
                        <Button
                            asChild
                            size="sm"
                            className="hidden sm:inline-flex"
                        >
                            <Link href="/laporan-bahaya/create">
                                <Plus /> Laporkan
                            </Link>
                        </Button>
                    }
                />

                <SegmentTabs
                    label="Kategori laporan"
                    value={tab}
                    onChange={setTab}
                    tabs={[
                        { key: 'my', label: 'Form saya' },
                        {
                            key: 'pic',
                            label: 'Tugas PIC',
                            count: pendingPicCount,
                        },
                    ]}
                />

                <RecordList
                    rows={toRows(page, tab)}
                    prev={page.prev_page_url}
                    next={page.next_page_url}
                    empty={
                        tab === 'my'
                            ? {
                                  icon: AlertTriangle,
                                  title: 'Belum ada laporan',
                                  description:
                                      'Laporkan kondisi berbahaya di tempat kerja untuk keselamatan bersama.',
                              }
                            : {
                                  icon: ShieldCheck,
                                  title: 'Tidak ada tugas PIC',
                                  description:
                                      'Anda belum ditugaskan sebagai PIC untuk laporan bahaya manapun.',
                              }
                    }
                />

                <Button asChild size="lg" className="sm:hidden">
                    <Link href="/laporan-bahaya/create">
                        <Plus /> Buat laporan
                    </Link>
                </Button>
            </div>
        </>
    );
}
