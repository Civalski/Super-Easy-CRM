import { useState, useEffect } from 'react';

// URL pública do version.json no Google Drive
// Para obter: Compartilhe o arquivo > "Qualquer pessoa com o link" > Copie o link
// Converta: https://drive.google.com/file/d/FILE_ID/view 
// Para: https://drive.google.com/uc?export=download&id=FILE_ID
const REMOTE_VERSION_URL = process.env.NEXT_PUBLIC_VERSION_URL || '';

// Versão local do sistema (do package.json)
const LOCAL_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0';

interface VersionInfo {
    version: string;
    releaseDate?: string;
    downloadUrl?: string;
    changelog?: string;
}

interface UseVersionCheckResult {
    needsUpdate: boolean;
    currentVersion: string;
    latestVersion: string | null;
    downloadUrl: string | null;
    changelog: string | null;
    loading: boolean;
    error: string | null;
    checkNow: () => Promise<void>;
    dismissUpdate: () => void;
    isDismissed: boolean;
}

// Compara versões semânticas (ex: "0.1.0" vs "0.2.0")
function compareVersions(current: string, latest: string): number {
    const currentParts = current.split('.').map(Number);
    const latestParts = latest.split('.').map(Number);

    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
        const currentPart = currentParts[i] || 0;
        const latestPart = latestParts[i] || 0;

        if (latestPart > currentPart) return 1;  // Atualização disponível
        if (latestPart < currentPart) return -1; // Versão local é mais nova
    }

    return 0; // Versões iguais
}

export function useVersionCheck(): UseVersionCheckResult {
    const [latestVersion, setLatestVersion] = useState<string | null>(null);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [changelog, setChangelog] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDismissed, setIsDismissed] = useState(false);

    const checkVersion = async () => {
        // Se não há URL configurada, não faz nada
        if (!REMOTE_VERSION_URL) {
            setLoading(false);
            setError('URL de versão não configurada');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(REMOTE_VERSION_URL, {
                cache: 'no-store', // Sempre busca a versão mais recente
            });

            if (!response.ok) {
                throw new Error(`Erro ao buscar versão: ${response.status}`);
            }

            const data: VersionInfo = await response.json();

            setLatestVersion(data.version);
            setDownloadUrl(data.downloadUrl || null);
            setChangelog(data.changelog || null);
        } catch (err) {
            console.error('Erro ao verificar atualização:', err);
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
        } finally {
            setLoading(false);
        }
    };

    const dismissUpdate = () => {
        setIsDismissed(true);
        // Salva no localStorage para não mostrar novamente nesta sessão
        if (latestVersion) {
            localStorage.setItem('dismissedVersion', latestVersion);
        }
    };

    useEffect(() => {
        // Verifica se já foi dispensado
        const dismissedVersion = localStorage.getItem('dismissedVersion');
        if (dismissedVersion) {
            setIsDismissed(true);
        }

        checkVersion();
    }, []);

    // Determina se precisa atualizar
    const needsUpdate = latestVersion
        ? compareVersions(LOCAL_VERSION, latestVersion) > 0
        : false;

    // Se a versão dispensada é diferente da nova versão, mostra novamente
    useEffect(() => {
        if (latestVersion) {
            const dismissedVersion = localStorage.getItem('dismissedVersion');
            if (dismissedVersion !== latestVersion) {
                setIsDismissed(false);
            }
        }
    }, [latestVersion]);

    return {
        needsUpdate,
        currentVersion: LOCAL_VERSION,
        latestVersion,
        downloadUrl,
        changelog,
        loading,
        error,
        checkNow: checkVersion,
        dismissUpdate,
        isDismissed,
    };
}
