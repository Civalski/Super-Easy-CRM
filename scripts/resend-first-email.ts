/**
 * Envia o primeiro email via Resend para concluir o onboarding.
 * Uso: npx tsx scripts/resend-first-email.ts
 */
import { config } from 'dotenv'
import { Resend } from 'resend'

config({ path: '.env' })
config({ path: '.env.local', override: true })

const apiKey = process.env.RESEND_API_KEY?.trim()
if (!apiKey) {
  console.error('RESEND_API_KEY nao encontrada no .env ou .env.local')
  process.exit(1)
}

const resend = new Resend(apiKey)

async function main() {
  const { data, error } = await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: 'arkersoft@gmail.com',
    subject: 'Hello World',
    html: '<p>Congrats on sending your <strong>first email</strong>!</p>',
  })

  if (error) {
    console.error('Erro ao enviar:', error)
    process.exit(1)
  }

  console.log('Email enviado com sucesso! ID:', data?.id)
  console.log('Verifique a caixa de entrada de arkersoft@gmail.com')
}

main()
