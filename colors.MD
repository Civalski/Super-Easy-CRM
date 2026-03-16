# Padrao de Cores do Projeto

Este arquivo documenta o padrao atual de cores para os dois temas principais do CRM: `claro` e `escuro`.

As referencias principais usadas hoje estao em:
- `app/globals.css`
- `components/features/login/constants.ts`
- `components/common/Button.tsx`

## Tema Claro

### Base
- Background principal: `#e2e8f0`
- Foreground principal: `#0f172a`
- Color scheme: `light`

### Shell / Layout
- Fundo do shell: `rgba(226, 232, 240, 0.98)`
- Borda do shell: `rgba(148, 163, 184, 0.35)`

### Cards / Superficies
- Fundo de card principal: `rgba(255, 255, 255, 0.9)`
- Borda de card principal: `rgba(148, 163, 184, 0.3)`
- Sombra de card: `0 22px 48px -36px rgba(15, 23, 42, 0.6)`
- Hover de card: `0 22px 54px -32px rgba(99, 102, 241, 0.24)`
- Card soft: `rgba(248, 251, 255, 0.68)`

### Tabelas
- Header de tabela: `rgba(241, 245, 249, 0.78)`
- Borda inferior do header: `rgba(148, 163, 184, 0.28)`

### Inputs
- Fundo: `rgba(255, 255, 255, 0.88)`
- Borda: `#e2e8f0`
- Texto: `#0f172a`
- Placeholder: `#94a3b8`
- Focus border: `#0ea5e9` / classe `sky-500`
- Focus ring: `rgba(14, 165, 233, 0.2)`

### Textos
- Texto principal: `#0f172a`
- Labels secundarios: `#334155` / `slate-700`
- Texto auxiliar: `#64748b` / `slate-500`
- Links principais: `#0369a1` / `sky-700`
- Hover de link: `#075985` / `sky-800`

### Acentos
- Azul claro / foco: `sky-500`
- Azul de link: `sky-700`
- Roxo de hover/sombra compartilhada: `indigo-500`
- Alertas:
  - Erro: fundo `red-50/90`, texto `red-700`, borda `red-200`
  - Aviso: texto `amber-700`

### Login / Register no Tema Claro
- Fundo geral: `linear-gradient(180deg, #fff7ed 0%, #eff6ff 44%, #e0f2fe 100%)`
- Glow principal: laranja suave + azul suave
- Hero lateral: `linear-gradient(145deg, #082f49 0%, #1d4ed8 44%, #312e81 100%)`
- Card do formulario: `bg-white/72` com `border-white/70`

### Botoes
- Primario no claro:
  - Fundo: `purple-50`
  - Texto: `purple-700`
  - Borda: `purple-300`
  - Hover: `purple-100`
- Secundario no claro:
  - Fundo: `white`
  - Texto: `gray-700`
  - Borda: `gray-300`
  - Hover: `gray-100`

## Tema Escuro

### Base
- Background principal: `#0b1220`
- Foreground principal: `#e2e8f0`
- Color scheme: `dark`

### Shell / Layout
- Fundo do shell: `rgba(15, 23, 42, 0.72)`
- Borda do shell: `rgba(100, 116, 139, 0.3)`

### Cards / Superficies
- Fundo de card principal: `rgba(15, 23, 42, 0.75)`
- Borda de card principal: `rgba(100, 116, 139, 0.4)`
- Sombra de card: `0 22px 48px -36px rgba(2, 6, 23, 0.94)`
- Hover de card: `0 22px 54px -32px rgba(99, 102, 241, 0.18)`
- Card soft: `rgba(15, 23, 42, 0.62)`

### Tabelas
- Header de tabela: `rgba(15, 23, 42, 0.74)`
- Borda inferior do header: `rgba(100, 116, 139, 0.32)`

### Inputs
- Fundo: `rgba(2, 6, 23, 0.55)` / `slate-950/55`
- Borda: `slate-600/70`
- Texto: `slate-100`
- Placeholder: `slate-400/90`
- Focus border: `indigo-400`
- Focus ring: `rgba(129, 140, 248, 0.25)`

### Textos
- Texto principal: `white` / `slate-100`
- Labels secundarios: `slate-200`
- Texto auxiliar: `slate-400`
- Links principais: `indigo-300`
- Hover de link: `indigo-200`

### Acentos
- Azul-indigo principal: `indigo-400` a `indigo-300`
- Roxo profundo no hero/login: `#2e1065`
- Ciano de glow: `rgba(56, 189, 248, 0.18)`
- Alertas:
  - Erro: fundo `red-500/10`, texto `red-200`, borda `red-400/40`
  - Aviso: texto `amber-300`

### Login / Register no Tema Escuro
- Fundo geral: `slate-950`
- Hero lateral: `linear-gradient(145deg, #2e1065 0%, #020617 58%, #000000 100%)`
- Glows laterais: roxo / violeta
- Card do formulario: `bg-slate-800/65` com `border-slate-600/70`

### Botoes
- Primario no escuro:
  - Fundo: `purple-900/30`
  - Texto: `purple-200`
  - Borda: `purple-600`
  - Hover: `purple-800`
- Secundario no escuro:
  - Fundo: `gray-800`
  - Texto: `gray-200`
  - Borda: `gray-600`
  - Hover: `gray-700`

## Regra Pratica

Ao criar novas telas:
- Tema claro deve priorizar `slate`, `sky`, `white` e acentos suaves.
- Tema escuro deve priorizar `slate`, `indigo`, `purple` e superfícies translúcidas.
- Inputs e cards devem sempre usar contraste alto entre fundo, texto e borda.
- Links devem mudar entre `sky` no claro e `indigo` no escuro.
- Estados de erro e aviso devem manter o mesmo tom sem reinventar paleta por tela.
