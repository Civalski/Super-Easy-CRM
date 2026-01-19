/**
 * Componente que agrupa todos os Providers da aplicação
 * Facilita adicionar novos contextos no futuro
 */
'use client';

import { ReactNode } from 'react';
import { LeadsFiltersProvider } from '@/lib/context';

interface ProvidersProps {
    children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    return (
        <LeadsFiltersProvider>
            {children}
        </LeadsFiltersProvider>
    );
}
