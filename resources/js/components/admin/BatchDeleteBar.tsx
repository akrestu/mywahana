import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    count: number;
    onDelete: () => void;
    onCancel: () => void;
    deleting?: boolean;
}

export default function BatchDeleteBar({ count, onDelete, onCancel, deleting }: Props) {
    if (count === 0) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card p-4 shadow-lg">
            <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">{count} data dipilih</span>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={onCancel} disabled={deleting}>
                        Batal
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={onDelete}
                        disabled={deleting}
                        className="gap-1"
                    >
                        <Trash2 size={14} />
                        {deleting ? 'Menghapus...' : 'Hapus Terpilih'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
