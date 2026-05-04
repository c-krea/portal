"use server"

import { BrevoClient } from "@getbrevo/brevo"

const brevo = new BrevoClient({ apiKey: process.env.BREVO_API_KEY! })

const SENDER = { name: "C-Krea Portal", email: "noreply@ckrea.com.co" }
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ckrea-portal.vercel.app"

function btnStyle(bg: string) {
  return `display:inline-block;padding:12px 28px;background:${bg};color:#fff;font-size:15px;font-weight:600;border-radius:8px;text-decoration:none;`
}

function feature(icon: string, title: string, desc: string) {
  return `<tr>
    <td style="padding:10px 12px;background:#f8fafc;border-radius:8px;">
      <span style="font-size:18px;">${icon}</span>
      <span style="color:#0f172a;font-size:14px;font-weight:600;margin-left:8px;">${title}</span>
      <p style="margin:4px 0 0 28px;color:#64748b;font-size:13px;line-height:1.5;">${desc}</p>
    </td>
  </tr>
  <tr><td style="height:8px;"></td></tr>`
}

function wrap(body: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
        <tr><td style="background:#0f172a;padding:28px 32px;text-align:center;">
          <img src="https://ckrea.com.co/ckrea-logo.png" alt="C-Krea" width="80" height="80" style="display:block;margin:0 auto 12px;" />
          <span style="color:#fff;font-size:18px;font-weight:700;letter-spacing:.5px;">C-Krea PayControl</span>
          <span style="display:block;color:#94a3b8;font-size:12px;margin-top:4px;">Central Kreativa — Portal de Pagos</span>
        </td></tr>
        <tr><td style="padding:32px;">${body}</td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #f1f5f9;text-align:center;">
          <span style="color:#94a3b8;font-size:12px;">C-Krea · Bogotá, Colombia · <a href="${SITE}" style="color:#94a3b8;">Portal</a></span>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function sendWelcomeEmail(opts: {
  to: string
  name: string
  setupUrl: string
}) {
  return brevo.transactionalEmails.sendTransacEmail({
    sender: SENDER,
    to: [{ email: opts.to }],
    subject: "Bienvenido al Portal C-Krea — crea tu contraseña",
    htmlContent: wrap(`
      <h2 style="margin:0 0 8px;color:#0f172a;font-size:20px;">¡Bienvenido al Portal!</h2>
      <p style="margin:0 0 20px;color:#334155;font-size:15px;">Hola <strong>${opts.name}</strong>,</p>
      <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Tu cuenta en el <strong>Portal de Inquilinos de Central Kreativa</strong> ya está lista.
        Desde aquí puedes gestionar todo lo relacionado con tu local en un solo lugar.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
        ${feature("💳", "Consulta tus pagos", "Revisa tu historial de pagos y el estado de tu cuenta en tiempo real.")}
        ${feature("⚡", "Reporta tu lectura eléctrica", "Sube la lectura de tu contador cada mes directamente desde el portal.")}
        ${feature("📋", "Toda tu información en un lugar", "Datos de tu contrato, próximos vencimientos y más — siempre disponibles.")}
        ${feature("🚀", "Más funciones próximamente", "Seguimos mejorando el portal. Pronto tendrás acceso a nuevas herramientas.")}
      </table>

      <p style="text-align:center;margin:0 0 28px;">
        <a href="${opts.setupUrl}" style="${btnStyle("#2563eb")}">Crear mi contraseña</a>
      </p>
      <p style="color:#64748b;font-size:13px;text-align:center;margin:0;">
        Este enlace expira en 24 horas. ¿Tienes dudas? Escríbenos a
        <a href="mailto:administracion@ckrea.com.co" style="color:#2563eb;">administracion@ckrea.com.co</a>
      </p>`),
  })
}


export async function sendPasswordResetEmail(opts: {
  to: string
  resetUrl: string
}) {
  return brevo.transactionalEmails.sendTransacEmail({
    sender: SENDER,
    to: [{ email: opts.to }],
    subject: "Restablecer contraseña — Portal C-Krea",
    htmlContent: wrap(`
      <h2 style="margin:0 0 12px;color:#0f172a;font-size:20px;">Restablecer contraseña</h2>
      <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Recibimos una solicitud para restablecer la contraseña de tu cuenta en el Portal C-Krea.
        Haz clic en el botón para continuar.
      </p>
      <p style="text-align:center;margin:0 0 28px;">
        <a href="${opts.resetUrl}" style="${btnStyle("#2563eb")}">Restablecer contraseña</a>
      </p>
      <p style="color:#64748b;font-size:13px;margin:0;">
        Este enlace expira en 1 hora. Si no solicitaste esto, ignora este mensaje — tu contraseña no cambiará.
      </p>`),
  })
}
