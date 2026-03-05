import nodemailer from "nodemailer";
import dns from "dns";
import { env } from "../config/env";

// Forçar Node.js a resolver DNS para IPv4 primeiro
// Isso resolve o erro ENETUNREACH no Railway
dns.setDefaultResultOrder("ipv4first");

const transporter = nodemailer.createTransport({
  host: env.smtpHost,
  port: env.smtpPort,
  secure: env.smtpSecure,
  auth: env.smtpUser && env.smtpPass ? { user: env.smtpUser, pass: env.smtpPass } : undefined,
} as any);

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  if (!env.smtpHost || !env.smtpFrom) {
    console.warn(
      "[EMAIL] SMTP não configurado. Defina SMTP_HOST, SMTP_FROM (ou EMAIL_FROM) no .env. E-mail não será enviado."
    );
    return;
  }

  try {
    const result = await transporter.sendMail({
      from: env.smtpFrom,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    console.log("[EMAIL] E-mail enviado com sucesso:", result.messageId, "para:", options.to);
  } catch (error) {
    console.error("[EMAIL] Falha ao enviar e-mail:", {
      to: options.to,
      subject: options.subject,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}