import Link from 'next/link'
import { PLANOS_PAGE_URL } from './constants'

export function PlanosLandingFooter() {
  return (
    <footer className="planos-footer">
      <div
        style={{
          maxWidth: 1152,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
          fontSize: 12,
          color: '#64748B',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#38BDF8',
              boxShadow: '0 0 6px rgba(56,189,248,0.9)',
              display: 'inline-block',
            }}
          />
          <span style={{ color: '#94A3B8' }}>Arker CRM Premium</span>
        </div>
        <Link href={PLANOS_PAGE_URL} className="footer-link">
          Atualizar esta pagina ↗
        </Link>
      </div>
    </footer>
  )
}
