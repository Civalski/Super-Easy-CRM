import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans, Sora } from 'next/font/google'
import Script from 'next/script'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'
import { Layout } from '@/components/layout'
import { Providers } from './Providers'
import { NotificationManager } from '@/components/features/tarefas/NotificationManager'
import { NotificationsProvider } from '@/components/features/tarefas/NotificationsProvider'
import { readUiPrefsCookie } from '@/lib/cookies/server'
import { DEFAULT_THEME } from '@/lib/cookies'
import { AppToaster } from '@/components/ui/AppToaster'

const bodyFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

const headingFont = Sora({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'Arker CRM',
  description: 'Sistema de CRM completo',
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon' },
      { url: '/icon.ico', type: 'image/x-icon' },
    ],
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
}

const themeInitScript = `
  (function () {
    var root = document.documentElement;
    var theme = '${DEFAULT_THEME}';
    try {
      var m = document.cookie.match(/arker_ui_prefs=([^;]*)/);
      if (m) {
        var p = JSON.parse(decodeURIComponent(m[1]));
        if (p && p.ui && (p.ui.theme === 'light' || p.ui.theme === 'dark')) theme = p.ui.theme;
      }
      if (theme === '${DEFAULT_THEME}') {
        var stored = localStorage.getItem('arker:ui:theme');
        if (stored === 'light' || stored === 'dark') theme = stored;
      }
    } catch (_) {}
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
    root.classList.add('theme-loaded');
  })();
`

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const uiPrefs = await readUiPrefsCookie()
  const initialTheme = uiPrefs?.theme ?? DEFAULT_THEME

  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${bodyFont.variable} ${headingFont.variable} ${initialTheme}`}
    >
      <body className="antialiased">
        <noscript>
          <style dangerouslySetInnerHTML={{ __html: 'html{visibility:visible!important}' }} />
        </noscript>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <Providers>
          <NotificationsProvider>
            <NotificationManager />
            <Layout>{children}</Layout>
            <AppToaster />
          </NotificationsProvider>
        </Providers>
        <SpeedInsights />
      </body>
    </html>
  )
}
