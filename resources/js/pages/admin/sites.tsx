import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { AdminTitle } from '@/components/admin/admin-title';
import {
    adminButtonPrimary,
    DataTable,
    rowClass,
    TableCard,
    TableEmpty,
    theadRowClass,
} from '@/components/admin/data-table';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type Site = {
    id: number;
    value: string;
    label: string;
    locations?: string[] | null;
};
type Props = { sites: Site[] };

function Field({
    label,
    hint,
    error,
    children,
}: {
    label: string;
    hint?: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
            {label}
            {children}
            {hint && (
                <span className="text-xs font-normal text-muted-foreground">
                    {hint}
                </span>
            )}
            <InputError message={error} />
        </label>
    );
}

/** Right-hand add/edit panel, same pattern as the user panel (AUsers). */
function SitePanel({
    site,
    onClose,
    onDelete,
}: {
    site: Site | null;
    onClose: () => void;
    onDelete: (s: Site) => void;
}) {
    const form = useForm({
        value: site?.value ?? '',
        label: site?.label ?? '',
        locations: (site?.locations ?? []).join('\n'),
    });
    const { data, setData, errors, processing } = form;

    const submit = (e: FormEvent) => {
        e.preventDefault();
        const opts = { preserveScroll: true, onSuccess: onClose };

        if (site) {
            form.put(`/admin/sites/${site.id}`, opts);
        } else {
            form.post('/admin/sites', opts);
        }
    };

    return (
        <aside
            aria-label={site ? 'Edit site' : 'Tambah site'}
            className="flex w-full flex-col gap-3.5 self-start rounded-lg border border-border bg-card p-5 shadow-[0_20px_48px_oklch(0.191_0_0/0.08)] lg:sticky lg:top-4 lg:max-w-[360px] lg:flex-[1_1_300px]"
        >
            <div className="flex items-center justify-between">
                <h2 className="text-[17px] font-bold">
                    {site ? 'Edit site' : 'Tambah site'}
                </h2>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Tutup panel"
                    className="flex size-9 items-center justify-center rounded-full bg-background hover:bg-muted"
                >
                    <X className="size-4" />
                </button>
            </div>

            <form onSubmit={submit} className="flex flex-col gap-3.5">
                <Field
                    label="Kode site"
                    hint="Huruf, angka, underscore, dan tanda minus."
                    error={errors.value}
                >
                    <Input
                        value={data.value}
                        onChange={(e) => setData('value', e.target.value)}
                        placeholder="site_baru"
                        className="h-11 rounded-[14px] font-mono"
                        required
                    />
                </Field>
                <Field label="Nama tampilan" error={errors.label}>
                    <Input
                        value={data.label}
                        onChange={(e) => setData('label', e.target.value)}
                        placeholder="WBK Site XYZ"
                        className="h-11 rounded-[14px]"
                        required
                    />
                </Field>
                <Field
                    label="Daftar lokasi"
                    hint="Satu lokasi per baris. Muncul sebagai pilihan di form laporan site ini."
                    error={errors.locations}
                >
                    <Textarea
                        value={data.locations}
                        onChange={(e) => setData('locations', e.target.value)}
                        rows={6}
                        placeholder={'Workshop\nArea parkir'}
                    />
                </Field>

                <Button
                    type="submit"
                    className="mt-1 h-11"
                    disabled={processing}
                >
                    {processing ? 'Menyimpan…' : 'Simpan'}
                </Button>

                {site && (
                    <button
                        type="button"
                        onClick={() => onDelete(site)}
                        className="inline-flex items-center gap-1.5 self-start text-[13px] font-semibold text-destructive hover:underline"
                    >
                        <Trash2 className="size-4" /> Hapus site
                    </button>
                )}
            </form>
        </aside>
    );
}

export default function AdminSites({ sites }: Props) {
    const [toDelete, setToDelete] = useState<Site | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [panel, setPanel] = useState<Site | 'new' | null>(null);

    const confirmDelete = () => {
        if (!toDelete) {
            return;
        }

        setDeleting(true);
        router.delete(`/admin/sites/${toDelete.id}`, {
            onSuccess: () => setPanel(null),
            onFinish: () => {
                setDeleting(false);
                setToDelete(null);
            },
        });
    };

    const editingId = panel && panel !== 'new' ? panel.id : null;

    return (
        <>
            <Head title="Kelola Site" />

            <div className="flex flex-col gap-5 pb-10 lg:flex-row lg:items-start">
                <div className="flex min-w-0 flex-col gap-4 lg:flex-[999_1_560px]">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <AdminTitle
                            eyebrow="Manajemen"
                            title="Site"
                            description={`${sites.length} site terdaftar`}
                        />
                        <button
                            type="button"
                            onClick={() => setPanel('new')}
                            className={adminButtonPrimary}
                        >
                            <Plus /> Tambah site
                        </button>
                    </div>

                    <TableCard>
                        {sites.length === 0 ? (
                            <TableEmpty>
                                Belum ada site. Tambahkan site pertama.
                            </TableEmpty>
                        ) : (
                            <DataTable className="min-w-[560px]">
                                <thead>
                                    <tr className={theadRowClass}>
                                        <th>Nama site</th>
                                        <th>Kode</th>
                                        <th>Lokasi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sites.map((site) => (
                                        <tr
                                            key={site.id}
                                            onClick={() => setPanel(site)}
                                            className={cn(
                                                'cursor-pointer',
                                                rowClass(editingId === site.id),
                                            )}
                                        >
                                            <td>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPanel(site);
                                                    }}
                                                    className="text-left font-bold hover:underline"
                                                >
                                                    {site.label}
                                                </button>
                                            </td>
                                            <td>
                                                <Badge
                                                    variant="neutral"
                                                    className="font-mono"
                                                >
                                                    {site.value}
                                                </Badge>
                                            </td>
                                            <td className="tabular text-muted-foreground">
                                                {site.locations?.length ?? 0}{' '}
                                                lokasi
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </DataTable>
                        )}
                    </TableCard>
                </div>

                {panel && (
                    <SitePanel
                        key={panel === 'new' ? 'new' : panel.id}
                        site={panel === 'new' ? null : panel}
                        onClose={() => setPanel(null)}
                        onDelete={setToDelete}
                    />
                )}
            </div>

            <Dialog
                open={!!toDelete}
                onOpenChange={(open) => !open && setToDelete(null)}
            >
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Hapus site?</DialogTitle>
                        <DialogDescription className="space-y-1">
                            <span className="block">
                                Site <strong>{toDelete?.label}</strong>{' '}
                                <span className="font-mono text-xs">
                                    ({toDelete?.value})
                                </span>{' '}
                                akan dihapus.
                            </span>
                            <span className="block text-warning">
                                Karyawan di site ini tidak ikut terhapus, namun
                                field site mereka akan kosong.
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="ghost"
                            onClick={() => setToDelete(null)}
                            disabled={deleting}
                        >
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDelete}
                            disabled={deleting}
                        >
                            {deleting ? 'Menghapus…' : 'Hapus'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
