import { Head, Link } from '@inertiajs/react';
import { Inbox } from 'lucide-react';
import { AdminTitle } from '@/components/admin/admin-title';
import {
    DataTable,
    rowClass,
    TableCard,
    theadRowClass,
} from '@/components/admin/data-table';
import { EmptyState } from '@/components/patterns/empty-state';
import { Badge } from '@/components/ui/badge';

type Group = {
    module: string;
    label: string;
    status: string;
    href: string;
    total: number;
    records: {
        id: number;
        tanggal: string;
        title: string | null;
        by: string | null;
        site: string | null;
        url: string;
    }[];
};

type Props = { groups: Group[] };

export default function AdminInbox({ groups }: Props) {
    const total = groups.reduce((s, g) => s + g.total, 0);

    return (
        <>
            <Head title="Inbox approval" />
            <div className="flex flex-col gap-[18px] pb-10">
                <AdminTitle
                    eyebrow="K3 / Safety"
                    title="Inbox approval"
                    description={
                        total > 0
                            ? `${total.toLocaleString('id-ID')} item menunggu tindakan di seluruh modul`
                            : undefined
                    }
                />

                {groups.length === 0 ? (
                    <EmptyState
                        icon={Inbox}
                        title="Inbox bersih"
                        description="Tidak ada laporan, observasi, JSA, atau inspeksi yang menunggu."
                    />
                ) : (
                    groups.map((g) => (
                        <section key={g.module} className="flex flex-col gap-3">
                            <div className="flex items-baseline justify-between gap-3">
                                <h2 className="flex items-center gap-2 text-base font-bold">
                                    {g.label}
                                    <span className="tabular rounded-full bg-accent px-[7px] py-0.5 text-[11px] font-bold text-accent-foreground">
                                        {g.total}
                                    </span>
                                </h2>
                                <Link
                                    href={g.href}
                                    className="text-[13px] font-semibold hover:underline"
                                >
                                    Lihat semua →
                                </Link>
                            </div>
                            <TableCard>
                                <DataTable className="min-w-[640px]">
                                    <thead>
                                        <tr className={theadRowClass}>
                                            <th>Tanggal</th>
                                            <th>Item</th>
                                            <th>Pelapor</th>
                                            <th>Site</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {g.records.map((r) => (
                                            <tr key={r.id} className={rowClass()}>
                                                <td className="tabular whitespace-nowrap text-muted-foreground">
                                                    {new Date(
                                                        r.tanggal,
                                                    ).toLocaleDateString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                    })}
                                                </td>
                                                <td className="max-w-[260px] truncate font-bold">
                                                    <Link
                                                        href={r.url}
                                                        className="hover:underline"
                                                    >
                                                        {r.title ?? '—'}
                                                    </Link>
                                                </td>
                                                <td className="max-w-[180px] truncate font-semibold">
                                                    {r.by ?? '—'}
                                                </td>
                                                <td className="whitespace-nowrap">
                                                    {r.site
                                                        ? r.site.toUpperCase()
                                                        : '—'}
                                                </td>
                                                <td>
                                                    <Badge variant="warning">
                                                        {g.status}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </DataTable>
                            </TableCard>
                        </section>
                    ))
                )}
            </div>
        </>
    );
}
