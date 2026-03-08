'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Trophy, Sparkles, Plus } from '@/lib/icons'
import { Button } from '@/components/common'

const FRASES_MOTIVACIONAIS = [
  { texto: 'Não espere por oportunidades extraordinárias. Aproveite ocasiões comuns e torne-as grandes.', autor: 'Orison Swett Marden' },
  { texto: 'Faça o que puder, com o que você tem, onde você estiver.', autor: 'Theodore Roosevelt' },
  { texto: 'Pequenos detalhes têm o poder de mudar o rumo de um grande sonho.', autor: '' },
  { texto: 'O sucesso é a soma de pequenos esforços repetidos dia após dia.', autor: 'Robert Collier' },
  { texto: 'A persistência leva ao sucesso.', autor: '' },
  { texto: 'Quando estiver pronto para desistir, significa que você está mais perto dos seus objetivos do que pensa.', autor: 'Bob Parsons' },
  { texto: 'A força de vontade deve ser mais forte do que a habilidade.', autor: 'Muhammad Ali' },
  { texto: 'É fácil se posicionar no meio da multidão, mas é preciso coragem para se posicionar sozinho.', autor: 'Mahatma Gandhi' },
  { texto: 'A jornada mais longa começa com um único passo.', autor: 'Lao Tzu' },
]

function getFraseMotivacionalAleatoria() {
  return FRASES_MOTIVACIONAIS[Math.floor(Math.random() * FRASES_MOTIVACIONAIS.length)]
}

interface MetaBatidaModalProps {
  open: boolean
  onClose: () => void
  metaName?: string
  isMetaDiaria?: boolean
  onCreateNewMeta?: () => void
}

const PARTICLE_COUNT = 24
const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  id: i,
  angle: (360 / PARTICLE_COUNT) * i,
  delay: Math.random() * 0.3,
  color: ['#10b981', '#059669', '#34d399', '#6ee7b7'][i % 4],
}))

/**
 * Modal centralizado de parabéns quando uma meta é batida.
 * Exibe efeito de fogos de artifício e opção de criar nova meta.
 */
export function MetaBatidaModal({
  open,
  onClose,
  metaName,
  isMetaDiaria,
  onCreateNewMeta,
}: MetaBatidaModalProps) {
  const [fraseMotivacional, setFraseMotivacional] = useState(() => getFraseMotivacionalAleatoria())

  useEffect(() => {
    if (!open) return
    setFraseMotivacional(getFraseMotivacionalAleatoria())
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open || typeof document === 'undefined') return null

  const title = metaName || (isMetaDiaria ? 'Meta Diária de Contatos' : 'Meta')

  return createPortal(
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      {/* Fireworks container - behind the card */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute left-1/2 top-1/2 h-1 w-1 rounded-full opacity-0 animate-firework-particle"
            style={{
              '--angle': `${p.angle}deg`,
              '--delay': `${p.delay}s`,
              '--color': p.color,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Card central */}
      <div
        role="alertdialog"
        aria-labelledby="meta-batida-title"
        aria-describedby="meta-batida-desc"
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-gray-900/25 dark:border-gray-600 dark:bg-gray-800 dark:shadow-gray-950/50"
      >
        {/* Brilho sutil emerald */}
        <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-400/10" />
        <div className="absolute -left-12 -bottom-12 h-32 w-32 rounded-full bg-emerald-500/8 blur-2xl dark:bg-emerald-400/8" />

        <div className="relative px-6 py-8">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30 dark:from-emerald-600 dark:to-emerald-700">
              <Trophy className="h-8 w-8 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex items-center gap-2">
              <h2
                id="meta-batida-title"
                className="text-2xl font-bold text-gray-900 dark:text-white"
              >
                Parabéns!
              </h2>
              <Sparkles className="h-6 w-6 text-emerald-500 dark:text-emerald-400" />
            </div>
            <p
              id="meta-batida-desc"
              className="mt-2 text-base text-gray-600 dark:text-gray-300"
            >
              Você bateu a meta <span className="font-semibold text-gray-900 dark:text-white">{title}</span>!
            </p>
            <blockquote className="mt-3 text-sm italic text-gray-600 dark:text-gray-400">
              "{fraseMotivacional.texto}"
              {fraseMotivacional.autor && (
                <cite className="mt-1 block not-italic text-gray-500 dark:text-gray-500">
                  — {fraseMotivacional.autor}
                </cite>
              )}
            </blockquote>

            <div className="mt-6 flex w-full flex-col gap-3">
              {onCreateNewMeta && (
                <Button
                  onClick={() => {
                    onClose()
                    onCreateNewMeta()
                  }}
                  className="flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  Criar nova meta
                </Button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
