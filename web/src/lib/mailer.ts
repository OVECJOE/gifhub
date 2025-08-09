import nodemailer from 'nodemailer'

export async function sendEmail(to: string, subject: string, html: string) {
  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT || '587', 10)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.EMAIL_FROM || 'no-reply@gifhub.local'

  if (!host || !user || !pass) {
    throw new Error('SMTP not configured')
  }

  const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } })
  await transporter.sendMail({ from, to, subject, html })
}


