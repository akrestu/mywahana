import * as React from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';
import { cn } from '@/lib/utils';

/**
 * Bottom sheet mobile berbasis vaul: animasi mengikuti jari dan bisa
 * diseret turun untuk menutup. Selama terbuka, <html> diberi
 * data-drawer-open agar efek kaca (backdrop-filter) di belakangnya
 * dimatikan; blur yang dihitung ulang setiap frame membuat animasi patah.
 */
function Drawer({
    open,
    ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) {
    React.useEffect(() => {
        if (!open) {
            return;
        }

        const root = document.documentElement;
        const count = Number(root.dataset.drawerOpen ?? 0) + 1;
        root.dataset.drawerOpen = String(count);

        return () => {
            const remaining = Number(root.dataset.drawerOpen ?? 1) - 1;

            if (remaining > 0) {
                root.dataset.drawerOpen = String(remaining);
            } else {
                delete root.dataset.drawerOpen;
            }
        };
    }, [open]);

    return <DrawerPrimitive.Root data-slot="drawer" open={open} {...props} />;
}

function DrawerTrigger(
    props: React.ComponentProps<typeof DrawerPrimitive.Trigger>,
) {
    return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

function DrawerClose(props: React.ComponentProps<typeof DrawerPrimitive.Close>) {
    return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

function DrawerOverlay({
    className,
    ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
    return (
        <DrawerPrimitive.Overlay
            data-slot="drawer-overlay"
            className={cn('fixed inset-0 z-50 bg-black/80', className)}
            {...props}
        />
    );
}

function DrawerContent({
    className,
    children,
    ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content>) {
    return (
        <DrawerPrimitive.Portal>
            <DrawerOverlay />
            <DrawerPrimitive.Content
                data-slot="drawer-content"
                aria-describedby={undefined}
                className={cn(
                    'fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[90dvh] w-full max-w-lg flex-col rounded-t-[28px] bg-card pt-2.5 pb-[env(safe-area-inset-bottom)] text-card-foreground shadow-lg outline-none dark:border-t',
                    className,
                )}
                {...props}
            >
                <div
                    aria-hidden
                    className="mx-auto h-[5px] w-10 shrink-0 rounded-full bg-border"
                />
                {children}
            </DrawerPrimitive.Content>
        </DrawerPrimitive.Portal>
    );
}

function DrawerHeader({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="drawer-header"
            className={cn('flex flex-col gap-1.5 p-4', className)}
            {...props}
        />
    );
}

function DrawerTitle({
    className,
    ...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
    return (
        <DrawerPrimitive.Title
            data-slot="drawer-title"
            className={cn('font-semibold text-foreground', className)}
            {...props}
        />
    );
}

function DrawerDescription({
    className,
    ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
    return (
        <DrawerPrimitive.Description
            data-slot="drawer-description"
            className={cn('text-sm text-muted-foreground', className)}
            {...props}
        />
    );
}

export {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerOverlay,
    DrawerTitle,
    DrawerTrigger,
};
