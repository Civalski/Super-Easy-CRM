export const PLANOS_LANDING_STYLES = `
  .planos-root {
    --planos-bg: #0b1220;
    --planos-surface: rgba(15, 23, 42, 0.78);
    --planos-surface-soft: rgba(15, 23, 42, 0.58);
    --planos-border: rgba(100, 116, 139, 0.35);
    --planos-text-main: #e2e8f0;
    --planos-text-soft: #cbd5e1;
    --planos-text-muted: #94a3b8;
    --planos-text-faint: #64748b;
    --planos-accent: #38bdf8;
    --planos-accent-soft: #7dd3fc;
    --planos-accent-strong: #818cf8;
    font-family: var(--font-body), 'Segoe UI', sans-serif;
    background:
      radial-gradient(circle at 12% -12%, rgba(99, 102, 241, 0.24), transparent 38%),
      radial-gradient(circle at 90% -18%, rgba(14, 165, 233, 0.18), transparent 42%),
      linear-gradient(180deg, #070f1d 0%, var(--planos-bg) 56%, #080f1d 100%);
    color: var(--planos-text-main);
    min-height: 100vh;
    isolation: isolate;
    position: relative;
  }

  .planos-root * { box-sizing: border-box; }

  .planos-root::before {
    content: '';
    position: fixed;
    inset: 0;
    z-index: 0;
    opacity: 0.028;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.92' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    background-repeat: repeat;
    background-size: 132px;
    pointer-events: none;
  }

  .bg-blob-1 {
    position: fixed;
    top: -120px;
    left: 50%;
    transform: translateX(-54%);
    width: 680px;
    height: 320px;
    background: radial-gradient(ellipse, rgba(129, 140, 248, 0.22) 0%, transparent 72%);
    border-radius: 50%;
    filter: blur(64px);
    pointer-events: none;
    z-index: 0;
    animation: blobFloat 13s ease-in-out infinite alternate;
  }

  .bg-blob-2 {
    position: fixed;
    bottom: 12px;
    right: -56px;
    width: 430px;
    height: 430px;
    background: radial-gradient(ellipse, rgba(56, 189, 248, 0.14) 0%, transparent 70%);
    border-radius: 50%;
    filter: blur(72px);
    pointer-events: none;
    z-index: 0;
  }

  .bg-blob-3 {
    position: fixed;
    bottom: 70px;
    left: -90px;
    width: 350px;
    height: 350px;
    background: radial-gradient(ellipse, rgba(59, 130, 246, 0.14) 0%, transparent 72%);
    border-radius: 50%;
    filter: blur(64px);
    pointer-events: none;
    z-index: 0;
  }

  @keyframes blobFloat {
    from { transform: translateX(-54%) translateY(0); }
    to { transform: translateX(-46%) translateY(18px); }
  }

  .display-font {
    font-family: var(--font-heading), var(--font-body), sans-serif;
  }

  .text-gradient-brand {
    background: linear-gradient(130deg, var(--planos-accent-soft) 0%, var(--planos-accent-strong) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .planos-header {
    position: sticky;
    top: 0;
    z-index: 12;
    border-bottom: 1px solid rgba(100, 116, 139, 0.26);
    backdrop-filter: blur(16px);
    background: rgba(8, 15, 31, 0.72);
  }

  .planos-header-inner {
    max-width: 1152px;
    margin: 0 auto;
    padding: 14px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .planos-logo-wrap {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  .planos-logo-chip {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 14px;
    border: 1px solid rgba(148, 163, 184, 0.38);
    background: rgba(15, 23, 42, 0.82);
    width: 46px;
    height: 46px;
    overflow: hidden;
    flex-shrink: 0;
    box-shadow: 0 10px 28px -20px rgba(2, 6, 23, 0.95);
  }

  .planos-logo-copy {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }

  .planos-logo-title {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--planos-accent-soft);
    line-height: 1.2;
  }

  .planos-logo-subtitle {
    font-size: 11px;
    letter-spacing: 0.03em;
    color: var(--planos-text-faint);
    line-height: 1.25;
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 38px;
    padding: 0 14px;
    border-radius: 11px;
    border: 1px solid rgba(100, 116, 139, 0.4);
    background: rgba(15, 23, 42, 0.66);
    color: var(--planos-text-soft);
    font-size: 13px;
    font-weight: 500;
    transition: border-color 0.2s, color 0.2s, background-color 0.2s, transform 0.16s;
    white-space: nowrap;
  }

  .back-link:hover {
    border-color: rgba(129, 140, 248, 0.6);
    color: #f8fafc;
    background: rgba(30, 41, 59, 0.8);
    transform: translateY(-1px);
  }

  .btn-shimmer {
    position: relative;
    overflow: hidden;
    background: linear-gradient(135deg, rgba(56, 189, 248, 0.22), rgba(99, 102, 241, 0.24));
    border: 1px solid rgba(129, 140, 248, 0.55);
    color: #eff6ff;
    font-weight: 600;
    transition: background 0.25s, box-shadow 0.25s, transform 0.15s;
  }

  .btn-shimmer::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 64%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.12), transparent);
    animation: shimmer 2.9s infinite;
  }

  @keyframes shimmer {
    0% { left: -100%; }
    100% { left: 200%; }
  }

  .btn-shimmer:hover {
    background: linear-gradient(135deg, rgba(56, 189, 248, 0.32), rgba(99, 102, 241, 0.36));
    box-shadow: 0 0 34px rgba(99, 102, 241, 0.26);
    transform: translateY(-1px);
  }

  .btn-shimmer:disabled {
    opacity: 0.58;
    cursor: not-allowed;
    transform: none;
  }

  .hero-card {
    background: rgba(12, 20, 36, 0.9);
    border: 1px solid rgba(129, 140, 248, 0.3);
    border-radius: 20px;
    backdrop-filter: blur(16px);
    box-shadow:
      0 0 0 1px rgba(129, 140, 248, 0.06),
      0 36px 100px -36px rgba(30, 64, 175, 0.36),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
    position: relative;
    overflow: hidden;
  }

  .hero-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(147, 197, 253, 0.56), transparent);
  }

  .benefit-card {
    background: var(--planos-surface-soft);
    border: 1px solid rgba(100, 116, 139, 0.38);
    border-radius: 16px;
    transition: border-color 0.25s, box-shadow 0.25s, transform 0.2s;
  }

  .benefit-card:hover {
    border-color: rgba(125, 211, 252, 0.45);
    box-shadow: 0 14px 42px -18px rgba(14, 116, 144, 0.34);
    transform: translateY(-2px);
  }

  .capability-card {
    background: rgba(15, 23, 42, 0.72);
    border: 1px solid rgba(100, 116, 139, 0.36);
    border-radius: 14px;
    transition: border-color 0.2s;
  }

  .capability-card:hover {
    border-color: rgba(129, 140, 248, 0.52);
  }

  .section-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(129, 140, 248, 0.3), transparent);
  }

  .badge-brand {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 999px;
    background: rgba(14, 165, 233, 0.12);
    border: 1px solid rgba(56, 189, 248, 0.3);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: #bae6fd;
  }

  .badge-brand::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #38bdf8;
    box-shadow: 0 0 6px rgba(56, 189, 248, 0.8);
    animation: pulse-dot 2s ease-in-out infinite;
  }

  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.55; transform: scale(0.85); }
  }

  .icon-box {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: rgba(56, 189, 248, 0.12);
    border: 1px solid rgba(56, 189, 248, 0.24);
    color: #bae6fd;
  }

  .reveal { animation: revealUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) both; }
  .reveal-d1 { animation-delay: 0.08s; }
  .reveal-d2 { animation-delay: 0.16s; }
  .reveal-d3 { animation-delay: 0.24s; }
  .reveal-d4 { animation-delay: 0.32s; }

  @keyframes revealUp {
    from { opacity: 0; transform: translateY(18px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .heading-accent {
    position: relative;
    display: inline-block;
  }

  .heading-accent::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: -4px;
    width: 48px;
    height: 2px;
    background: linear-gradient(90deg, var(--planos-accent), transparent);
    border-radius: 2px;
  }

  .coupon-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(245, 158, 11, 0.12);
    border: 1px solid rgba(245, 158, 11, 0.3);
    border-radius: 8px;
    padding: 4px 10px;
    font-size: 12px;
    font-weight: 600;
    color: #fcd34d;
    letter-spacing: 0.04em;
  }

  .planos-footer {
    border-top: 1px solid rgba(100, 116, 139, 0.32);
    padding: 28px 24px;
    position: relative;
    z-index: 1;
  }

  .footer-link {
    color: var(--planos-accent-soft);
    text-decoration: none;
    transition: color 0.2s;
  }

  .footer-link:hover {
    color: #dbeafe;
  }

  ::-webkit-scrollbar { width: 8px; }
  ::-webkit-scrollbar-track { background: #070f1d; }
  ::-webkit-scrollbar-thumb {
    background: rgba(99, 102, 241, 0.4);
    border-radius: 999px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: rgba(129, 140, 248, 0.54);
  }

  @media (max-width: 1023px) {
    .planos-header-inner {
      padding: 12px 16px;
    }

    .planos-logo-chip {
      width: 42px;
      height: 42px;
      border-radius: 12px;
    }
  }
`
