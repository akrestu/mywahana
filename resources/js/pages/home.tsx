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

export default function Home({ stats }: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const user = auth.user;

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Selamat Pagi';
        if (hour < 17) return 'Selamat Siang';
        return 'Selamat Malam';
    };

    return (
        <>
            <Head title="Home" />

            <div className="space-y-5">
                {/* Greeting */}
                <div>
                    <p className="text-sm text-muted-foreground">{greeting()},</p>
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
