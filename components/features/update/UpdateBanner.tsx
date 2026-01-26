'use client';

import { useVersionCheck } from '@/lib/hooks/useVersionCheck';
import { Download, X, RefreshCw, AlertTriangle } from 'lucide-react';

export function UpdateBanner() {
    const {
        needsUpdate,
        currentVersion,
        latestVersion,
        downloadUrl,
        changelog,
        loading,
        isDismissed,
        dismissUpdate,
        checkNow
    } = useVersionCheck();

    // Não mostra nada se estiver carregando, não precisar atualizar, ou foi dispensado
    if (loading || !needsUpdate || isDismissed) {
        return null;
    }

    const handleDownload = () => {
        if (downloadUrl) {
            window.open(downloadUrl, '_blank');
        }
    };

    return (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white px-4 py-2.5 shadow-lg">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                {/* Ícone e Mensagem */}
                <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 p-1.5 bg-white/20 rounded-lg">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <span className="font-semibold text-sm">
                            Nova versão disponível!
                        </span>
                        <span className="text-xs sm:text-sm text-white/90">
                            Você está na v{currentVersion} → v{latestVersion} disponível
                        </span>
                    </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2">
                    {/* Botão de Download */}
                    {downloadUrl && (
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-orange-600 
                         rounded-lg text-sm font-medium hover:bg-orange-50 
                         transition-colors shadow-sm"
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Baixar Atualização</span>
                            <span className="sm:hidden">Baixar</span>
                        </button>
                    )}

                    {/* Botão de Verificar Novamente */}
                    <button
                        onClick={checkNow}
                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                        title="Verificar novamente"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>

                    {/* Botão de Fechar */}
                    <button
                        onClick={dismissUpdate}
                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                        title="Fechar (não mostrar novamente para esta versão)"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Changelog expandido (opcional) */}
            {changelog && (
                <details className="max-w-7xl mx-auto mt-2">
                    <summary className="text-xs text-white/80 cursor-pointer hover:text-white">
                        Ver novidades desta versão
                    </summary>
                    <div className="mt-2 p-3 bg-white/10 rounded-lg text-sm whitespace-pre-line">
                        {changelog}
                    </div>
                </details>
            )}
        </div>
    );
}
