---
description: Como adicionar um novo componente ao projeto
---
# Criar Novo Componente

## Passos para criar um componente:

1. **Escolher o diretório correto:**
   - Componente genérico → `/components/common/`
   - Componente de layout → `/components/layout/`
   - Componente de feature → `/components/features/[feature]/`

2. **Criar o arquivo do componente:**
   ```typescript
   /**
    * Descrição do componente
    */
   'use client'  // Se for interativo
   
   import { useState } from 'react';
   
   interface MeuComponenteProps {
       prop1: string;
       prop2?: number;
   }
   
   export function MeuComponente({ prop1, prop2 }: MeuComponenteProps) {
       return (
           <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
               {/* Conteúdo */}
           </div>
       );
   }
   ```

3. **Exportar no barrel export (`index.ts`):**
   ```typescript
   export { MeuComponente } from './MeuComponente';
   ```

4. **Usar o componente:**
   ```typescript
   import { MeuComponente } from '@/components/features/[feature]';
   ```

## Padrões de Estilo:

- Usar classes Tailwind
- Suportar tema escuro com `dark:` prefix
- Cores principais: purple (primária), gray (neutras)
- Bordas arredondadas: `rounded-lg`
- Sombras: `shadow-sm`
- Background cards: `bg-white dark:bg-gray-800`
