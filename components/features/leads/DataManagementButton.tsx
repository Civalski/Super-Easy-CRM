'use client';

import { useState, useEffect } from 'react';
import { Database, FolderOpen, Download, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Swal from 'sweetalert2';

interface DataStatus {
    exists: boolean;
    files_count: number;
    path: string;
}

export function DataManagementButton() {
    const [status, setStatus] = useState<DataStatus | null>(null);
    const [loading, setLoading] = useState(false);

    const checkStatus = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:5000';
            const res = await fetch(`${apiUrl}/system/data-status`);
            if (res.ok) {
                const data = await res.json();
                setStatus(data);
            }
        } catch (error) {
            console.error('Erro ao verificar status dos dados:', error);
        }
    };

    const openFolder = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:5000';
            const res = await fetch(`${apiUrl}/system/open-data-folder`, { method: 'POST' });
            if (!res.ok) throw new Error('Falha ao abrir pasta');
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Erro',
                text: 'Não foi possível abrir a pasta automaticamente.',
            });
        }
    };

    const handleManage = async () => {
        const result = await Swal.fire({
            title: 'Gerenciar Base de Dados',
            html: `
                <div class="text-left text-sm space-y-4">
                    <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <p class="font-medium mb-1">Status Atual:</p>
                        ${status?.exists && status.files_count > 0
                    ? `<p class="text-green-600 flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-green-500"></span> Dados Encontrados (${status.files_count} arquivos)</p>`
                    : `<p class="text-amber-600 flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-amber-500"></span> Base incompleta ou vazia</p>`
                }
                        <p class="text-xs text-gray-500 mt-1 break-all">${status?.path || ''}</p>
                    </div>

                    <div>
                        <p class="font-medium mb-2">Ações:</p>
                        <p class="text-gray-600 dark:text-gray-400">Para adicionar novos estados/módulos, baixe os arquivos .parquet e coloque na pasta de dados.</p>
                    </div>
                </div>
            `,
            showDenyButton: true,
            showCancelButton: true,
            confirmButtonText: 'Abrir Pasta de Dados',
            denyButtonText: 'Baixar Módulos',
            cancelButtonText: 'Fechar',
            confirmButtonColor: '#6366f1',
            denyButtonColor: '#10b981',
            customClass: {
                popup: 'dark:bg-gray-900 dark:text-white',
                htmlContainer: '!text-left'
            }
        });

        if (result.isConfirmed) {
            openFolder();
        } else if (result.isDenied) {
            // Abrir link de download (configurado no version.json ou fixo)
            const downloadUrl = process.env.NEXT_PUBLIC_DATA_DOWNLOAD_URL;
            if (downloadUrl) {
                window.open(downloadUrl, '_blank');
            } else {
                Swal.fire('Info', 'Link de download não configurado. Contate o suporte.', 'info');
            }
        }
    };

    useEffect(() => {
        checkStatus();
    }, []);

    if (!status) return null;

    const hasData = status.exists && status.files_count > 0;

    return (
        <button
            onClick={handleManage}
            className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors
                ${hasData
                    ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-100'
                }
            `}
            title={hasData ? "Gerenciar Dados" : "Instalar Base de Dados"}
        >
            {hasData ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : (
                <AlertTriangle className="w-4 h-4" />
            )}
            <span>{hasData ? 'Dados' : 'Instalar Dados'}</span>
        </button>
    );
}
