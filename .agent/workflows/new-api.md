---
description: Como adicionar uma nova rota de API
---
# Criar Nova API Route

## Estrutura de uma API Route:

Criar arquivo em `/app/api/[recurso]/route.ts`:

```typescript
/**
 * Descrição da API
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/[recurso]
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const param = searchParams.get('param');
        
        // Lógica aqui
        const data = await prisma.modelo.findMany();
        
        return NextResponse.json(data);
    } catch (error) {
        console.error('Erro:', error);
        return NextResponse.json(
            { error: 'Mensagem de erro' },
            { status: 500 }
        );
    }
}

// POST /api/[recurso]
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        
        const data = await prisma.modelo.create({
            data: body
        });
        
        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        console.error('Erro:', error);
        return NextResponse.json(
            { error: 'Erro ao criar' },
            { status: 500 }
        );
    }
}

// DELETE /api/[recurso]
export async function DELETE(request: NextRequest) {
    try {
        // Lógica de exclusão
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erro:', error);
        return NextResponse.json(
            { error: 'Erro ao excluir' },
            { status: 500 }
        );
    }
}
```

## Para rotas dinâmicas:

Criar em `/app/api/[recurso]/[id]/route.ts`:

```typescript
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id } = params;
    // Usar o id
}
```

## Comunicando com Backend Python:

```typescript
const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

const response = await fetch(`${PYTHON_API_URL}/endpoint?${params}`, {
    signal: AbortSignal.timeout(30000), // 30s timeout
});
```
