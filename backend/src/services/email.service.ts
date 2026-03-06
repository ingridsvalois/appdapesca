import dns from "dns";
import { promisify } from "util";
import nodemailer from "nodemailer";
import { env } from "../config/env";

// ✅ MUDANÇA CHAVE: resolve4 em vez de lookup
// dns.resolve4 consulta registros A diretamente (só IPv4)
// dns.lookup usa o resolver do OS (Railway pode retornar IPv6)
const dnsResolve4 = promisify(dns.resolve4);

const smtpHost = env.smtpHost || "smtp.gmail.com";

let transporterInstance: nodemailer.Transporter | null = null;
let resolvedIPv4: string | null = null;

// ============================================================
// RESOLVER IPv4
// ============================================================
async function getIPv4Address(): Promise<string> {
  if (resolvedIPv4) return resolvedIPv4;

  try {
    // ✅ resolve4 retorna APENAS endereços IPv4 (registros DNS tipo A)
    const addresses = await dnsResolve4(smtpHost);
    if (addresses && addresses.length > 0) {
      resolvedIPv4 = addresses[0];
      console.log(`[EMAIL] ${smtpHost} → IPv4: ${resolvedIPv4}`);
      return resolvedIPv4;
    }
  } catch (err) {
    console.error(`[EMAIL] Falha ao resolver IPv4 de ${smtpHost}:`, err);
  }

  // Fallback: IP conhecido do Gmail SMTP
  resolvedIPv4 = "142.250.115.108";
  console.warn(`[EMAIL] Usando fallback IPv4 hardcoded: ${resolvedIPv4}`);
  return resolvedIPv4;
}

// ============================================================
// TRANSPORTER
// ============================================================
async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporterInstance) return transporterInstance;

  const ipv4Address = await getIPv4Address();

  transporterInstance = nodemailer.createTransport({
    host: ipv4Address,                    // ✅ IP direto, sem resolução DNS
    port: env.smtpPort || 587,
    secure: false,
    auth:
      env.smtpUser && env.smtpPass
        ? { user: env.smtpUser, pass: env.smtpPass }
        : undefined,
    tls: {
      servername: smtpHost,               // ✅ Necessário para validar certificado TLS
      rejectUnauthorized: false,
    },
    connectionTimeout: 10000,             // ✅ Timeout de conexão
    greetingTimeout: 10000,
    socketTimeout: 15000,
  } as any);

  // ✅ AWAIT na verificação (não fire-and-forget)
  try {
    await transporterInstance.verify();
    console.log("[EMAIL] ✅ SMTP conectado com sucesso (IPv4:", ipv4Address + ")");
  } catch (err) {
    console.error("[EMAIL] ❌ Falha na verificação SMTP:", err);
    // ✅ Invalida para tentar de novo na próxima chamada
    transporterInstance = null;
    resolvedIPv4 = null;
    throw err;
  }

  return transporterInstance;
}

// ============================================================
// ENVIO GENÉRICO
// ============================================================
export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  if (!env.smtpHost || !env.smtpFrom) {
    console.warn(
      "[EMAIL] SMTP não configurado. Defina SMTP_HOST, SMTP_FROM no .env."
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
    console.log("[EMAIL] ✅ Enviado:", result.messageId, "para:", options.to);
  } catch (error) {
    console.error("[EMAIL] ❌ Falha ao enviar:", {
      to: options.to,
      subject: options.subject,
      error: error instanceof Error ? error.message : String(error),
    });
    // ✅ Invalida transporter para forçar reconexão
    transporterInstance = null;
    resolvedIPv4 = null;
  }
}

// ============================================================
// NOTIFICAÇÃO ADMIN
// ============================================================
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
    console.warn("[EMAIL] ADMIN_EMAIL ou SMTP_FROM não configurado.");
    return;
  }

  const itemsList = order.items
    .map(
      (item) =>
        `- ${item.product.name} x${item.quantity} — R$ ${(
          Number(item.unitPrice.toString()) * item.quantity
        ).toFixed(2)}`
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
    console.log("[EMAIL] ✅ Notificação admin enviada:", result.messageId);
  } catch (error) {
    console.error("[EMAIL] ❌ Falha notificação admin:", {
      orderId: order.id,
      to: adminEmail,
      error: error instanceof Error ? error.message : String(error),
    });
    // ✅ Invalida transporter
    transporterInstance = null;
    resolvedIPv4 = null;
  }
}