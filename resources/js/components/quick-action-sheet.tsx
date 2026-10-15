import { Link, usePage } from '@inertiajs/react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { quickActionsFor } from '@/modules/registry';
import type { Auth } from '@/types';

export function QuickActionSheet({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const actions = quickActionsFor(
        auth?.user?.participation_level as string | undefined,
    );

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="bottom"
                className="mx-auto max-w-lg gap-0 border-0 px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
            >
                <div
                    className="mx-auto mt-3 h-1 w-10 rounded-full bg-border"
                    aria-hidden
                />
                <SheetHeader className="px-0 pb-4">
                    <SheetTitle className="text-left text-xl font-extrabold tracking-tight">
                        Buat baru
                    </SheetTitle>
                    <SheetDescription className="text-left">
                        Pilih yang ingin Anda isi atau laporkan.
                    </SheetDescription>
                </SheetHeader>
                <div className="grid grid-cols-2 gap-3">
                    {actions.map((a) => {
                        const Icon = a.icon;

                        return (
                            <Link
                                key={a.key}
                                href={a.createHref!}
                                onClick={() => onOpenChange(false)}
                                className="flex min-h-[88px] flex-col justify-between gap-3 rounded-lg bg-muted p-4 transition-colors hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-ring"
                            >
                                <span className="flex size-10 items-center justify-center rounded-md bg-card">
                                    <Icon
                                        className="size-5"
                                        strokeWidth={1.8}
                                    />
                                </span>
                                <span className="text-sm leading-tight font-bold">
                                    {a.createLabel ?? a.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </SheetContent>
        </Sheet>
    );
}
