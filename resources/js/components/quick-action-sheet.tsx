import { Link, usePage } from '@inertiajs/react';
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer';
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
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
                <DrawerHeader className="px-0 pt-4 pb-4">
                    <DrawerTitle className="text-left text-xl font-extrabold tracking-tight">
                        Buat baru
                    </DrawerTitle>
                    <DrawerDescription className="text-left">
                        Pilih yang ingin Anda isi atau laporkan.
                    </DrawerDescription>
                </DrawerHeader>
                <div className="grid grid-cols-2 gap-3 overflow-y-auto overscroll-contain">
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
                                    <Icon className="size-5" strokeWidth={1.8} />
                                </span>
                                <span className="text-sm leading-tight font-bold">
                                    {a.createLabel ?? a.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </DrawerContent>
        </Drawer>
    );
}
