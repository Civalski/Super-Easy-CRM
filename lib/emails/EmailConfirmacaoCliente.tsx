import * as React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

export type EmailConfirmacaoClienteProps = {
  confirmationLink: string
  nome?: string
  logoUrl?: string
  siteUrl?: string
}

export default function EmailConfirmacaoCliente({
  confirmationLink,
  nome = 'Cliente',
  logoUrl = 'https://i.ibb.co/fdSkTf3n/arkerlogo1.png',
  siteUrl = 'https://arkersoft.com.br',
}: EmailConfirmacaoClienteProps) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>Confirme seu email para ativar sua conta no Arker CRM.</Preview>

      <Body style={main}>
        <Container style={container}>
          <Section style={logoWrapper}>
            <Img src={logoUrl} alt="Arkersoft" width="180" style={logo} />
          </Section>

          <Section style={content}>
            <Text style={eyebrow}>Confirmacao de cadastro</Text>

            <Text style={title}>Oi, {nome}</Text>

            <Text style={paragraph}>
              Que bom ter voce por aqui! Voce esta a um clique de ativar sua
              conta.
            </Text>

            <Text style={paragraph}>
              Clique no botao abaixo para confirmar seu email:
            </Text>

            <Section style={buttonWrapper}>
              <Button href={confirmationLink} style={button}>
                Confirmar meu email
              </Button>
            </Section>

            <Text style={paragraph}>
              Simples assim! Depois de confirmar, voce ja pode explorar tudo
              que preparamos pra voce.
            </Text>

            <Text style={paragraph}>
              Qualquer duvida, e so chamar respondendo este email ou pelo
              whatsapp (19) 99820-5608; estamos sempre por aqui e respondemos
              rapidamente!
            </Text>

            <Hr style={hr} />

            <Text style={signature}>
              Ate ja,
              <br />
              atenciosamente
              <br />
              Alisson Civalski
            </Text>

            <Text style={footer}>
              <Link href={siteUrl} style={footerLink}>
                arkersoft.com.br
              </Link>
            </Text>

            <Text style={disclaimer}>
              (Se voce nao criou uma conta no Arker CRM, pode ignorar este
              email com seguranca)
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#f4f1fb',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
  margin: '0',
  padding: '32px 16px',
}

const container = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#ffffff',
  borderRadius: '18px',
  overflow: 'hidden',
  border: '1px solid #e9e2fb',
}

const logoWrapper = {
  background: 'linear-gradient(135deg, #2a1247 0%, #5b21b6 55%, #7c3aed 100%)',
  padding: '28px 24px',
  textAlign: 'center' as const,
}

const logo = {
  margin: '0 auto',
  height: 'auto',
}

const content = {
  padding: '32px 28px 36px',
}

const eyebrow = {
  fontSize: '12px',
  lineHeight: '18px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  color: '#7c3aed',
  fontWeight: '700',
  margin: '0 0 12px',
}

const title = {
  fontSize: '28px',
  lineHeight: '36px',
  fontWeight: '700',
  color: '#1f1630',
  margin: '0 0 16px',
}

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#4a3f5f',
  margin: '0 0 16px',
}

const buttonWrapper = {
  textAlign: 'center' as const,
  margin: '28px 0 10px',
}

const button = {
  backgroundColor: '#6d28d9',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '700',
  textDecoration: 'none',
  padding: '14px 24px',
  borderRadius: '10px',
  display: 'inline-block',
}

const hr = {
  borderColor: '#ece7f7',
  margin: '28px 0',
}

const footer = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#6a5d80',
  margin: '0 0 14px',
}

const footerLink = {
  color: '#6d28d9',
  textDecoration: 'none',
}

const signature = {
  fontSize: '14px',
  lineHeight: '24px',
  color: '#3b3050',
  margin: '0 0 14px',
}

const disclaimer = {
  fontSize: '13px',
  lineHeight: '20px',
  color: '#6a5d80',
  margin: '14px 0 0',
}
