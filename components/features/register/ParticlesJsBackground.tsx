'use client'

import Script from 'next/script'

declare global {
  interface Window {
    particlesJS?: (tagId: string, params: unknown) => void
  }
}

function initParticles() {
  if (!window.particlesJS) return
  const container = document.getElementById('particles-js-bg-register')
  if (!container) return

  container.innerHTML = ''
  window.particlesJS('particles-js-bg-register', {
    interactivity: {
      detect_on: 'canvas',
      events: {
        onclick: { enable: false, mode: 'push' },
        onhover: { enable: false, mode: 'repulse' },
        resize: true,
      },
    },
    particles: {
      color: { value: '#5B21B6' },
      line_linked: {
        color: '#312E81',
        distance: 250,
        enable: true,
        opacity: 0.45,
        width: 1,
      },
      move: {
        bounce: false,
        direction: 'none',
        enable: true,
        out_mode: 'out',
        random: false,
        speed: 0.2,
        straight: false,
      },
      number: {
        density: { enable: true, value_area: 800 },
        value: 80,
      },
      opacity: {
        anim: {
          enable: false,
          opacity_min: 0.1,
          speed: 0.8,
          sync: false,
        },
        random: false,
        value: 0.5,
      },
      shape: {
        stroke: { color: '#000000', width: 0 },
        type: 'circle',
      },
      size: {
        anim: {
          enable: false,
          size_min: 0.1,
          speed: 40,
          sync: false,
        },
        random: true,
        value: 3,
      },
    },
    retina_detect: true,
  })
}

export function ParticlesJsBackground() {
  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js"
        strategy="afterInteractive"
        onReady={initParticles}
        onLoad={initParticles}
      />
      <div
        id="particles-js-bg-register"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      />
    </>
  )
}
