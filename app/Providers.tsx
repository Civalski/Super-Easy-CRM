/**
 * Componente que agrupa todos os Providers da aplicação
 * Facilita adicionar novos contextos no futuro
 */
'use client';

import { ReactNode, useEffect, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { ConfirmProvider } from '@/components/common/ConfirmProvider';
import { createQueryClient } from '@/lib/query/client';
import {
    THEME_EVENT,
    applyThemeToDocument,
    getThemePreference,
    type AppTheme,
} from '@/lib/ui/themePreference';

interface ProvidersProps {
    children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    const [queryClient] = useState(() => createQueryClient());

    useEffect(() => {
        const syncTheme = () => {
            applyThemeToDocument(getThemePreference());
        };

        const handleThemeChange = (event: Event) => {
            const customEvent = event as CustomEvent<AppTheme>;
            applyThemeToDocument(customEvent.detail);
        };

        syncTheme();
        window.addEventListener('storage', syncTheme);
        window.addEventListener(THEME_EVENT, handleThemeChange as EventListener);

        return () => {
            window.removeEventListener('storage', syncTheme);
            window.removeEventListener(THEME_EVENT, handleThemeChange as EventListener);
        };
    }, []);

    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <ConfirmProvider>
                    {children}
                </ConfirmProvider>
            </AuthProvider>
        </QueryClientProvider>
    );
}
