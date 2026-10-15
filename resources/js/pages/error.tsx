import { Head, Link, router } from '@inertiajs/react';
import { Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = { status: number; message?: string | null };

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
    422: {
        emoji: '📝',
        title: 'Permintaan Tidak Dapat Diproses',
        desc: 'Data yang dibutuhkan belum lengkap. Hubungi admin jika masalah berlanjut.',
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

export default function ErrorPage({ status, message }: Props) {
    const cfg = ERROR_CFG[status] ?? FALLBACK;

    return (
        <>
            <Head title={`${status} — ${cfg.title}`} />
            <div className="relative isolate flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background px-6 py-12">
                <img
                    src="/images/topo.png"
                    alt=""
                    aria-hidden
                    className="pointer-events-none absolute -right-[280px] -bottom-[160px] -z-10 w-[760px] max-w-none opacity-30 dark:opacity-10 dark:invert"
                />
                <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
                    <img src="/logo.png" alt="MyWahana" className="size-12" />
                    <p className="text-7xl font-extrabold tracking-tight tabular">
                        {status}
                    </p>

                    <div className="space-y-2">
                        <h1 className="text-xl font-bold">{cfg.title}</h1>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            {message || cfg.desc}
                        </p>
                    </div>

                    <div className="flex w-full flex-col gap-2.5 pt-2">
                        {cfg.canRetry && (
                            <Button
                                onClick={() => router.reload()}
                                size="lg"
                                className="w-full"
                            >
                                <RefreshCw size={17} /> Muat Ulang
                            </Button>
                        )}
                        <Button
                            asChild
                            variant={cfg.canRetry ? 'outline' : 'default'}
                            size="lg"
                            className="w-full"
                        >
                            <Link href="/home">
                                <Home size={17} /> Kembali ke Beranda
                            </Link>
                        </Button>
                    </div>

                    <p className="pt-4 text-xs text-muted-foreground/60">
                        Datang sehat — kerja aman — pulang selamat
                    </p>
                </div>
            </div>
        </>
    );
}
