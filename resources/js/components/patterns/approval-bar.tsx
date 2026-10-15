import { Link } from '@inertiajs/react';
import { useState } from 'react';
import { RejectDialog } from '@/components/patterns/reject-dialog';
import { Button } from '@/components/ui/button';

/** Tolak · Detail · Setujui row used on inbox items and detail pages. */
export function ApprovalBar({
    approveHref,
    approveLabel = 'Setujui',
    rejectUrl,
    detailHref,
    subject,
}: {
    approveHref?: string | null;
    approveLabel?: string;
    rejectUrl?: string | null;
    detailHref?: string;
    subject?: string;
}) {
    const [rejectOpen, setRejectOpen] = useState(false);

    return (
        <div className="flex gap-2">
            {rejectUrl && (
                <>
                    <Button
                        type="button"
                        variant="outline"
                        className="flex-1 text-destructive hover:text-destructive"
                        onClick={() => setRejectOpen(true)}
                    >
                        Tolak
                    </Button>
                    <RejectDialog
                        open={rejectOpen}
                        onOpenChange={setRejectOpen}
                        url={rejectUrl}
                        subject={subject}
                    />
                </>
            )}
            {detailHref && (
                <Button asChild variant="outline" className="flex-1">
                    <Link href={detailHref}>Detail</Link>
                </Button>
            )}
            {approveHref && (
                <Button asChild className="flex-1">
                    <Link href={approveHref}>{approveLabel}</Link>
                </Button>
            )}
        </div>
    );
}
