import { Link, router, usePage } from '@inertiajs/react';
import { LogOut } from 'lucide-react';
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
    const { auth } = usePage<{ auth: Auth }>().props;
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
            <section className="relative isolate overflow-hidden rounded-[22px] bg-card">
                <div className="relative h-24">
                    <img
                        src="/images/mountain.jpg"
                        alt=""
                        className="absolute inset-0 size-full object-cover object-[60%_65%]"
                    />
                    <div
                        aria-hidden
                        className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent"
                    />
                </div>
                <div className="flex items-end gap-3.5 px-[18px] pb-[18px]">
                    {user.avatar_url ? (
                        <img
                            src={user.avatar_url}
                            alt=""
                            className="-mt-9 size-[72px] shrink-0 rounded-full object-cover ring-4 ring-card"
                        />
                    ) : (
                        <span className="-mt-9 flex size-[72px] shrink-0 items-center justify-center rounded-full bg-accent text-xl font-extrabold text-accent-foreground ring-4 ring-card">
                            {initials(user.name ?? '')}
                        </span>
                    )}
                    <div className="min-w-0 pt-2">
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
