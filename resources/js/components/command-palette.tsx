import { router, usePage } from '@inertiajs/react';
import { Home, Inbox, LayoutGrid, Plus, User } from 'lucide-react';
import { useEffect } from 'react';
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { modules, programsFor, quickActionsFor } from '@/modules/registry';
import type { Auth } from '@/types';

const pages = [
    { label: 'Beranda', href: '/home', icon: Home },
    { label: 'Modul', href: '/modules', icon: LayoutGrid },
    { label: 'Inbox', href: '/inbox', icon: Inbox },
    { label: 'Profil', href: '/settings/profile', icon: User },
];

/** Global search across modules and quick actions, opened with Ctrl/⌘ K. */
export function CommandPalette({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const level = auth?.user?.participation_level as string | undefined;

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                onOpenChange(!open);
            }
        };

        window.addEventListener('keydown', onKey);

        return () => window.removeEventListener('keydown', onKey);
    }, [open, onOpenChange]);

    const go = (href: string) => {
        onOpenChange(false);
        router.visit(href);
    };

    return (
        <CommandDialog open={open} onOpenChange={onOpenChange}>
            <DialogTitle className="sr-only">Cari</DialogTitle>
            <DialogDescription className="sr-only">
                Cari modul, fitur, atau aksi cepat.
            </DialogDescription>
            <CommandInput placeholder="Cari modul atau fitur…" />
            <CommandList>
                <CommandEmpty>Tidak ada yang cocok.</CommandEmpty>
                <CommandGroup heading="Aksi cepat">
                    {quickActionsFor(level).map((a) => (
                        <CommandItem
                            key={`new-${a.key}`}
                            value={`buat ${a.createLabel ?? a.label}`}
                            onSelect={() => go(a.createHref!)}
                        >
                            <Plus />
                            {a.createLabel ?? a.label}
                        </CommandItem>
                    ))}
                </CommandGroup>
                {modules
                    .filter((m) => m.status === 'active')
                    .map((m) => (
                        <CommandGroup key={m.key} heading={m.label}>
                            {programsFor(m, level).map((p) => {
                                const Icon = p.icon;

                                return (
                                    <CommandItem
                                        key={p.key}
                                        value={`${m.label} ${p.label}`}
                                        onSelect={() => go(p.href)}
                                    >
                                        <Icon />
                                        {p.label}
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    ))}
                <CommandGroup heading="Halaman">
                    {pages.map((p) => (
                        <CommandItem
                            key={p.href}
                            value={p.label}
                            onSelect={() => go(p.href)}
                        >
                            <p.icon />
                            {p.label}
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}
