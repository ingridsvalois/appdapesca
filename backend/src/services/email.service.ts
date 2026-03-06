import dns from "dns";
import { promisify } from "util";
import nodemailer from "nodemailer";
import { env } from "../config/env";

const dnsLookup = promisify(dns.lookup);
const smtpHost = env.smtpHost || "smtp.gmail.com";

let transporterInstance: nodemailer.Transporter | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporterInstance) return transporterInstance;

  // Resolve hostname para IPv4 explicitamente (Railway falha com IPv6)
  const { address } = await dnsLookup(smtpHost, { family: 4 });
  console.log("[EMAIL] SMTP resolvido para IPv4:", address);

  transporterInstance = nodemailer.createTransport({
    host: address,
    port: env.smtpPort || 587,
    secure: false,
    auth:
      env.smtpUser && env.smtpPass
        ? { user: env.smtpUser, pass: env.smtpPass }
        : undefined,
    tls: {
      servername: smtpHost,
      rejectUnauthorized: false,
    },
  } as any);

  transporterInstance
    .verify()
    .then(() => console.log("[EMAIL] Servidor SMTP conectado com sucesso (IPv4)"))
    .catch((err) => console.error("[EMAIL] Falha na verificação SMTP:", err));

  return transporterInstance;
}

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
    const transporter = await getTransporter();
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

export async function sendAdminNotificationEmail(order: {
  id: string;
  totalAmount: { toString: () => string };
  items: Array<{
    product: { name: string };
    quantity: number;
    unitPrice: { toString: () => string };
  }>;
  user?: { name?: string; email?: string } | null;
}): Promise<void> {
  const adminEmail = env.adminEmail || env.smtpUser;
  if (!adminEmail || !env.smtpFrom) {
    console.warn("[EMAIL] ADMIN_EMAIL ou SMTP_FROM não configurado. Notificação ao admin ignorada.");
    return;
  }

  const itemsList = order.items
    .map(
      (item) =>
        `- ${item.product.name} x${item.quantity} — R$ ${(Number(item.unitPrice.toString()) * item.quantity).toFixed(2)}`
    )
    .join("\n");

  const total = Number(order.totalAmount.toString());

  try {
    const transporter = await getTransporter();
    const result = await transporter.sendMail({
      from: env.smtpFrom,
      to: adminEmail,
      subject: `🎣 Nova compra confirmada — Pedido #${order.id.slice(-8)}`,
      text: `
Nova compra confirmada!

Cliente: ${order.user?.name || "N/A"} (${order.user?.email || "N/A"})
Pedido: ${order.id}
Data: ${new Date().toLocaleString("pt-BR")}

Itens:
${itemsList}

Total: R$ ${total.toFixed(2)}

Acesse o painel admin para mais detalhes.
    `.trim(),
    });
    console.log("[EMAIL] Notificação admin enviada:", result.messageId, "para:", adminEmail);
  } catch (error) {
    console.error("[EMAIL] Falha ao enviar notificação ao admin:", {
      orderId: order.id,
      to: adminEmail,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}