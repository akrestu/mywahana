import { Head } from '@inertiajs/react';
import { CloudOff } from 'lucide-react';
import { ResultScreen } from '@/components/patterns/result-screen';
import { Button } from '@/components/ui/button';

/** Shown after a form was queued because the device is offline. */
export function OfflineSaved({
    what,
    onAgain,
}: {
    what: string;
    onAgain?: () => void;
}) {
    return (
        <>
            <Head title="Tersimpan di perangkat" />
            <ResultScreen
                icon={CloudOff}
                tone="accent"
                title="Tersimpan di perangkat"
                description={`${what} akan dikirim otomatis begitu perangkat kembali online. Jangan hapus data browser sampai terkirim.`}
                actions={
                    <>
                        <Button asChild size="lg">
                            <a href="/home">Kembali ke Beranda</a>
                        </Button>
                        {onAgain && (
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={onAgain}
                            >
                                Isi laporan lain
                            </Button>
                        )}
                    </>
                }
            />
        </>
    );
}
