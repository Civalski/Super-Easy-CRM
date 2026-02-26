import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Sora } from 'next/font/google'
import './globals.css'
import 'sweetalert2/dist/sweetalert2.min.css'
import { Layout } from '@/components/layout'
import { Providers } from './Providers'
import { NotificationManager } from '@/components/features/tarefas/NotificationManager'

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`dark ${bodyFont.variable} ${headingFont.variable}`}>
      <body className="antialiased">
        <Providers>
          <NotificationManager />
          <Layout>{children}</Layout>
        </Providers>
      </body>
    </html>
  )
}
