import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    endpoint: string;
    title: string;
    description?: string;
}

export default function DeleteRangeDialog({ open, onOpenChange, endpoint, title, description }: Props) {
    const form = useForm({ date_from: '', date_to: '', password: '' });

    const close = () => {
        onOpenChange(false);
        form.reset();
        form.clearErrors();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(endpoint, {
            preserveScroll: true,
            onSuccess: () => close(),
        });
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && close()}>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        <DialogDescription>
                            {description ?? 'Ini akan menghapus permanen seluruh data pada rentang tanggal yang dipilih. Tindakan ini tidak dapat dibatalkan.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label className="text-xs">Dari Tanggal</Label>
                                <Input
                                    type="date"
                                    required
                                    value={form.data.date_from}
                                    onChange={(e) => form.setData('date_from', e.target.value)}
                                />
                                {form.errors.date_from && (
                                    <p className="text-xs text-destructive">{form.errors.date_from}</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Sampai Tanggal</Label>
                                <Input
                                    type="date"
                                    required
                                    value={form.data.date_to}
                                    onChange={(e) => form.setData('date_to', e.target.value)}
                                />
                                {form.errors.date_to && (
                                    <p className="text-xs text-destructive">{form.errors.date_to}</p>
                                )}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Password</Label>
                            <Input
                                type="password"
                                required
                                placeholder="Password konfirmasi"
                                value={form.data.password}
                                onChange={(e) => form.setData('password', e.target.value)}
                            />
                            {form.errors.password && (
                                <p className="text-xs text-destructive">{form.errors.password}</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button type="button" variant="outline" onClick={close} disabled={form.processing}>
                            Batal
                        </Button>
                        <Button type="submit" variant="destructive" disabled={form.processing}>
                            {form.processing ? 'Menghapus...' : 'Ya, Hapus'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
