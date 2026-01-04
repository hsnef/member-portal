// ============================================================================
// Email Service - Google Workspace SMTP
// ============================================================================

import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

// SMTP Configuration
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp-relay.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
  auth: process.env.SMTP_USER && process.env.SMTP_PASSWORD ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  } : undefined,
}

// Default from address
const DEFAULT_FROM = {
  name: process.env.EMAIL_FROM_NAME || 'HSNEF Membership Portal',
  address: process.env.EMAIL_FROM || 'noreply@members.hsnef.org',
}

// Create reusable transporter
let transporter: Transporter | null = null

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport(SMTP_CONFIG)
  }
  return transporter
}

// Email options interface
export interface EmailOptions {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  from?: {
    name?: string
    address?: string
  }
  replyTo?: string
  cc?: string | string[]
  bcc?: string | string[]
  attachments?: Array<{
    filename: string
    content?: string | Buffer
    path?: string
  }>
}

/**
 * Send an email via Google Workspace SMTP
 */
export async function sendEmail(options: EmailOptions) {
  try {
    const transporter = getTransporter()

    // Format from address
    const fromAddress = options.from?.address || DEFAULT_FROM.address
    const fromName = options.from?.name || DEFAULT_FROM.name
    const from = `"${fromName}" <${fromAddress}>`

    // Send email
    const info = await transporter.sendMail({
      from,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      replyTo: options.replyTo || process.env.EMAIL_REPLY_TO,
      cc: options.cc,
      bcc: options.bcc,
      attachments: options.attachments,
    })

    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
    }
  } catch (error) {
    console.error('Email send error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Verify SMTP connection
 */
export async function verifyEmailConnection() {
  try {
    const transporter = getTransporter()
    await transporter.verify()
    return { success: true, message: 'SMTP connection verified' }
  } catch (error) {
    console.error('SMTP verification error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send a test email
 */
export async function sendTestEmail(to: string) {
  return sendEmail({
    to,
    subject: 'HSNEF Portal - Test Email',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FF9933;">HSNEF Membership Portal</h2>
        <p>This is a test email from your HSNEF Membership Portal.</p>
        <p>If you received this email, your Google Workspace SMTP configuration is working correctly!</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          This email was sent from the HSNEF Membership Portal.<br>
          Hindu Society of North East Florida
        </p>
      </div>
    `,
    text: 'This is a test email from your HSNEF Membership Portal. If you received this email, your Google Workspace SMTP configuration is working correctly!',
  })
}
