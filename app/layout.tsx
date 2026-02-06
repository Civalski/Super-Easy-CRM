import type { Metadata } from 'next'
import './globals.css'
import 'sweetalert2/dist/sweetalert2.min.css'
import { Layout } from '@/components/layout'
import { Providers } from './Providers'
import { NotificationManager } from '@/components/features/tarefas/NotificationManager'

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
    <html lang="pt-BR" className="dark">
      <body>
        <Providers>
          <NotificationManager />
          <Layout>{children}</Layout>
        </Providers>
      </body>
    </html>
  )
}
