import { usePage } from '@inertiajs/react';
import { ChevronsUpDown } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { UserInfo } from '@/components/user-info';
import { UserMenuContent } from '@/components/user-menu-content';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Auth } from '@/types/auth';

const siteLabel: Record<string, string> = {
    baratama: 'Baratama',
    bandhawa: 'Bandhawa',
};

export function NavUser() {
    const { auth } = usePage<{ auth: Auth }>().props;
    const { state } = useSidebar();
    const isMobile = useIsMobile();

    const user = auth.user;
    const roleBadge = user.is_admin ? 'Admin' : 'Karyawan';
    const siteName = user.site ? siteLabel[user.site] ?? user.site : null;

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                {/* Role + Site info — only visible when expanded */}
                {state === 'expanded' && (siteName || roleBadge) && (
                    <div className="mb-1 flex items-center gap-2 px-2 py-1 group-data-[collapsible=icon]:hidden">
                        {siteName && (
                            <span className="rounded-full bg-sidebar-accent px-2 py-0.5 text-xs font-medium text-sidebar-accent-foreground">
                                {siteName}
                            </span>
                        )}
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${user.is_admin ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            {roleBadge}
                        </span>
                    </div>
                )}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="group text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent"
                            data-test="sidebar-menu-button"
                        >
                            <UserInfo user={user} />
                            <ChevronsUpDown className="ml-auto size-4 shrink-0 opacity-50" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        align="end"
                        side={isMobile ? 'bottom' : state === 'collapsed' ? 'left' : 'bottom'}
                    >
                        <UserMenuContent user={user} />
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
