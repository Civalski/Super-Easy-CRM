'use client'

import { useEffect, useState } from 'react'
import type { LoginThemeAppearance } from './types'

const HEADLINES = [
  'Pipeline moderno de prospecção e retenção de clientes',
  'Mantenha o controle da sua empresa a qualquer hora, de qualquer lugar.',
]

const TYPING_SPEED_MS = 14
const DELETING_SPEED_MS = 10
const PAUSE_AFTER_TYPING_MS = 3000
const PAUSE_AFTER_DELETING_MS = 220

type LoginTypewriterHeadlineProps = {
  appearance: LoginThemeAppearance
}

export function LoginTypewriterHeadline({ appearance }: LoginTypewriterHeadlineProps) {
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [displayedText, setDisplayedText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isHolding, setIsHolding] = useState(false)

  useEffect(() => {
    const currentPhrase = HEADLINES[phraseIndex]

    const timeout = window.setTimeout(
      () => {
        if (isHolding) {
          setIsHolding(false)
          setIsDeleting(true)
          return
        }

        if (!isDeleting) {
          const nextText = currentPhrase.slice(0, displayedText.length + 1)
          setDisplayedText(nextText)

          if (nextText === currentPhrase) {
            setIsHolding(true)
          }

          return
        }

        const nextText = currentPhrase.slice(0, Math.max(displayedText.length - 1, 0))
        setDisplayedText(nextText)

        if (nextText.length === 0) {
          setIsDeleting(false)
          setPhraseIndex((currentIndex) => (currentIndex + 1) % HEADLINES.length)
        }
      },
      isHolding
        ? PAUSE_AFTER_TYPING_MS
        : isDeleting && displayedText.length === 0
          ? PAUSE_AFTER_DELETING_MS
          : isDeleting
            ? DELETING_SPEED_MS
            : TYPING_SPEED_MS,
    )

    return () => {
      window.clearTimeout(timeout)
    }
  }, [displayedText, isDeleting, isHolding, phraseIndex])

  return (
    <h1
      className={`crm-display min-h-[4.5rem] text-3xl font-semibold leading-tight sm:min-h-[5.5rem] sm:text-4xl lg:min-h-[8rem] lg:text-5xl ${appearance.heroTitle}`}
    >
      <span>{displayedText}</span>
      <span
        aria-hidden="true"
        className="ml-1 inline-block h-[0.95em] w-[0.08em] animate-pulse rounded-full bg-current align-[-0.08em]"
      />
    </h1>
  )
}
