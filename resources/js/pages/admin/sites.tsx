import { Head, useForm, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2, X, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Site = { id: number; value: string; label: string };
type Props = { sites: Site[] };

function AddSiteForm() {
    const { data, setData, post, processing, errors, reset } = useForm({ value: '', label: '' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/sites', { onSuccess: () => reset() });
    };

    return (
        <Card>
            <CardHeader className="pb-3 pt-4">
                <CardTitle className="text-base flex items-center gap-2">
                    <Plus size={16} /> Tambah Site Baru
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    <div className="space-y-1.5">
                        <Label className="text-sm font-medium">
                            Kode Site <span className="text-destructive">*</span>
                            <span className="ml-1 font-normal text-muted-foreground text-xs">(huruf, angka, underscore, tanda minus)</span>
                        </Label>
                        <Input
                            value={data.value}
                            onChange={e => setData('value', e.target.value)}
                            placeholder="contoh: site_baru"
                            className="h-10"
                        />
                        {errors.value && <p className="text-sm text-destructive">{errors.value}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-sm font-medium">
                            Nama Tampilan <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            value={data.label}
                            onChange={e => setData('label', e.target.value)}
                            placeholder="contoh: WBK Site XYZ"
                            className="h-10"
                        />
                        {errors.label && <p className="text-sm text-destructive">{errors.label}</p>}
                    </div>
                    <Button type="submit" disabled={processing} className="h-10 self-start px-6">
                        {processing ? 'Menyimpan...' : 'Tambah Site'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

function SiteRow({ site }: { site: Site }) {
    const [editing, setEditing] = useState(false);
    const { data, setData, put, processing, errors } = useForm({ value: site.value, label: site.label });

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/admin/sites/${site.id}`, { onSuccess: () => setEditing(false) });
    };

    const handleDelete = () => {
        if (!confirm(`Hapus site "${site.label}"? User yang sudah terdaftar di site ini tidak akan terhapus.`)) return;
        router.delete(`/admin/sites/${site.id}`);
    };

    return (
        <div className="py-3 border-b last:border-0">
            {editing ? (
                <form onSubmit={handleSave} className="flex flex-col gap-2">
                    <div className="flex gap-2">
                        <div className="flex-1 space-y-1">
                            <Label className="text-xs text-muted-foreground">Kode</Label>
                            <Input
                                value={data.value}
                                onChange={e => setData('value', e.target.value)}
                                className="h-9 font-mono"
                                placeholder="kode_site"
                            />
                            {errors.value && <p className="text-xs text-destructive">{errors.value}</p>}
                        </div>
                        <div className="flex-1 space-y-1">
                            <Label className="text-xs text-muted-foreground">Nama Tampilan</Label>
                            <Input
                                value={data.label}
                                onChange={e => setData('label', e.target.value)}
                                className="h-9"
                                placeholder="Nama Site"
                                autoFocus
                            />
                            {errors.label && <p className="text-xs text-destructive">{errors.label}</p>}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button type="submit" size="sm" disabled={processing} className="h-8 gap-1.5">
                            <Check size={14} /> Simpan
                        </Button>
                        <Button type="button" size="sm" variant="ghost" className="h-8" onClick={() => { setData({ value: site.value, label: site.label }); setEditing(false); }}>
                            <X size={14} /> Batal
                        </Button>
                    </div>
                </form>
            ) : (
                <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{site.label}</p>
                        <p className="text-xs text-muted-foreground font-mono">{site.value}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => setEditing(true)}>
                            <Pencil size={13} /> Edit
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleDelete}>
                            <Trash2 size={13} />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AdminSites({ sites }: Props) {
    return (
        <>
            <Head title="Kelola Site" />
            <div className="space-y-5 max-w-xl">
                <div>
                    <h2 className="text-xl font-bold">Kelola Site</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Tambah, ubah, atau hapus daftar site dalam sistem.</p>
                </div>

                <AddSiteForm />

                <Card>
                    <CardHeader className="pb-3 pt-4">
                        <CardTitle className="text-base">Daftar Site ({sites.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="py-0 px-4">
                        {sites.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4 text-center">Belum ada site.</p>
                        ) : (
                            sites.map(site => <SiteRow key={site.id} site={site} />)
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
