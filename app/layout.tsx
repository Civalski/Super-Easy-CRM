import type { Metadata } from 'next'
import './globals.css'
import { Layout } from '@/components/layout'
import { Providers } from './Providers'

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
          <Layout>{children}</Layout>
        </Providers>
      </body>
    </html>
  )
}

