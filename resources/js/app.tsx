import { createInertiaApp } from '@inertiajs/react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AuthLayout from '@/layouts/auth-layout';
import ResponsiveLayout from '@/layouts/responsive-layout';
import SettingsLayout from '@/layouts/settings/layout';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
            case name === 'error':
                return null;
            case name === 'auth/login':
                return null;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
            case name.startsWith('teams/'):
                return [ResponsiveLayout, SettingsLayout];
            default:
                return ResponsiveLayout;
        }
    },
    strictMode: true,
    defaults: {
        // Fade between pages. Partial reloads (filters, polling) and visits
        // that keep the current page's state stay instant.
        visitOptions: (_href, options) => ({
            // <Link> always passes viewTransition: false, so only an explicit
            // true (or callback) is kept as is.
            viewTransition:
                options.viewTransition ||
                ((options.method ?? 'get') === 'get' &&
                    !options.preserveState &&
                    !options.only?.length &&
                    !options.except?.length),
        }),
    },
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: false,
});

// This will set light / dark mode on load...
initializeTheme();
