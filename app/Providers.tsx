/**
 * Componente que agrupa todos os Providers da aplicação
 * Facilita adicionar novos contextos no futuro
 */
'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/components/providers/AuthProvider';

interface ProvidersProps {
    children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    return (
        <AuthProvider>
            {children}
        </AuthProvider>
    );
}
