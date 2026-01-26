# 🔧 Solução: ERR_CONNECTION_REFUSED - Módulo 'next' não encontrado

## 📋 Problema Identificado

O erro `ERR_CONNECTION_REFUSED` ocorre porque o servidor Next.js standalone não consegue iniciar devido ao módulo `next` não estar presente no diretório `standalone/node_modules`.

**Erro no log:**
```
Error: Cannot find module 'next'
Require stack:
- C:\Users\PC\AppData\Local\Programs\Arker CRM\resources\standalone\server.js
```

## ✅ Solução Implementada

O script `scripts/prepare-standalone.js` foi atualizado para:

1. **Verificar** se o `node_modules` existe no standalone
2. **Detectar** se o módulo `next` está presente
3. **Copiar automaticamente** todas as dependências necessárias do projeto raiz para o standalone
4. **Garantir** que o módulo `next` e outras dependências críticas estejam presentes

## 🚀 Como Corrigir o Problema

### Opção 1: Rebuild Completo (Recomendado)

Execute um rebuild completo do instalador:

```powershell
cd "d:\Projetos\Arker CRM"
.\scripts\build-all.ps1
```

Este comando irá:
1. Compilar o backend Python
2. Fazer build do Next.js
3. Preparar o standalone (com as correções)
4. Gerar o novo instalador

### Opção 2: Rebuild Apenas do Frontend

Se você já tem o backend compilado:

```powershell
cd "d:\Projetos\Arker CRM"
.\scripts\build-all.ps1 -SkipBackend
```

### Opção 3: Build Manual

Se preferir fazer manualmente:

```powershell
# 1. Build do Next.js
npm run build

# 2. Preparar standalone (com as correções)
node scripts/prepare-standalone.js

# 3. Gerar instalador
npx electron-builder --win
```

## 🔍 Verificação

Após o build, verifique se o standalone foi preparado corretamente:

```powershell
# Verificar se o módulo 'next' existe no standalone
Test-Path ".next\standalone\node_modules\next"
```

Deve retornar `True`.

## 📝 O que foi corrigido

### Arquivo: `scripts/prepare-standalone.js`

**Melhorias implementadas:**

1. ✅ Verificação automática de `node_modules` no standalone
2. ✅ Detecção de módulos faltantes (especialmente `next`)
3. ✅ Cópia automática de dependências críticas:
   - `next`
   - `react`
   - `react-dom`
   - `@prisma/client`
   - E todas as outras dependências de produção
4. ✅ Mensagens de erro mais claras e informativas
5. ✅ Validação final para garantir que o módulo `next` foi copiado

## ⚠️ Prevenção Futura

Para evitar que este problema ocorra novamente:

1. **Sempre execute** `npm install` antes de fazer o build
2. **Verifique** se o build do Next.js foi concluído com sucesso
3. **Execute** o script `prepare-standalone.js` após cada build
4. **Use** o script `build-all.ps1` que automatiza todo o processo

## 🐛 Troubleshooting

### Se o erro persistir:

1. **Limpe o cache do Next.js:**
   ```powershell
   Remove-Item -Recurse -Force .next
   npm run build
   ```

2. **Reinstale as dependências:**
   ```powershell
   Remove-Item -Recurse -Force node_modules
   npm install
   npm run build
   ```

3. **Verifique se o Next.js está instalado:**
   ```powershell
   npm list next
   ```

4. **Verifique a versão do Node.js:**
   ```powershell
   node --version
   ```
   Deve ser v18+ ou v20+

## 📞 Suporte

Se o problema persistir após seguir estas instruções:

1. Verifique o log completo em: `C:\Users\PC\AppData\Roaming\arker-crm\server.log`
2. Verifique se todos os arquivos foram copiados corretamente no diretório de instalação
3. Tente reinstalar o aplicativo completamente

---

**Última atualização:** 26/01/2026
**Versão do script:** 2.0 (com correções de dependências)
