import { PrismaClient } from '@prisma/client'
import path from 'path'
import fs from 'fs'
import os from 'os'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Função para determinar o caminho do banco de dados
function getDatabasePath(): string {
  // 1. Verificar se DATABASE_URL está configurada explicitamente
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('file:')) {
    return process.env.DATABASE_URL
  }

  // 2. Determinar o diretório base baseado no ambiente
  let baseDir: string
  
  // Verificar se está rodando em produção instalado
  // Quando instalado, o processo pode estar rodando de um diretório diferente
  const isProduction = process.env.NODE_ENV === 'production'
  const cwd = process.cwd()
  
  // Se o cwd contém "Program Files" ou "AppData" ou está em um caminho de instalação,
  // ou se NODE_ENV é production, usar AppData
  const isInstalled = isProduction || 
    cwd.includes('Program Files') || 
    cwd.includes('AppData') ||
    cwd.includes('Arker CRM')
  
  if (isInstalled) {
    // Em produção/instalado: usar AppData do usuário
    const appData = process.env.APPDATA || os.homedir()
    baseDir = path.join(appData, 'ArkerCRM')
    
    // Criar o diretório se não existir
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true })
    }
  } else {
    // Em desenvolvimento: usar o diretório do projeto
    baseDir = process.cwd()
  }
  
  // 3. Caminho completo do banco de dados
  const dbPath = path.join(baseDir, 'database.db')
  
  // 4. Criar o diretório pai se não existir
  const dbDir = path.dirname(dbPath)
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }
  
  // 5. Garantir que o diretório existe e tem permissões
  try {
    if (!fs.existsSync(dbDir)) {
      console.log('📁 Criando diretório do banco:', dbDir)
      fs.mkdirSync(dbDir, { recursive: true })
    }
    
    // Testar se podemos escrever no diretório
    const testFile = path.join(dbDir, '.test-write')
    try {
      fs.writeFileSync(testFile, 'test')
      fs.unlinkSync(testFile)
      console.log('✅ Permissões de escrita OK no diretório:', dbDir)
    } catch (writeError) {
      console.error('❌ Erro ao testar escrita no diretório:', writeError)
      throw new Error(`Sem permissão para escrever em: ${dbDir}`)
    }
  } catch (dirError) {
    console.error('❌ Erro ao criar/verificar diretório:', dirError)
    throw dirError
  }
  
  // 6. Retornar a URL formatada para SQLite
  const databaseUrl = `file:${dbPath.replace(/\\/g, '/')}`
  
  console.log('📁 Caminho do banco de dados:', databaseUrl)
  console.log('📁 Caminho absoluto:', dbPath)
  
  return databaseUrl
}

// Obter o caminho do banco de dados
const databaseUrl = getDatabasePath()

// Definir a variável de ambiente para o Prisma
process.env.DATABASE_URL = databaseUrl

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Função para inicializar o banco de dados (aplicar schema se necessário)
let dbInitialized = false
let initializationPromise: Promise<void> | null = null

export async function ensureDatabaseInitialized() {
  if (dbInitialized) return
  
  // Se já está inicializando, aguardar
  if (initializationPromise) {
    await initializationPromise
    return
  }
  
  initializationPromise = (async () => {
    // Extrair o caminho do arquivo do databaseUrl (fora do try para estar disponível no catch)
    const dbUrl = databaseUrl.replace(/^file:/, '')
    const dbPath = dbUrl.replace(/\//g, path.sep)
    
    try {
      console.log('📁 Verificando banco de dados em:', dbPath)
      
      // Verificar se o diretório existe e tem permissões
      const dbDir = path.dirname(dbPath)
      if (!fs.existsSync(dbDir)) {
        console.log('📁 Criando diretório do banco:', dbDir)
        fs.mkdirSync(dbDir, { recursive: true })
      }
      
      // Verificar se o arquivo do banco existe
      const dbExists = fs.existsSync(dbPath)
      
      if (!dbExists) {
        console.log('🔄 Arquivo do banco não existe. Criando arquivo vazio...')
        try {
          // Criar arquivo vazio para que o SQLite possa abrir
          fs.writeFileSync(dbPath, '')
          console.log('✅ Arquivo do banco criado com sucesso')
        } catch (createError: any) {
          console.error('❌ Erro ao criar arquivo do banco:', createError)
          throw new Error(`Não foi possível criar o arquivo do banco em: ${dbPath}. Erro: ${createError.message}`)
        }
      } else {
        console.log('✅ Arquivo do banco já existe')
      }
      
      // Verificar permissões do arquivo
      try {
        fs.accessSync(dbPath, fs.constants.R_OK | fs.constants.W_OK)
        console.log('✅ Permissões de leitura/escrita OK no arquivo do banco')
      } catch (permError) {
        console.error('❌ Sem permissão para acessar o arquivo do banco:', permError)
        throw new Error(`Sem permissão para acessar o arquivo do banco: ${dbPath}`)
      }
      
      // Tentar conectar e verificar se tem tabelas
      let tableCount = 0
      try {
        console.log('🔄 Verificando tabelas no banco...')
        const result = await prisma.$queryRaw<Array<{ count: number }>>`
          SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
        `
        tableCount = result[0]?.count || 0
        console.log(`📊 Tabelas encontradas: ${tableCount}`)
      } catch (queryError: any) {
        // Se falhar, pode ser que o banco esteja corrompido ou vazio
        console.log('⚠️ Erro ao verificar tabelas, assumindo banco vazio:', queryError.message)
        console.log('⚠️ Código do erro:', queryError.code)
        tableCount = 0
      }
      
      if (tableCount === 0) {
        console.log('🔄 Banco de dados vazio detectado. Aplicando schema...')
      
      // Aplicar o schema usando SQL direto do schema.prisma
      // Como não podemos usar Prisma Migrate em runtime, vamos criar as tabelas manualmente
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ambientes" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "nome" TEXT NOT NULL,
          "descricao" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL
        );
        
        CREATE TABLE IF NOT EXISTS "clientes" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "nome" TEXT NOT NULL,
          "email" TEXT UNIQUE,
          "telefone" TEXT,
          "empresa" TEXT,
          "endereco" TEXT,
          "cidade" TEXT,
          "estado" TEXT,
          "cep" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL
        );
        
        CREATE TABLE IF NOT EXISTS "contatos" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "nome" TEXT NOT NULL,
          "email" TEXT,
          "telefone" TEXT,
          "cargo" TEXT,
          "clienteId" TEXT NOT NULL,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL,
          FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
        
        CREATE TABLE IF NOT EXISTS "oportunidades" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "titulo" TEXT NOT NULL,
          "descricao" TEXT,
          "valor" REAL,
          "status" TEXT NOT NULL DEFAULT 'prospeccao',
          "probabilidade" INTEGER NOT NULL DEFAULT 0,
          "dataFechamento" DATETIME,
          "clienteId" TEXT NOT NULL,
          "ambienteId" TEXT NOT NULL,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL,
          FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          FOREIGN KEY ("ambienteId") REFERENCES "ambientes"("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
        
        CREATE TABLE IF NOT EXISTS "tarefas" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "titulo" TEXT NOT NULL,
          "descricao" TEXT,
          "status" TEXT NOT NULL DEFAULT 'pendente',
          "prioridade" TEXT NOT NULL DEFAULT 'media',
          "dataVencimento" DATETIME,
          "clienteId" TEXT,
          "oportunidadeId" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL,
          FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          FOREIGN KEY ("oportunidadeId") REFERENCES "oportunidades"("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
        
        CREATE TABLE IF NOT EXISTS "prospectos" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "cnpj" TEXT NOT NULL UNIQUE,
          "cnpjBasico" TEXT NOT NULL,
          "cnpjOrdem" TEXT NOT NULL,
          "cnpjDv" TEXT NOT NULL,
          "razaoSocial" TEXT NOT NULL,
          "nomeFantasia" TEXT,
          "capitalSocial" TEXT,
          "porte" TEXT,
          "naturezaJuridica" TEXT,
          "situacaoCadastral" TEXT,
          "dataAbertura" TEXT,
          "matrizFilial" TEXT,
          "cnaePrincipal" TEXT,
          "cnaePrincipalDesc" TEXT,
          "cnaesSecundarios" TEXT,
          "tipoLogradouro" TEXT,
          "logradouro" TEXT,
          "numero" TEXT,
          "complemento" TEXT,
          "bairro" TEXT,
          "cep" TEXT,
          "municipio" TEXT NOT NULL,
          "uf" TEXT NOT NULL,
          "telefone1" TEXT,
          "telefone2" TEXT,
          "fax" TEXT,
          "email" TEXT,
          "status" TEXT NOT NULL DEFAULT 'novo',
          "observacoes" TEXT,
          "prioridade" INTEGER NOT NULL DEFAULT 0,
          "lote" TEXT,
          "dataImportacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "ultimoContato" DATETIME,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL,
          "clienteId" TEXT UNIQUE,
          FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE
        );
        
        CREATE INDEX IF NOT EXISTS "contatos_clienteId_idx" ON "contatos"("clienteId");
        CREATE INDEX IF NOT EXISTS "oportunidades_clienteId_idx" ON "oportunidades"("clienteId");
        CREATE INDEX IF NOT EXISTS "oportunidades_ambienteId_idx" ON "oportunidades"("ambienteId");
        CREATE INDEX IF NOT EXISTS "tarefas_clienteId_idx" ON "tarefas"("clienteId");
        CREATE INDEX IF NOT EXISTS "tarefas_oportunidadeId_idx" ON "tarefas"("oportunidadeId");
        CREATE INDEX IF NOT EXISTS "prospectos_clienteId_idx" ON "prospectos"("clienteId");
      `)
      
        console.log('✅ Schema aplicado com sucesso!')
      } else {
        console.log('✅ Banco de dados já inicializado')
      }
      
      dbInitialized = true
      initializationPromise = null
    } catch (error: any) {
      console.error('❌ Erro ao inicializar banco de dados:', error)
      console.error('Detalhes:', {
        message: error.message,
        code: error.code,
        path: dbPath
      })
      initializationPromise = null
      // Não lançar erro para não quebrar a aplicação
      // Mas marcar como não inicializado para tentar novamente
      dbInitialized = false
    }
  })()
  
  await initializationPromise
}

// Função helper para garantir que o banco está inicializado antes de usar
export async function withInitializedDb<T>(fn: () => Promise<T>): Promise<T> {
  await ensureDatabaseInitialized()
  return fn()
}

// Inicializar o banco de forma assíncrona (não bloqueia)
if (typeof window === 'undefined') {
  // Apenas no servidor
  ensureDatabaseInitialized().catch((error) => {
    console.error('Erro ao inicializar banco de dados:', error)
  })
}

