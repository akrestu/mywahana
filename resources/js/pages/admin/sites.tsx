import { Head, useForm, router } from '@inertiajs/react';
import { Check, MapPin, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type Site = { id: number; value: string; label: string; locations?: string[] | null };
type Props = { sites: Site[] };

function AddSiteForm() {
    const { data, setData, post, processing, errors, reset } = useForm({ value: '', label: '', locations: '' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/sites', { onSuccess: () => reset() });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Plus size={16} className="text-primary" />
                    Tambah Site Baru
                </CardTitle>
                <CardDescription>
                    Kode site digunakan sebagai nilai internal dalam sistem.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label>
                            Kode Site <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            value={data.value}
                            onChange={(e) => setData('value', e.target.value)}
                            placeholder="contoh: site_baru"
                            className="font-mono"
                        />
                        <p className="text-xs text-muted-foreground">
                            Hanya huruf, angka, underscore, dan tanda minus.
                        </p>
                        {errors.value && <p className="text-sm text-destructive">{errors.value}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <Label>
                            Nama Tampilan <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            value={data.label}
                            onChange={(e) => setData('label', e.target.value)}
                            placeholder="contoh: WBK Site XYZ"
                        />
                        {errors.label && <p className="text-sm text-destructive">{errors.label}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <Label>Daftar Lokasi</Label>
                        <Textarea
                            value={data.locations}
                            onChange={(e) => setData('locations', e.target.value)}
                            placeholder={'Satu lokasi per baris\nContoh: Workshop\nArea Parkir'}
                            rows={5}
                        />
                        <p className="text-xs text-muted-foreground">Lokasi ini akan menjadi pilihan pada form laporan untuk site tersebut.</p>
                        {errors.locations && <p className="text-sm text-destructive">{errors.locations}</p>}
                    </div>
                    <Button type="submit" disabled={processing} className="w-full gap-2">
                        <Plus size={15} />
                        {processing ? 'Menyimpan...' : 'Tambah Site'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

function SiteRow({ site, onDelete }: { site: Site; onDelete: (site: Site) => void }) {
    const [editing, setEditing] = useState(false);
    const { data, setData, put, processing, errors } = useForm({
        value: site.value,
        label: site.label,
        locations: (site.locations ?? []).join('\n'),
    });

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/admin/sites/${site.id}`, { onSuccess: () => setEditing(false) });
    };

    const handleCancel = () => {
        setData({ value: site.value, label: site.label, locations: (site.locations ?? []).join('\n') });
        setEditing(false);
    };

    if (editing) {
        return (
            <tr className="bg-muted/30">
                <td colSpan={3} className="px-4 py-3">
                    <form onSubmit={handleSave}>
                        <div className="flex flex-wrap items-start gap-3">
                            <div className="min-w-32 flex-1 space-y-1">
                                <Label className="text-xs text-muted-foreground">Kode Site</Label>
                                <Input
                                    value={data.value}
                                    onChange={(e) => setData('value', e.target.value)}
                                    className="h-8 font-mono text-sm"
                                    placeholder="kode_site"
                                />
                                {errors.value && <p className="text-xs text-destructive">{errors.value}</p>}
                            </div>
                            <div className="min-w-40 flex-[2] space-y-1">
                                <Label className="text-xs text-muted-foreground">Nama Tampilan</Label>
                                <Input
                                    value={data.label}
                                    onChange={(e) => setData('label', e.target.value)}
                                    className="h-8 text-sm"
                                    placeholder="Nama Site"
                                    autoFocus
                                />
                                {errors.label && <p className="text-xs text-destructive">{errors.label}</p>}
                            </div>
                            <div className="min-w-48 flex-[2] space-y-1">
                                <Label className="text-xs text-muted-foreground">Daftar Lokasi</Label>
                                <Textarea
                                    value={data.locations}
                                    onChange={(e) => setData('locations', e.target.value)}
                                    className="min-h-20 text-sm"
                                    placeholder="Satu lokasi per baris"
                                />
                                {errors.locations && <p className="text-xs text-destructive">{errors.locations}</p>}
                            </div>
                            <div className="flex items-end gap-1.5 pt-5">
                                <Button type="submit" size="sm" disabled={processing} className="h-8 gap-1.5">
                                    <Check size={13} /> Simpan
                                </Button>
                                <Button type="button" size="sm" variant="ghost" className="h-8 gap-1.5" onClick={handleCancel}>
                                    <X size={13} /> Batal
                                </Button>
                            </div>
                        </div>
                    </form>
                </td>
            </tr>
        );
    }

    return (
        <tr className="group hover:bg-muted/30 transition-colors">
            <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                        <MapPin size={14} className="text-primary" />
                    </div>
                    <span className="font-medium text-sm">{site.label}</span>
                    <span className="text-xs text-muted-foreground">{site.locations?.length ?? 0} lokasi</span>
                </div>
            </td>
            <td className="px-4 py-3">
                <Badge variant="outline" className="font-mono text-xs font-normal">
                    {site.value}
                </Badge>
            </td>
            <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => setEditing(true)}
                    >
                        <Pencil size={14} />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => onDelete(site)}
                    >
                        <Trash2 size={14} />
                    </Button>
                </div>
            </td>
        </tr>
    );
}

export default function AdminSites({ sites }: Props) {
    const [toDelete, setToDelete] = useState<Site | null>(null);
    const [deleting, setDeleting] = useState(false);

    const confirmDelete = () => {
        if (!toDelete) {
return;
}

        setDeleting(true);
        router.delete(`/admin/sites/${toDelete.id}`, {
            onFinish: () => {
 setDeleting(false); setToDelete(null); 
},
        });
    };

    return (
        <>
            <Head title="Kelola Site" />

            <div className="space-y-4">
                {/* Header */}
                <div>
                    <h2 className="text-lg font-bold">Kelola Site</h2>
                    <p className="text-sm text-muted-foreground">Tambah, ubah, atau hapus daftar lokasi/site dalam sistem.</p>
                </div>

                {/* Layout: form (kiri) + tabel (kanan) */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                    {/* Form tambah — fixed width di desktop */}
                    <div className="w-full lg:w-72 shrink-0">
                        <AddSiteForm />
                    </div>

                    {/* Tabel site */}
                    <div className="min-w-0 flex-1">
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base">Daftar Site</CardTitle>
                                    <Badge variant="secondary" className="text-xs">
                                        {sites.length} site
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {sites.length === 0 ? (
                                    <div className="flex flex-col items-center gap-2 py-12 text-center">
                                        <MapPin size={32} className="text-muted-foreground/30" />
                                        <p className="text-sm text-muted-foreground">Belum ada site. Tambahkan site pertama.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="border-b bg-muted/50">
                                                <tr>
                                                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                        Nama Site
                                                    </th>
                                                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                        Kode
                                                    </th>
                                                    <th className="w-24 px-4 py-2.5" />
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {sites.map((site) => (
                                                    <SiteRow key={site.id} site={site} onDelete={setToDelete} />
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Dialog konfirmasi hapus */}
            <Dialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Hapus Site?</DialogTitle>
                        <DialogDescription className="space-y-1">
                            <span className="block">
                                Anda akan menghapus site <strong>{toDelete?.label}</strong>{' '}
                                <span className="font-mono text-xs">({toDelete?.value})</span>.
                            </span>
                            <span className="block text-amber-600 dark:text-amber-400">
                                Karyawan yang terdaftar di site ini tidak akan ikut terhapus, namun field site mereka akan kosong.
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setToDelete(null)} disabled={deleting}>
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
                            {deleting ? 'Menghapus...' : 'Ya, Hapus'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
