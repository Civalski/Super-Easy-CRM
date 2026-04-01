'use client'

import {
  CRM_CAPABILITIES,
  PREMIUM_BENEFITS,
  PREMIUM_PLANS,
} from './constants'
import { usePlanosLanding } from './hooks/usePlanosLanding'
import { PLANOS_LANDING_STYLES } from './landingStyles'
import { PlanoCard } from './PlanoCard'
import { PlanosLandingFooter } from './PlanosLandingFooter'
import { PlanosLandingHeader } from './PlanosLandingHeader'
import { PlanosLandingHero } from './PlanosLandingHero'

export function PlanosLandingPage() {
  const { handlePlanAction, soloPlan, stripeLoading, updateUserCount, userCountByPlan } =
    usePlanosLanding()

  return (
    <>
      <style>{PLANOS_LANDING_STYLES}</style>

      <div className="planos-root">
        <div className="bg-blob-1" />
        <div className="bg-blob-2" />
        <div className="bg-blob-3" />

        <PlanosLandingHeader />

        <main
          style={{
            maxWidth: 1152,
            margin: '0 auto',
            padding: '44px 24px 80px',
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 80,
          }}
        >
          <PlanosLandingHero
            soloPlan={soloPlan}
            stripeLoading={stripeLoading}
            onStripeAction={handlePlanAction}
          />

          <div className="section-divider" />

          <section id="planos" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <h2
                className="display-font heading-accent"
                style={{ fontSize: 'clamp(1.7rem, 3vw, 2.4rem)', fontWeight: 500, color: '#F8FAFC', lineHeight: 1.2 }}
              >
                Escolha como quer crescer agora
              </h2>
              <p style={{ marginTop: 12, fontSize: 13.5, color: '#94A3B8', maxWidth: 560, lineHeight: 1.65 }}>
                O plano Solo vai direto para checkout. Team e Enterprise ja te levam para o WhatsApp
                com a quantidade de usuarios preenchida para acelerar o orcamento.
              </p>
            </div>

            <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
              {PREMIUM_PLANS.map((plan) => (
                <PlanoCard
                  key={plan.id}
                  plan={plan}
                  actionLoading={plan.id === 'solo' && stripeLoading}
                  userCount={userCountByPlan[plan.id]}
                  onAction={handlePlanAction}
                  onUserCountChange={updateUserCount}
                />
              ))}
            </div>
          </section>

          <div className="section-divider" />

          <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <h2
                className="display-font heading-accent"
                style={{ fontSize: 'clamp(1.7rem, 3vw, 2.4rem)', fontWeight: 500, color: '#F8FAFC', lineHeight: 1.2 }}
              >
                Por que o premium entrega mais resultado
              </h2>
              <p style={{ marginTop: 12, fontSize: 13.5, color: '#94A3B8', maxWidth: 520, lineHeight: 1.65 }}>
                O foco e simples: tirar atrito da rotina e aumentar previsibilidade de vendas e
                operacao.
              </p>
            </div>

            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
              {PREMIUM_BENEFITS.map((benefit) => {
                const Icon = benefit.icon
                return (
                  <article key={benefit.id} className="benefit-card" style={{ padding: 20 }}>
                    <div className="icon-box">
                      <Icon style={{ width: 16, height: 16 }} />
                    </div>
                    <h3 style={{ marginTop: 14, fontSize: 14, fontWeight: 600, color: '#E2E8F0', letterSpacing: '-0.01em' }}>
                      {benefit.title}
                    </h3>
                    <p style={{ marginTop: 8, fontSize: 13, lineHeight: 1.7, color: '#94A3B8' }}>
                      {benefit.description}
                    </p>
                  </article>
                )
              })}
            </div>
          </section>

          <div className="section-divider" />

          <section
            style={{
              borderRadius: 24,
              border: '1px solid rgba(100,116,139,0.34)',
              background: 'rgba(15,23,42,0.7)',
              backdropFilter: 'blur(12px)',
              padding: 'clamp(24px, 4vw, 40px)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 300,
                height: 300,
                background: 'radial-gradient(circle at top right, rgba(129,140,248,0.16), transparent 72%)',
                pointerEvents: 'none',
              }}
            />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <h2 className="display-font" style={{ fontSize: 'clamp(1.7rem, 3vw, 2.4rem)', fontWeight: 500, color: '#F8FAFC', lineHeight: 1.2 }}>
                O que voce leva para o dia a dia do CRM
              </h2>
              <p style={{ marginTop: 10, maxWidth: 540, fontSize: 13.5, color: '#94A3B8', lineHeight: 1.65 }}>
                A ideia e ter um ambiente unico para vender melhor, acompanhar carteira e manter o
                time alinhado sem improviso.
              </p>

              <div style={{ marginTop: 28, display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
                {CRM_CAPABILITIES.map((capability) => (
                  <article key={capability.id} className="capability-card" style={{ padding: 18 }}>
                    <h3 style={{ fontSize: 13.5, fontWeight: 600, color: '#BAE6FD', letterSpacing: '-0.01em' }}>
                      {capability.title}
                    </h3>
                    <p style={{ marginTop: 8, fontSize: 12.5, color: '#94A3B8', lineHeight: 1.7 }}>
                      {capability.description}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </main>

        <PlanosLandingFooter />
      </div>
    </>
  )
}
