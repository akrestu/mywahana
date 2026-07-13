import { Head, Link, usePage } from '@inertiajs/react';
import { ClipboardCheck, TriangleAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Auth } from '@/types';

type Props = {
    auth: Auth;
    stats?: {
        bugar_selamat_today: number;
        laporan_bahaya_month: number;
    };
};

type TimeOfDay = { greeting: string; emoji: string; gradientStyle: string; shimmer: string; clockColor: string };

function getTimeOfDay(hour: number): TimeOfDay {
    if (hour >= 4 && hour < 6) {
return { greeting: 'Selamat Subuh', emoji: '🌄', gradientStyle: 'linear-gradient(135deg, rgba(26,14,60,0.55) 0%, rgba(90,40,120,0.40) 35%, rgba(220,90,40,0.35) 70%, rgba(255,160,60,0.25) 100%)', shimmer: 'bg-[#E85D04]/20', clockColor: 'text-[#C2410C] dark:text-[#FED7AA]' };
}

    if (hour >= 6 && hour < 11) {
return { greeting: 'Selamat Pagi', emoji: '🌅', gradientStyle: 'linear-gradient(135deg, rgba(255,183,77,0.45) 0%, rgba(255,213,120,0.30) 35%, rgba(100,195,230,0.30) 70%, rgba(56,189,248,0.20) 100%)', shimmer: 'bg-[#FFB74D]/25', clockColor: 'text-[#92400E] dark:text-[#FDE68A]' };
}

    if (hour >= 11 && hour < 15) {
return { greeting: 'Selamat Siang', emoji: '☀️', gradientStyle: 'linear-gradient(135deg, rgba(30,136,229,0.35) 0%, rgba(79,195,247,0.28) 45%, rgba(224,247,254,0.25) 100%)', shimmer: 'bg-[#29B6F6]/20', clockColor: 'text-[#075985] dark:text-[#7DD3FC]' };
}

    if (hour >= 15 && hour < 18) {
return { greeting: 'Selamat Sore', emoji: '🌇', gradientStyle: 'linear-gradient(135deg, rgba(255,111,0,0.45) 0%, rgba(255,160,0,0.35) 35%, rgba(255,213,79,0.25) 65%, rgba(251,140,0,0.15) 100%)', shimmer: 'bg-[#FF6F00]/25', clockColor: 'text-[#9A3412] dark:text-[#FED7AA]' };
}

    if (hour >= 18 && hour < 20) {
return { greeting: 'Selamat Senja', emoji: '🌆', gradientStyle: 'linear-gradient(135deg, rgba(211,47,47,0.45) 0%, rgba(194,24,91,0.35) 35%, rgba(123,31,162,0.35) 65%, rgba(49,27,146,0.25) 100%)', shimmer: 'bg-[#C2185B]/20', clockColor: 'text-[#881337] dark:text-[#FECDD3]' };
}

    return { greeting: 'Selamat Malam', emoji: '🌙', gradientStyle: 'linear-gradient(135deg, rgba(10,14,50,0.60) 0%, rgba(26,35,126,0.45) 45%, rgba(49,27,146,0.35) 75%, rgba(13,20,80,0.40) 100%)', shimmer: 'bg-[#3949AB]/20', clockColor: 'text-[#1E3A8A] dark:text-[#BAE6FD]' };
}

export default function Home({ stats }: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const user = auth.user;
    const tod = getTimeOfDay(new Date().getHours());

    return (
        <>
            <Head title="Home" />

            <div className="space-y-5">
                {/* Greeting */}
                <div className="relative overflow-hidden rounded-2xl border" style={{ background: tod.gradientStyle }}>
                    <div className={`pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl ${tod.shimmer} animate-pulse`} />
                    <div className="relative p-4">
                        <p className="flex items-center gap-1.5 text-xs text-foreground/60"><span>{tod.emoji}</span>{tod.greeting},</p>
                        <h2 className="text-xl font-bold">{user.name}</h2>
                        {(user.jabatan || user.site) && (
                            <div className="mt-1 flex flex-wrap gap-1">
                                {user.jabatan && (
                                    <Badge variant="secondary" className="text-xs">
                                        {user.jabatan}
                                    </Badge>
                                )}
                                {user.site && (
                                    <Badge variant="outline" className="text-xs capitalize">
                                        Site {user.site}
                                    </Badge>
                                )}
                            </div>
                        )}
                        {(!user.nik || !user.jabatan || !user.site) && (
                            <p className="mt-2 text-xs text-muted-foreground">
                                <Link href="/settings/profile" className="text-primary underline">
                                    Lengkapi profil
                                </Link>{' '}
                                untuk mengisi form dengan cepat.
                            </p>
                        )}
                    </div>
                </div>

                {/* Main Actions */}
                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        Laporkan Sekarang
                    </h3>

                    <div className="grid gap-3 lg:grid-cols-2">
                        <Link href="/bugar-selamat/create">
                            <Card className="cursor-pointer border-green-200 bg-green-50 transition-colors hover:bg-green-100 dark:border-green-900 dark:bg-green-950 dark:hover:bg-green-900">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-200 dark:bg-green-800">
                                            <ClipboardCheck className="h-5 w-5 text-green-700 dark:text-green-300" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base text-green-900 dark:text-green-100">
                                                Bugar Selamat
                                            </CardTitle>
                                            <CardDescription className="text-xs text-green-700 dark:text-green-400">
                                                WBK-HSE-FO-021
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-green-800 dark:text-green-200">
                                        Checklist kelayakan sebelum memulai kerja
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>

                        <Link href="/laporan-bahaya/create">
                            <Card className="cursor-pointer border-red-200 bg-red-50 transition-colors hover:bg-red-100 dark:border-red-900 dark:bg-red-950 dark:hover:bg-red-900">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-200 dark:bg-red-800">
                                            <TriangleAlert className="h-5 w-5 text-red-700 dark:text-red-300" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base text-red-900 dark:text-red-100">
                                                Laporan Bahaya
                                            </CardTitle>
                                            <CardDescription className="text-xs text-red-700 dark:text-red-400">
                                                WBK-HSE-FO-010
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-red-800 dark:text-red-200">
                                        Laporkan kondisi bahaya yang ditemukan di area kerja
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>
                    </div>
                </div>

                {/* Quick links */}
                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        Riwayat
                    </h3>
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                        <Link href="/bugar-selamat">
                            <Card className="cursor-pointer transition-colors hover:bg-accent">
                                <CardContent className="pt-4 pb-4 text-center">
                                    <ClipboardCheck className="mx-auto mb-1 h-6 w-6 text-muted-foreground" />
                                    <p className="text-xs font-medium">Riwayat</p>
                                    <p className="text-xs text-muted-foreground">Bugar Selamat</p>
                                </CardContent>
                            </Card>
                        </Link>
                        <Link href="/laporan-bahaya">
                            <Card className="cursor-pointer transition-colors hover:bg-accent">
                                <CardContent className="pt-4 pb-4 text-center">
                                    <TriangleAlert className="mx-auto mb-1 h-6 w-6 text-muted-foreground" />
                                    <p className="text-xs font-medium">Riwayat</p>
                                    <p className="text-xs text-muted-foreground">Laporan Bahaya</p>
                                </CardContent>
                            </Card>
                        </Link>
                    </div>
                </div>

                {/* Tagline */}
                <p className="text-center text-xs text-muted-foreground pt-2">
                    Datang sehat — kerja aman — pulang selamat
                </p>
            </div>
        </>
    );
}
