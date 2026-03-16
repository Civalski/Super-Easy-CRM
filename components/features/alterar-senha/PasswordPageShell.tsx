'use client'

import Image from 'next/image'
import Link from 'next/link'

type PasswordPageShellProps = {
  title: string
  description: string
  children: React.ReactNode
  footerLinkHref?: string
  footerLinkLabel?: string
}

export function PasswordPageShell({
  title,
  description,
  children,
  footerLinkHref,
  footerLinkLabel,
}: PasswordPageShellProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-8">
      <div className="mb-8 flex justify-center">
        <Image
          src="/arker10.png"
          alt="Arker CRM"
          width={180}
          height={48}
          className="h-10 w-auto object-contain"
        />
      </div>

      <div className="w-full max-w-md rounded-2xl border border-slate-600/70 bg-slate-800/65 p-6 shadow-2xl shadow-slate-950/30">
        <h1 className="mb-2 text-lg font-semibold text-slate-200">{title}</h1>
        <p className="mb-6 text-sm text-slate-400">{description}</p>

        {children}

        {footerLinkHref && footerLinkLabel ? (
          <p className="mt-6 text-center text-sm text-slate-400">
            <Link
              href={footerLinkHref}
              className="font-medium text-indigo-300 transition hover:text-indigo-200"
            >
              {footerLinkLabel}
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  )
}
