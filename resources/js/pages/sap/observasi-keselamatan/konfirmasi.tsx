import { Head, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { ObservasiReview } from '@/components/observasi/observasi-review';
import type { ObservasiRecord } from '@/components/observasi/observasi-review';
import {
    ModuleHeader,
    SectionLabel,
} from '@/components/patterns/module-header';
import { RejectDialog } from '@/components/patterns/reject-dialog';
import { SignaturePad } from '@/components/patterns/signature-pad';
import { Button } from '@/components/ui/button';

type Props = { record: ObservasiRecord };

export default function ObservasiKeselamatanKonfirmasi({ record }: Props) {
    const form = useForm({ pj_signature: '' });
    const [rejectOpen, setRejectOpen] = useState(false);
    const tanggal = new Date(record.tanggal).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();

        if (form.data.pj_signature) {
            form.post(`/sap/observasi-keselamatan/${record.id}/konfirmasi`);
        }
    };

    return (
        <>
            <Head title="Konfirmasi Observasi" />
            <form
                onSubmit={submit}
                className="flex flex-col gap-4 pt-2 lg:mx-auto lg:max-w-[640px]"
            >
                <ModuleHeader
                    backHref={`/sap/observasi-keselamatan/${record.id}`}
                    eyebrow={`Observasi Keselamatan · ${tanggal}`}
                    title="Konfirmasi PJ"
                />

                <ObservasiReview record={record} />

                <SectionLabel>Keputusan Anda</SectionLabel>
                <p className="rounded-md bg-muted px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                    Dengan memberikan tanda tangan, Anda menyatakan telah
                    mengetahui isi form ini dan akan menindaklanjuti temuan yang
                    ada.
                </p>
                <div className="flex flex-col gap-1.5">
                    <span className="text-[13px] font-semibold">
                        Tanda tangan penanggung jawab{' '}
                        <span className="text-destructive">*</span>
                    </span>
                    <SignaturePad
                        onDataUrl={(d) => form.setData('pj_signature', d ?? '')}
                    />
                    <InputError message={form.errors.pj_signature} />
                </div>

                <div className="sticky bottom-0 -mx-4 flex gap-3 bg-gradient-to-t from-background via-background to-background/0 px-4 pt-6 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:mx-0 lg:px-0">
                    <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        className="flex-1 text-destructive hover:text-destructive"
                        onClick={() => setRejectOpen(true)}
                    >
                        Tolak
                    </Button>
                    <Button
                        type="submit"
                        size="lg"
                        className="flex-[2]"
                        disabled={!form.data.pj_signature}
                        loading={form.processing}
                    >
                        Konfirmasi
                    </Button>
                </div>
            </form>
            <RejectDialog
                open={rejectOpen}
                onOpenChange={setRejectOpen}
                url={`/sap/observasi-keselamatan/${record.id}/tolak`}
                subject="observasi ini"
            />
        </>
    );
}
