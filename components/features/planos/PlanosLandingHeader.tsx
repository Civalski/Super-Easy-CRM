import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from '@/lib/icons'

export function PlanosLandingHeader() {
  return (
    <header className="planos-header">
      <div className="planos-header-inner">
        <Link href="/dashboard" className="planos-logo-wrap">
          <span className="planos-logo-chip">
            <Image
              src="/arker-a.png"
              alt="Arker CRM"
              width={32}
              height={32}
              className="h-7 w-7 object-contain"
              priority
            />
          </span>
          <span className="planos-logo-copy">
            <span className="planos-logo-title">Arker CRM</span>
            <span className="planos-logo-subtitle">Planos premium oficiais</span>
          </span>
        </Link>

        <Link href="/configuracoes" className="back-link">
          <ArrowLeft style={{ width: 14, height: 14 }} />
          Voltar para configuracoes
        </Link>
      </div>
    </header>
  )
}
