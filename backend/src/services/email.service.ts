import nodemailer from "nodemailer";
import { env } from "../config/env";

const transporter = nodemailer.createTransport({
  host: env.smtpHost,
  port: env.smtpPort,
  secure: env.smtpSecure,
  auth: env.smtpUser && env.smtpPass ? { user: env.smtpUser, pass: env.smtpPass } : undefined,
});

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
    // NÃO relançar o erro (segurança: não revelar falhas ao usuário)
    console.error("[EMAIL] Falha ao enviar e-mail:", {
      to: options.to,
      subject: options.subject,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

