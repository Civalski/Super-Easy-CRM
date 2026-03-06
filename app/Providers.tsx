/**
 * Componente que agrupa todos os Providers da aplicação
 * Facilita adicionar novos contextos no futuro
 */
'use client';

import { ReactNode, useEffect } from 'react';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { ConfirmProvider } from '@/components/common/ConfirmProvider';
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
        <AuthProvider>
            <ConfirmProvider>
                {children}
            </ConfirmProvider>
        </AuthProvider>
    );
}
