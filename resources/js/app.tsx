import { createInertiaApp } from '@inertiajs/react';
import { lazy, Suspense } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import TrackingLayout from '@/layouts/tracking-layout';

const AuthLayout = lazy(() => import('@/layouts/auth-layout'));

const appName = import.meta.env.VITE_APP_NAME || 'Raih TOEFL 500+ Cukup 15 Hari. (LMS + Tutor Ai)';

createInertiaApp({
    title: (title) => (title ? `${title}` : appName),
    layout: (name) => {
        switch (true) {
            case name.startsWith('auth/'):
                return [TrackingLayout, AuthLayout];
            default:
                return TrackingLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {/* Suspense is required when using lazy() layout imports */}
                <Suspense fallback={null}>{app}</Suspense>
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

initializeTheme();
