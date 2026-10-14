import { router } from '@inertiajs/react';
import type { ReactNode } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const JENIS = [
    { key: 'kantor', label: 'Kantor' },
    { key: 'tambang', label: 'Tambang' },
    { key: 'workshop', label: 'Workshop' },
    { key: 'mess', label: 'Mess' },
] as const;

/**
 * Pilihan jenis inspeksi. Dipakai di aksi cepat dan di kartu target agar
 * langkah membuat inspeksi selalu sama dari mana pun dimulai.
 */
export function InspeksiMenu({
    children,
    align = 'end',
}: {
    children: ReactNode;
    align?: 'start' | 'end';
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
            <DropdownMenuContent align={align} className="w-56">
                {JENIS.map((j) => (
                    <DropdownMenuItem
                        key={j.key}
                        className="min-h-10"
                        onSelect={() =>
                            router.visit(`/sap/inspeksi-${j.key}/create`)
                        }
                    >
                        Inspeksi {j.label}
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="min-h-10 text-muted-foreground"
                    onSelect={() => router.visit('/sap/inspeksi')}
                >
                    Semua inspeksi saya
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
