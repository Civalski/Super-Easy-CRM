const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
    if (!fs.existsSync(src)) {
        console.warn(`Aviso: ${src} não existe, pulando...`);
        return;
    }
    
    fs.mkdirSync(dest, { recursive: true });
    let entries = fs.readdirSync(src, { withFileTypes: true });

    for (let entry of entries) {
        // Ignorar arquivos desnecessários
        if (entry.name === '.git' || entry.name === 'node_modules' && src.includes('standalone')) {
            continue;
        }
        
        let srcPath = path.join(src, entry.name);
        let destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

function copyNodeModule(moduleName, srcRoot, destRoot) {
    const srcPath = path.join(srcRoot, 'node_modules', moduleName);
    const destPath = path.join(destRoot, 'node_modules', moduleName);
    
    if (!fs.existsSync(srcPath)) {
        console.warn(`Aviso: Módulo ${moduleName} não encontrado em ${srcPath}`);
        return false;
    }
    
    if (fs.existsSync(destPath)) {
        console.log(`Módulo ${moduleName} já existe, pulando...`);
        return true;
    }
    
    console.log(`Copiando módulo ${moduleName}...`);
    copyDir(srcPath, destPath);
    return true;
}

const projectRoot = path.join(__dirname, '..');
const standaloneDir = path.join(projectRoot, '.next', 'standalone');

// Verificar se standalone existe
if (!fs.existsSync(standaloneDir)) {
    console.error(`Erro: Diretório standalone não encontrado em ${standaloneDir}`);
    console.error('Execute "npm run build" primeiro!');
    process.exit(1);
}

console.log('Preparando standalone...');
console.log(`Origem: ${projectRoot}`);
console.log(`Destino: ${standaloneDir}`);

// 1. Verificar se node_modules existe no standalone
const standaloneNodeModules = path.join(standaloneDir, 'node_modules');
const hasStandaloneNodeModules = fs.existsSync(standaloneNodeModules);
const standaloneNextModule = path.join(standaloneNodeModules, 'next');

console.log(`\nVerificando node_modules no standalone...`);
console.log(`Existe: ${hasStandaloneNodeModules}`);
console.log(`Módulo 'next' existe: ${fs.existsSync(standaloneNextModule)}`);

// 2. SEMPRE verificar e garantir que todas as dependências críticas estejam presentes
// Mesmo que o Next.js tenha gerado o node_modules, vamos garantir que está completo
const rootNodeModules = path.join(projectRoot, 'node_modules');
if (!fs.existsSync(rootNodeModules)) {
    console.error('\nERRO: node_modules não encontrado na raiz do projeto!');
    console.error('Execute "npm install" primeiro!');
    process.exit(1);
}

// Criar diretório node_modules se não existir
if (!fs.existsSync(standaloneNodeModules)) {
    fs.mkdirSync(standaloneNodeModules, { recursive: true });
}

// Lista de dependências críticas que DEVEM estar presentes
const criticalDeps = [
    'next',
    'react',
    'react-dom',
    '@prisma/client'
];

// Lista de todas as dependências de produção (do package.json)
const allProdDeps = [
    'next',
    'react',
    'react-dom',
    '@dnd-kit/core',
    '@dnd-kit/sortable',
    '@dnd-kit/utilities',
    '@prisma/client',
    'bcryptjs',
    'lucide-react',
    'react-hook-form',
    'sweetalert2',
    'zod'
];

// Verificar quais dependências críticas estão faltando
const missingDeps = [];
for (const dep of criticalDeps) {
    const depPath = path.join(standaloneNodeModules, dep);
    if (!fs.existsSync(depPath)) {
        missingDeps.push(dep);
    }
}

if (missingDeps.length > 0 || !fs.existsSync(standaloneNextModule)) {
    console.log('\n⚠️  Verificando e garantindo que todas as dependências estejam presentes...');
    
    // Copiar todas as dependências críticas (mesmo que já existam, garantir que estão completas)
    console.log('\nGarantindo dependências críticas...');
    for (const dep of criticalDeps) {
        const depPath = path.join(standaloneNodeModules, dep);
        // Sempre copiar para garantir que está completo e atualizado
        if (!copyNodeModule(dep, projectRoot, standaloneDir)) {
            console.error(`ERRO: Não foi possível copiar ${dep}`);
            // Tentar copiar novamente forçadamente
            const rootDep = path.join(rootNodeModules, dep);
            if (fs.existsSync(rootDep)) {
                console.log(`Tentando copiar ${dep} forçadamente...`);
                copyDir(rootDep, depPath);
            }
        }
    }
    
    // Copiar todas as outras dependências de produção
    console.log('\nGarantindo outras dependências de produção...');
    for (const dep of allProdDeps) {
        if (!criticalDeps.includes(dep)) {
            copyNodeModule(dep, projectRoot, standaloneDir);
        }
    }
    
    // Verificação final crítica: garantir que 'next' está presente e completo
    if (!fs.existsSync(standaloneNextModule)) {
        console.error('\n❌ ERRO CRÍTICO: Módulo "next" ainda não encontrado após cópia!');
        console.error('Tentando copiar node_modules/next completo...');
        
        const rootNext = path.join(rootNodeModules, 'next');
        if (fs.existsSync(rootNext)) {
            console.log('Copiando node_modules/next completo...');
            // Remover se existir parcialmente
            if (fs.existsSync(standaloneNextModule)) {
                fs.rmSync(standaloneNextModule, { recursive: true, force: true });
            }
            copyDir(rootNext, standaloneNextModule);
        } else {
            console.error('ERRO: Módulo "next" não encontrado nem na raiz!');
            console.error('Execute "npm install" e "npm run build" novamente.');
            process.exit(1);
        }
    }
    
    // Verificação final: garantir que next/package.json existe
    const nextPackageJson = path.join(standaloneNextModule, 'package.json');
    if (!fs.existsSync(nextPackageJson)) {
        console.error('\n❌ ERRO: next/package.json não encontrado! O módulo next está incompleto.');
        const rootNextPackageJson = path.join(rootNodeModules, 'next', 'package.json');
        if (fs.existsSync(rootNextPackageJson)) {
            console.log('Copiando next completo novamente...');
            fs.rmSync(standaloneNextModule, { recursive: true, force: true });
            copyDir(path.join(rootNodeModules, 'next'), standaloneNextModule);
        } else {
            console.error('ERRO: next/package.json não encontrado nem na raiz!');
            process.exit(1);
        }
    }
    
    console.log('\n✅ Dependências verificadas e garantidas!');
} else {
    console.log('\n✅ Todas as dependências críticas já estão presentes.');
}

// 3. Copiar public
console.log('\nCopiando public...');
copyDir(path.join(projectRoot, 'public'), path.join(standaloneDir, 'public'));

// 4. Copiar .next/static para .next/standalone/.next/static
console.log('Copiando .next/static...');
const staticSrc = path.join(projectRoot, '.next', 'static');
const staticDest = path.join(standaloneDir, '.next', 'static');
if (fs.existsSync(staticSrc)) {
    copyDir(staticSrc, staticDest);
} else {
    console.warn('Aviso: .next/static não encontrado');
}

console.log('\n✅ Preparação standalone concluída!');
