import type { Auth } from '@/types/auth';
import type { Team } from '@/types/teams';

declare module 'react' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            vapidPublicKey: string | null;
            sidebarOpen: boolean;
            currentTeam: Team | null;
            teams: Team[];
            notifications: Array<{
                id: string;
                message: string;
                url: string | null;
                read_at: string | null;
                created_at: string;
            }>;
            unread_notifications_count: number;
            [key: string]: unknown;
        };
    }
}
