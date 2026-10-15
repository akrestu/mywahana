import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="relative isolate flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background p-6 md:p-10">
            <img
                src="/images/topo.png"
                alt=""
                aria-hidden
                className="pointer-events-none absolute -right-[280px] -bottom-[160px] -z-10 w-[760px] max-w-none opacity-30 dark:opacity-10 dark:invert"
            />
            <div className="w-full max-w-sm rounded-[28px] bg-card p-6 shadow-[0_24px_60px_oklch(0.191_0_0/0.08)] sm:p-8">
                <div className="flex flex-col gap-7">
                    <div className="flex flex-col gap-4">
                        <Link
                            href="/home"
                            className="flex items-center gap-2.5 self-start rounded-full bg-muted py-1.5 pr-3.5 pl-1.5"
                        >
                            <AppLogoIcon className="size-[30px] object-contain" />
                            <span className="text-xs font-extrabold tracking-[0.1em]">
                                MYWAHANA
                            </span>
                        </Link>

                        <div className="space-y-1.5">
                            <h1 className="text-2xl font-extrabold tracking-tight">
                                {title}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {description}
                            </p>
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
