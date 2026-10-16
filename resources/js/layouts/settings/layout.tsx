import { Link, router, usePage } from '@inertiajs/react';
import { Flame, LogOut } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { logout } from '@/routes';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import { index as teams } from '@/routes/teams';
import type { Auth, NavItem } from '@/types';

const navItems: NavItem[] = [
    { title: 'Profil', href: edit(), icon: null },
    { title: 'Keamanan', href: editSecurity(), icon: null },
    { title: 'Tim', href: teams(), icon: null },
    { title: 'Tampilan', href: editAppearance(), icon: null },
];

type ProfileStats = {
    streak: number;
    badges: { key: string; nama: string; icon: string }[];
};

function initials(name: string) {
    return name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase();
}

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();
    const { auth, profile_stats: profileStats } = usePage<{
        auth: Auth;
        profile_stats?: ProfileStats | null;
    }>().props;
    const user = auth.user;
    const role = [user.jabatan, user.departemen].filter(Boolean).join(' · ');
    const meta = [
        user.site ? `Site ${String(user.site).toUpperCase()}` : null,
        user.nik,
    ]
        .filter(Boolean)
        .join(' · ');

    return (
        <div className="flex flex-col gap-4 pt-2 pb-4 lg:mx-auto lg:max-w-[760px]">
            <section className="rounded-[22px] bg-card">
                <div className="flex items-center gap-3.5 p-[18px]">
                    {user.avatar_url ? (
                        <img
                            src={user.avatar_url}
                            alt=""
                            className="size-14 shrink-0 rounded-full object-cover"
                        />
                    ) : (
                        <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-accent text-lg font-extrabold text-accent-foreground">
                            {initials(user.name ?? '')}
                        </span>
                    )}
                    <div className="min-w-0">
                        <h1 className="truncate text-lg font-extrabold tracking-tight">
                            {user.name}
                        </h1>
                        {role && (
                            <p className="truncate text-xs text-muted-foreground">
                                {role}
                            </p>
                        )}
                        {meta && (
                            <p className="tabular truncate text-xs text-muted-foreground">
                                {meta}
                            </p>
                        )}
                    </div>
                </div>
                {profileStats && (
                    <div className="flex items-center gap-3 border-t border-border px-[18px] py-3.5">
                        <div className="flex shrink-0 items-center gap-2 rounded-full bg-accent-soft px-3 py-1.5">
                            <Flame className="size-4 text-accent-foreground" aria-hidden />
                            <span className="tabular text-[13px] font-bold">
                                {profileStats.streak} hari
                            </span>
                            <span className="text-[11px] text-muted-foreground">streak</span>
                        </div>
                        {profileStats.badges.length > 0 ? (
                            <ul
                                aria-label={`${profileStats.badges.length} badge diraih`}
                                className="flex min-w-0 flex-1 [scrollbar-width:none] gap-1.5 overflow-x-auto"
                            >
                                {profileStats.badges.map((badge) => (
                                    <li
                                        key={badge.key}
                                        title={badge.nama}
                                        aria-label={badge.nama}
                                        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-lg"
                                    >
                                        <span aria-hidden>{badge.icon}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-xs text-muted-foreground">
                                Belum ada badge. Isi Bugar Selamat setiap hari untuk meraihnya.
                            </p>
                        )}
                    </div>
                )}
            </section>

            <nav
                aria-label="Pengaturan"
                className="flex [scrollbar-width:none] gap-1 overflow-x-auto rounded-full bg-muted p-1"
            >
                {navItems.map((item, index) => {
                    const active = isCurrentOrParentUrl(item.href);

                    return (
                        <Link
                            key={`${toUrl(item.href)}-${index}`}
                            href={item.href}
                            aria-current={active ? 'page' : undefined}
                            className={cn(
                                'flex h-10 min-w-[72px] flex-1 items-center justify-center rounded-full px-3 text-[13px] whitespace-nowrap transition-all',
                                active
                                    ? 'bg-card font-bold shadow-[0_1px_2px_oklch(0.191_0_0/0.08)]'
                                    : 'font-semibold text-muted-foreground hover:text-foreground',
                            )}
                        >
                            {item.title}
                        </Link>
                    );
                })}
            </nav>

            <div className="flex flex-col gap-6 rounded-[22px] bg-card p-5 sm:p-6">
                {children}
            </div>

            <Link
                href={logout()}
                as="button"
                onClick={() => router.flushAll()}
                data-test="logout-button"
                className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full border border-border bg-card text-[15px] font-semibold text-destructive transition-colors hover:bg-destructive-soft"
            >
                <LogOut className="size-4" />
                Keluar
            </Link>
            <p className="text-center text-xs text-muted-foreground">
                MyWahana · PT. Wahana Bandhawa Kencana
            </p>
        </div>
    );
}
