import { Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    count: number;
    onDelete: () => void;
    onCancel: () => void;
    deleting?: boolean;
}

/** Floating dark toolbar shown while table rows are selected. */
export default function BatchDeleteBar({
    count,
    onDelete,
    onCancel,
    deleting,
}: Props) {
    if (count === 0) {
        return null;
    }

    return (
        <div
            role="toolbar"
            aria-label="Aksi untuk data terpilih"
            className="fixed inset-x-4 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-xl animate-in items-center gap-3 rounded-full bg-[oklch(0.191_0_0)] py-2 pr-2 pl-5 text-white shadow-[0_12px_28px_oklch(0.191_0_0/0.25)] duration-200 fade-in-0 slide-in-from-bottom-4 lg:bottom-6 dark:border dark:border-border dark:bg-card dark:text-foreground"
        >
            <span className="tabular flex-1 text-sm font-semibold">
                <span className="mr-1.5 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-extrabold text-accent-foreground">
                    {count}
                </span>
                data dipilih
            </span>
            <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                disabled={deleting}
                className="text-white hover:bg-white/10 hover:text-white dark:text-foreground dark:hover:bg-muted"
            >
                <X /> Batal
            </Button>
            <Button
                variant="destructive"
                size="sm"
                onClick={onDelete}
                loading={deleting}
            >
                {!deleting && <Trash2 />}
                {deleting ? 'Menghapus…' : 'Hapus'}
            </Button>
        </div>
    );
}
