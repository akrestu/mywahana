import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

export type NavGroup = {
    label?: string;
    items: NavItem[];
};

export function NavMain({ groups, items }: { groups?: NavGroup[]; items?: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();

    // backward-compat: wrap flat items array into a single group
    const resolvedGroups: NavGroup[] = groups ?? (items ? [{ items }] : []);

    return (
        <>
            {resolvedGroups.map((group, i) => (
                <SidebarGroup key={i} className="px-2 py-1">
                    {group.label && (
                        <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                            {group.label}
                        </SidebarGroupLabel>
                    )}
                    <SidebarMenu>
                        {group.items.map((item) => {
                            const active = isCurrentUrl(item.href);
                            return (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={active}
                                        tooltip={{ children: item.title }}
                                        className="h-10 gap-3 text-sm font-medium"
                                    >
                                        <Link href={item.href} prefetch="mount">
                                            {item.icon && (
                                                <item.icon
                                                    className={active ? 'text-primary' : 'text-sidebar-foreground/60'}
                                                    size={18}
                                                />
                                            )}
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                </SidebarGroup>
            ))}
        </>
    );
}
