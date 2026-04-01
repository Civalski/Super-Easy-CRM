import { ArrowRight, CheckCircle2 } from '@/lib/icons'
import { HERO_BULLETS, PREMIUM_COUPON_CODE } from './constants'
import type { PremiumPlanDefinition } from './types'

type PlanosLandingHeroProps = {
  onStripeAction: (plan: PremiumPlanDefinition) => void | Promise<void>
  soloPlan: PremiumPlanDefinition
  stripeLoading: boolean
}

export function PlanosLandingHero({
  onStripeAction,
  soloPlan,
  stripeLoading,
}: PlanosLandingHeroProps) {
  return (
    <section
      style={{ display: 'grid', gap: 40, gridTemplateColumns: '1fr', alignItems: 'end' }}
      className="planos-hero-grid"
    >
      <style>{`
        @media (min-width: 1024px) {
          .planos-hero-grid { grid-template-columns: 1.2fr 0.8fr !important; }
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <div className="reveal badge-brand" style={{ width: 'fit-content' }}>
          Linguagem direta, sem enrolacao
        </div>

        <h1
          className="display-font reveal reveal-d1"
          style={{
            marginTop: 20,
            fontSize: 'clamp(2.2rem, 4vw, 3.4rem)',
            fontWeight: 500,
            lineHeight: 1.16,
            color: '#F8FAFC',
            letterSpacing: '-0.015em',
          }}
        >
          Um plano premium para{' '}
          <span className="text-gradient-brand" style={{ fontStyle: 'italic' }}>
            cada fase
          </span>{' '}
          da sua operacao comercial.
        </h1>

        <p
          className="reveal reveal-d2"
          style={{ marginTop: 20, maxWidth: 560, fontSize: 15, lineHeight: 1.75, color: '#94A3B8' }}
        >
          Se voce esta no modo solo, com equipe em nuvem ou estruturando um ambiente dedicado, o
          Arker CRM te coloca no controle do funil, da rotina e das entregas com mais previsao.
        </p>

        <ul
          className="reveal reveal-d3"
          style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          {HERO_BULLETS.map((bullet) => (
            <li
              key={bullet}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#CBD5E1' }}
            >
              <CheckCircle2
                style={{ marginTop: 2, width: 15, height: 15, flexShrink: 0, color: '#7DD3FC' }}
              />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="hero-card reveal reveal-d4" style={{ padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#7DD3FC',
            }}
          >
            Plano Solo ativo
          </span>
          <span
            style={{
              fontSize: 11,
              padding: '3px 8px',
              borderRadius: 6,
              background: 'rgba(129,140,248,0.12)',
              border: '1px solid rgba(129,140,248,0.34)',
              color: '#C7D2FE',
              fontWeight: 600,
            }}
          >
            Recomendado
          </span>
        </div>

        <h2 className="display-font" style={{ fontSize: 26, fontWeight: 500, color: '#F1F5F9', lineHeight: 1.2 }}>
          {soloPlan.name}
        </h2>
        <p style={{ marginTop: 8, fontSize: 13, color: '#64748B', lineHeight: 1.65 }}>
          {soloPlan.description}
        </p>

        <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(100,116,139,0.34)' }}>
          <p style={{ fontSize: 22, fontWeight: 700, color: '#E0E7FF', letterSpacing: '-0.02em' }}>
            {soloPlan.priceLabel}
          </p>
          <div style={{ marginTop: 10 }}>
            <div className="coupon-chip">{PREMIUM_COUPON_CODE} - 25% OFF vitalicio</div>
          </div>
        </div>

        <button
          type="button"
          className="btn-shimmer"
          style={{
            marginTop: 20,
            width: '100%',
            height: 44,
            borderRadius: 12,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
          disabled={stripeLoading}
          onClick={() => void onStripeAction(soloPlan)}
        >
          {stripeLoading ? (
            <span style={{ opacity: 0.7 }}>Redirecionando...</span>
          ) : (
            <>
              Assinar com Stripe
              <ArrowRight style={{ width: 14, height: 14 }} />
            </>
          )}
        </button>

        <p style={{ marginTop: 12, fontSize: 11, color: '#64748B', textAlign: 'center', lineHeight: 1.5 }}>
          Fluxo de pagamento igual ao ja configurado no CRM. Confirmou, liberou.
        </p>
      </div>
    </section>
  )
}
