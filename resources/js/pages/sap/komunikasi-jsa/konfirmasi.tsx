import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { JsaReview } from '@/components/jsa/jsa-review';
import type { JsaRecord } from '@/components/jsa/jsa-review';
import {
    ModuleHeader,
    SectionLabel,
} from '@/components/patterns/module-header';
import { SignaturePad } from '@/components/patterns/signature-pad';
import { Button } from '@/components/ui/button';

type Props = { record: JsaRecord };

export default function KomunikasiJsaKonfirmasi({ record }: Props) {
    const [signature, setSignature] = useState('');
    const [processing, setProcessing] = useState(false);
    const [tolakOpen, setTolakOpen] = useState(false);
    const tanggal = new Date(record.tanggal).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    const konfirmasi = () => {
        if (!signature) {
            return;
        }

        setProcessing(true);
        router.post(
            `/sap/komunikasi-jsa/${record.id}/konfirmasi`,
            { tl_signature: signature },
            { onFinish: () => setProcessing(false) },
        );
    };

    const tolak = () => {
        setProcessing(true);
        router.post(
            `/sap/komunikasi-jsa/${record.id}/tolak`,
            {},
            { onFinish: () => setProcessing(false) },
        );
    };

    return (
        <>
            <Head title="Konfirmasi Komunikasi JSA" />
            <div className="flex flex-col gap-4 pt-2 lg:mx-auto lg:max-w-[640px]">
                <ModuleHeader
                    backHref={`/sap/komunikasi-jsa/${record.id}`}
                    eyebrow={`Komunikasi JSA · ${tanggal}`}
                    title="Tanda tangan TL"
                />

                <JsaReview record={record} />

                <SectionLabel>Keputusan Anda</SectionLabel>
                <p className="rounded-md bg-muted px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                    Dengan menandatangani, Anda sebagai team leader
                    mengonfirmasi komunikasi JSA/SOP/IK ini telah dilaksanakan.
                </p>
                <div className="flex flex-col gap-1.5">
                    <span className="text-[13px] font-semibold">
                        Tanda tangan team leader{' '}
                        <span className="text-destructive">*</span>
                    </span>
                    <SignaturePad onDataUrl={(d) => setSignature(d ?? '')} />
                </div>

                <div className="sticky bottom-0 -mx-4 flex gap-3 bg-gradient-to-t from-background via-background to-background/0 px-4 pt-6 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:mx-0 lg:px-0">
                    <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        className="flex-1 text-destructive hover:text-destructive"
                        disabled={processing}
                        onClick={() => setTolakOpen(true)}
                    >
                        Tolak
                    </Button>
                    <Button
                        type="button"
                        size="lg"
                        className="flex-[2]"
                        disabled={!signature}
                        loading={processing}
                        onClick={konfirmasi}
                    >
                        Konfirmasi
                    </Button>
                </div>
            </div>

            <ConfirmDialog
                open={tolakOpen}
                onOpenChange={setTolakOpen}
                title="Tolak komunikasi JSA ini?"
                description="Supervisor akan menerima notifikasi bahwa form ditolak."
                confirmLabel="Tolak"
                destructive
                onConfirm={tolak}
            />
        </>
    );
}
