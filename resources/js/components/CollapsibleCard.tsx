import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Props = {
    title: string;
    badge?: React.ReactNode;
    children: React.ReactNode;
    defaultOpen?: boolean;
    className?: string;
};

export function CollapsibleCard({ title, badge, children, defaultOpen = false, className }: Props) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <Card className={className}>
            <CardHeader
                className="pb-2 cursor-pointer select-none"
                onClick={() => setOpen(v => !v)}
            >
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">
                        {title}
                        {badge && <span className="ml-2">{badge}</span>}
                    </CardTitle>
                    {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
            </CardHeader>
            {open && <CardContent>{children}</CardContent>}
        </Card>
    );
}
