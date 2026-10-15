import { Head, Link } from '@inertiajs/react';
import { Activity, ChevronRight, ClipboardList, Plus } from 'lucide-react';
import { ModuleHeader } from '@/components/patterns/module-header';
import { RecordList } from '@/components/patterns/record-list';
import type { RecordRow } from '@/components/patterns/record-list';
import { Button } from '@/components/ui/button';
import { kelayakanLabels } from '@/lib/status';
import type { Kelayakan } from '@/lib/status';

type BugarRecord = {
    id: number;
    tanggal: string;
    shift: string;
    hari_ke: number;
    status_kelayakan: Kelayakan;
    created_at: string;
};

type Paginated = {
    data: BugarRecord[];
    next_page_url: string | null;
    prev_page_url: string | null;
};

type Props = { records: Paginated; sudah_isi_hari_ini: boolean };

const TONE: Record<Kelayakan, RecordRow['status']['tone']> = {
    layak: 'success',
    catatan: 'warning',
    dilarang: 'danger',
};

function toRows(page: Paginated): RecordRow[] {
    return page.data.map((r) => {
        const status =
            r.status_kelayakan in TONE ? r.status_kelayakan : 'layak';
        const jam = new Date(r.created_at).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
        });

        return {
            key: r.id,
            href: `/bugar-selamat/${r.id}`,
            tanggal: r.tanggal,
            title: new Date(r.tanggal).toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
            }),
            subtitle: `Shift ${r.shift === 'Siang' ? 'I' : 'II'} · Hari ke-${r.hari_ke} · Diisi ${jam} WIB`,
            status: { label: kelayakanLabels[status], tone: TONE[status] },
        };
    });
}

export default function BugarSelamatIndex({
    records,
    sudah_isi_hari_ini,
}: Props) {
    return (
        <>
            <Head title="Bugar Selamat" />
            <div className="flex flex-col gap-4 pt-2">
                <ModuleHeader
                    backHref="/k3"
                    eyebrow="Checklist kesiapan kerja harian"
                    title="Bugar Selamat"
                    actions={
                        !sudah_isi_hari_ini && (
                            <Button
                                asChild
                                size="sm"
                                className="hidden sm:inline-flex"
                            >
                                <Link href="/bugar-selamat/create">
                                    <Plus /> Isi checklist
                                </Link>
                            </Button>
                        )
                    }
                />

                {!sudah_isi_hari_ini && (
                    <Link
                        href="/bugar-selamat/create"
                        className="flex items-center gap-3 rounded-lg bg-card p-4 ring-2 ring-foreground transition-shadow ring-inset hover:shadow-[0_8px_24px_oklch(0.191_0_0/0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-[14px] bg-success-soft">
                            <Activity
                                className="size-5 text-success"
                                strokeWidth={1.8}
                            />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block text-sm font-bold">
                                Belum diisi hari ini
                            </span>
                            <span className="block text-xs text-muted-foreground">
                                Isi checklist sebelum mulai bekerja.
                            </span>
                        </span>
                        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </Link>
                )}

                <RecordList
                    rows={toRows(records)}
                    prev={records.prev_page_url}
                    next={records.next_page_url}
                    empty={{
                        icon: ClipboardList,
                        title: 'Belum ada checklist',
                        description:
                            'Checklist Bugar Selamat yang Anda isi akan tampil di sini.',
                    }}
                />
            </div>
        </>
    );
}
