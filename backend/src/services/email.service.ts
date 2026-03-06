import { Resend } from "resend";
import { env } from "../config/env";

// ============================================================
// CONFIG
// ============================================================
const resend = new Resend(process.env.RESEND_API_KEY);

// Resend grátis exige enviar de: onboarding@resend.dev
// (depois que adicionar domínio próprio, troca para o seu)
const EMAIL_FROM = process.env.RESEND_FROM || "App da Pesca <onboarding@resend.dev>";
const ADMIN_EMAIL = env.adminEmail || env.smtpUser;

// ============================================================
// ENVIO GENÉRICO
// ============================================================
export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[EMAIL] RESEND_API_KEY não configurada. E-mail não enviado.");
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: [options.to],
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      console.error("[EMAIL] ❌ Erro Resend:", {
        to: options.to,
        subject: options.subject,
        error: error.message,
      });
      return;
    }

    console.log("[EMAIL] ✅ Enviado:", data?.id, "para:", options.to);
  } catch (error) {
    console.error("[EMAIL] ❌ Falha ao enviar:", {
      to: options.to,
      subject: options.subject,
      error: error instanceof Error ? error.message : String(error),
    });
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
  if (!ADMIN_EMAIL) {
    console.warn("[EMAIL] ADMIN_EMAIL não configurado.");
    return;
  }

  const itemsList = order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #eee;">${item.product.name}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">R$ ${(
            Number(item.unitPrice.toString()) * item.quantity
          ).toFixed(2)}</td>
        </tr>`
    )
    .join("");

  const total = Number(order.totalAmount.toString());

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f7fa;font-family:Arial,sans-serif;">
  <table width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <tr>
      <td style="background:linear-gradient(135deg,#2e7d32,#1b5e20);padding:32px 24px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:24px;">🎣 Nova Compra Confirmada!</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:32px 24px;">
        <p><strong>Cliente:</strong> ${order.user?.name || "N/A"} (${order.user?.email || "N/A"})</p>
        <p><strong>Pedido:</strong> #${order.id.slice(-8)}</p>
        <p><strong>Data:</strong> ${new Date().toLocaleString("pt-BR")}</p>
        <table width="100%" cellspacing="0" cellpadding="0" style="margin-top:16px;font-size:14px;">
          <tr style="background:#f8f9fa;">
            <th style="padding:8px;text-align:left;">Produto</th>
            <th style="padding:8px;text-align:center;">Qtd</th>
            <th style="padding:8px;text-align:right;">Subtotal</th>
          </tr>
          ${itemsList}
          <tr>
            <td colspan="2" style="padding:12px 8px;font-weight:bold;font-size:16px;">Total</td>
            <td style="padding:12px 8px;text-align:right;font-weight:bold;font-size:18px;color:#2e7d32;">R$ ${total.toFixed(2)}</td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="background:#f8f9fa;padding:16px 24px;text-align:center;">
        <p style="font-size:12px;color:#aaa;margin:0;">© ${new Date().getFullYear()} App da Pesca</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `🎣 Nova compra confirmada — Pedido #${order.id.slice(-8)}`,
    html,
  });
}