import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

/** Asks for a reason, then posts it to an existing "tolak" endpoint. */
export function RejectDialog({
    open,
    onOpenChange,
    url,
    subject,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    url: string;
    subject?: string;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        alasan: '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(url, {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onOpenChange(false);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-lg">
                <form onSubmit={submit} className="flex flex-col gap-4">
                    <DialogHeader>
                        <DialogTitle>
                            Tolak {subject ?? 'pengajuan'}?
                        </DialogTitle>
                        <DialogDescription>
                            Pengaju akan menerima notifikasi beserta alasan
                            Anda.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="alasan">Alasan penolakan</Label>
                        <Textarea
                            id="alasan"
                            value={data.alasan}
                            onChange={(e) => setData('alasan', e.target.value)}
                            placeholder="Jelaskan apa yang perlu diperbaiki"
                            maxLength={1000}
                            required
                            autoFocus
                        />
                        <InputError message={errors.alasan} />
                    </div>
                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            variant="destructive"
                            loading={processing}
                        >
                            Tolak
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
