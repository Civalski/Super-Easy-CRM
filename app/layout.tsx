import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Sora } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import 'sweetalert2/dist/sweetalert2.min.css'
import { Layout } from '@/components/layout'
import { Providers } from './Providers'
import { NotificationManager } from '@/components/features/tarefas/NotificationManager'
import { THEME_STORAGE_KEY } from '@/lib/ui/themePreference'

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

export const metadata: Metadata = {
  title: 'Arker CRM',
  description: 'Sistema de CRM completo',
}

const themeInitScript = `
  (function () {
    try {
      var storedTheme = localStorage.getItem('${THEME_STORAGE_KEY}');
      var theme = storedTheme === 'light' ? 'light' : 'dark';
      var root = document.documentElement;
      root.classList.remove('dark', 'light');
      root.classList.add(theme);
    } catch (_error) {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  })();
`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${bodyFont.variable} ${headingFont.variable} dark`}
    >
      <body className="antialiased">
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <Providers>
          <NotificationManager />
          <Layout>{children}</Layout>
        </Providers>
      </body>
    </html>
  )
}
