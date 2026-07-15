import { Head, router } from '@inertiajs/react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = { status: number };

const ERROR_CFG: Record<
    number,
    { emoji: string; title: string; desc: string; canRetry?: boolean }
> = {
    403: {
        emoji: '🚧',
        title: 'Akses Ditolak',
        desc: 'Anda tidak memiliki izin untuk membuka halaman ini. Jika merasa ini keliru, hubungi admin.',
    },
    404: {
        emoji: '🧭',
        title: 'Halaman Tidak Ditemukan',
        desc: 'Halaman yang Anda cari tidak ada atau sudah dipindahkan. Periksa kembali alamatnya.',
    },
    419: {
        emoji: '⏰',
        title: 'Sesi Kedaluwarsa',
        desc: 'Halaman ini sudah terlalu lama dibuka. Muat ulang untuk melanjutkan.',
        canRetry: true,
    },
    429: {
        emoji: '🐢',
        title: 'Terlalu Banyak Permintaan',
        desc: 'Anda mengirim permintaan terlalu cepat. Tunggu sebentar, lalu coba lagi.',
        canRetry: true,
    },
    500: {
        emoji: '🛠️',
        title: 'Terjadi Kesalahan Server',
        desc: 'Ada masalah di sisi kami — bukan salah Anda. Tim IT sudah mendapat catatannya. Coba lagi beberapa saat.',
        canRetry: true,
    },
    503: {
        emoji: '🔧',
        title: 'Sedang Pemeliharaan',
        desc: 'MyWahana sedang dalam pemeliharaan singkat. Silakan kembali beberapa menit lagi.',
        canRetry: true,
    },
};

const FALLBACK = {
    emoji: '❓',
    title: 'Terjadi Kesalahan',
    desc: 'Ada yang tidak beres. Coba muat ulang halaman.',
    canRetry: true,
};

export default function ErrorPage({ status }: Props) {
    const cfg = ERROR_CFG[status] ?? FALLBACK;

    return (
        <>
            <Head title={`${status} — ${cfg.title}`} />
            <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
                <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
                    {/* Emoji + kode status */}
                    <div className="relative">
                        <div className="absolute inset-0 -z-10 animate-pulse rounded-full bg-primary/10 blur-2xl" />
                        <span className="block animate-bounce text-7xl [animation-duration:2.5s]">
                            {cfg.emoji}
                        </span>
                    </div>
                    <p className="font-mono text-6xl font-black tracking-tight text-primary/20">
                        {status}
                    </p>

                    <div className="space-y-2">
                        <h1 className="text-xl font-bold">{cfg.title}</h1>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            {cfg.desc}
                        </p>
                    </div>

                    {cfg.canRetry && (
                        <div className="flex w-full flex-col gap-2.5 pt-2">
                            <Button
                                onClick={() => router.reload()}
                                className="h-12 w-full gap-2 text-base font-bold"
                            >
                                <RefreshCw size={17} /> Muat Ulang
                            </Button>
                        </div>
                    )}

                    <p className="pt-4 text-xs text-muted-foreground/60">
                        Datang sehat — kerja aman — pulang selamat
                    </p>
                </div>
            </div>
        </>
    );
}
