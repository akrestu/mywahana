import { Link } from '@inertiajs/react';
import type { InertiaLinkProps } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/types';

export type NavGroup = {
    label?: string;
    /** match: path prefix that also marks the item active, or false to never mark it. */
    items: (NavItem & { badge?: number | string; match?: string | false })[];
};

type HrefType = NonNullable<InertiaLinkProps['href']>;

export function NavMain({
    groups,
    items,
}: {
    groups?: NavGroup[];
    items?: NavItem[];
}) {
    const { isCurrentUrl, currentUrl } = useCurrentUrl();

    // backward-compat: wrap flat items array into a single group
    const resolvedGroups: NavGroup[] = groups ?? (items ? [{ items }] : []);

    return (
        <>
            {resolvedGroups.map((group, i) => (
                <NavGroup
                    key={group.label ?? i}
                    group={group}
                    isActive={isCurrentUrl}
                    currentUrl={currentUrl}
                />
            ))}
        </>
    );
}

/** Sidebar group per ADashboard: uppercase label, 40px rows, ink active state with accent dot. */
function NavGroup({
    group,
    isActive,
    currentUrl,
}: {
    group: NavGroup;
    isActive: (href: HrefType) => boolean;
    currentUrl: string;
}) {
    const { isMobile, setOpenMobile } = useSidebar();

    return (
        <SidebarGroup className="p-0">
            {group.label && (
                <SidebarGroupLabel className="h-auto px-3 pt-3.5 pb-1 text-[11px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
                    {group.label}
                </SidebarGroupLabel>
            )}
            <SidebarMenu className="gap-0.5">
                {group.items.map((item) => {
                    const active =
                        item.match === false
                            ? false
                            : item.match
                              ? currentUrl.startsWith(item.match)
                              : isActive(item.href);
                    const badge =
                        typeof item.badge === 'number' && item.badge > 99
                            ? '99+'
                            : item.badge;

                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={active}
                                tooltip={{ children: item.title }}
                                className={cn(
                                    'h-10 gap-2.5 rounded-[12px] px-3 text-sm transition-colors',
                                    active
                                        ? 'bg-primary font-semibold text-primary-foreground hover:bg-primary hover:text-primary-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground'
                                        : 'font-medium text-sidebar-foreground hover:bg-background',
                                )}
                            >
                                <Link
                                    href={item.href}
                                    prefetch="mount"
                                    onClick={() => isMobile && setOpenMobile(false)}
                                >
                                    {active && (
                                        <span
                                            aria-hidden
                                            className="size-1.5 shrink-0 rounded-full bg-accent group-data-[collapsible=icon]:hidden"
                                        />
                                    )}
                                    {item.icon && (
                                        <item.icon className="hidden size-4 shrink-0 group-data-[collapsible=icon]:block" />
                                    )}
                                    <span className="truncate">
                                        {item.title}
                                    </span>
                                    {badge !== undefined && badge !== 0 && (
                                        <span className="tabular ml-auto rounded-full bg-accent px-[7px] py-0.5 text-[11px] font-bold text-accent-foreground group-data-[collapsible=icon]:hidden">
                                            {badge}
                                        </span>
                                    )}
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
