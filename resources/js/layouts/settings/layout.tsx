import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import { Separator } from '@/components/ui/separator';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import { index as teams } from '@/routes/teams';
import type { NavItem } from '@/types';

const navItems: NavItem[] = [
    { title: 'Profil', href: edit(), icon: null },
    { title: 'Keamanan', href: editSecurity(), icon: null },
    { title: 'Tim', href: teams(), icon: null },
    { title: 'Tampilan', href: editAppearance(), icon: null },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-lg font-bold">Pengaturan</h2>
                <p className="text-xs text-muted-foreground">Kelola profil dan akun Anda</p>
            </div>

            {/* Mobile: horizontal scroll tabs */}
            <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:hidden" aria-label="Settings">
                {navItems.map((item, index) => (
                    <Link
                        key={`${toUrl(item.href)}-${index}`}
                        href={item.href}
                        className={cn(
                            'shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                            isCurrentOrParentUrl(item.href)
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                        )}
                    >
                        {item.title}
                    </Link>
                ))}
            </nav>

            <Separator className="lg:hidden" />

            {/* Desktop: sidebar nav + content side by side */}
            <div className="hidden lg:flex lg:gap-12">
                <aside className="w-48 shrink-0">
                    <nav className="flex flex-col gap-1" aria-label="Settings">
                        {navItems.map((item, index) => (
                            <Link
                                key={`${toUrl(item.href)}-${index}`}
                                href={item.href}
                                className={cn(
                                    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                    isCurrentOrParentUrl(item.href)
                                        ? 'bg-muted text-foreground'
                                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                                )}
                            >
                                {item.title}
                            </Link>
                        ))}
                    </nav>
                </aside>

                <Separator orientation="vertical" className="h-auto" />

                <div className="min-w-0 flex-1 space-y-6">{children}</div>
            </div>

            {/* Mobile: stacked content */}
            <div className="lg:hidden space-y-6">{children}</div>
        </div>
    );
}
