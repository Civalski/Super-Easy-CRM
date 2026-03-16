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

export type EmailRedefinirSenhaProps = {
  nome?: string
  resetLink: string
  logoUrl?: string
  siteUrl?: string
}

export default function EmailRedefinirSenha({
  nome,
  resetLink,
  logoUrl = 'https://i.ibb.co/fdSkTf3n/arkerlogo1.png',
  siteUrl = 'https://arkersoft.com.br',
}: EmailRedefinirSenhaProps) {
  const saudacao = nome?.trim() ? `Ola, ${nome.trim()}.` : 'Ola!'

  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>Redefina sua senha clicando no link abaixo.</Preview>

      <Body style={main}>
        <Container style={container}>
          <Section style={logoWrapper}>
            <Img src={logoUrl} alt="Arkersoft" width="180" style={logo} />
          </Section>

          <Section style={content}>
            <Text style={eyebrow}>Redefinicao de senha</Text>

            <Text style={title}>{saudacao}</Text>

            <Text style={paragraph}>
              Recebemos uma solicitacao para redefinir a senha da sua conta.
              Clique no botao abaixo para criar uma nova senha.
            </Text>

            <Text style={paragraph}>
              Se voce nao solicitou essa alteracao, pode ignorar este email. Sua
              senha atual permanecera inalterada.
            </Text>

            <Section style={infoBox}>
              <Text style={infoBoxTitle}>Dica de seguranca</Text>
              <Text style={infoItem}>- O link expira em 1 hora</Text>
              <Text style={infoItem}>- Nao compartilhe este email com ninguem</Text>
              <Text style={infoItem}>- Use uma senha forte e unica</Text>
            </Section>

            <Section style={buttonWrapper}>
              <Button href={resetLink} style={button}>
                Redefinir senha
              </Button>
            </Section>

            <Hr style={hr} />

            <Text style={footer}>
              Se tiver qualquer duvida, responda este email ou entre em contato
              pelo WhatsApp{' '}
              <Link href="https://wa.me/5519998205608" style={footerLink}>
                19 99820-5608
              </Link>
              .
            </Text>

            <Text style={signature}>
              Atenciosamente,
              <br />
              Equipe Arkersoft
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

const infoBox = {
  backgroundColor: '#f6f0ff',
  border: '1px solid #eadcff',
  borderRadius: '14px',
  padding: '18px 18px 8px',
  margin: '24px 0',
}

const infoBoxTitle = {
  fontSize: '15px',
  lineHeight: '22px',
  fontWeight: '700',
  color: '#35195c',
  margin: '0 0 10px',
}

const infoItem = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#533f74',
  margin: '0 0 8px',
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
  margin: '0',
}
