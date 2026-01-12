/**
 * Gráfico de oportunidades por status
 */
'use client'

interface OportunidadesPorStatus {
    status: string
    _count: number
}

interface OportunidadesChartProps {
    data: OportunidadesPorStatus[]
    totalOportunidades: number
}

export function OportunidadesChart({ data, totalOportunidades }: OportunidadesChartProps) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Oportunidades por Status
            </h3>
            <div className="space-y-3">
                {data.map((item) => (
                    <div key={item.status} className="flex items-center justify-between">
                        <span className="capitalize text-gray-700 dark:text-gray-300">
                            {item.status.replace('_', ' ')}
                        </span>
                        <div className="flex items-center gap-3">
                            <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{
                                        width: `${totalOportunidades > 0 ? (item._count / totalOportunidades) * 100 : 0}%`,
                                    }}
                                ></div>
                            </div>
                            <span className="font-semibold text-gray-900 dark:text-white w-8 text-right">
                                {item._count}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
