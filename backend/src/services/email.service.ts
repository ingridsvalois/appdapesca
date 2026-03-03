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
    console.warn("[email] SMTP não configurado. E-mail não será enviado.");
    return;
  }

  await transporter.sendMail({
    from: env.smtpFrom,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
}

