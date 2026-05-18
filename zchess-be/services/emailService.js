/**
 * Task: Gửi email xác nhận mua khóa (SMTP tùy chọn) — không throw nếu chưa cấu hình
 * Tác giả: DucManh-BlueOC
 */
const nodemailer = require("nodemailer");

let cachedTransport = null;

function getSmtpTransport() {
  const host = String(process.env.SMTP_HOST || "").trim();
  if (!host) return null;
  if (cachedTransport) return cachedTransport;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure =
    String(process.env.SMTP_SECURE || "").toLowerCase() === "true" ||
    port === 465;
  const user = String(process.env.SMTP_USER || "").trim();
  const pass = String(process.env.SMTP_PASS || "").trim();
  cachedTransport = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user ? { user, pass } : undefined,
  });
  return cachedTransport;
}

function getFromAddress() {
  const from = String(process.env.MAIL_FROM || "").trim();
  if (from) return from;
  const user = String(process.env.SMTP_USER || "").trim();
  return user || "noreply@localhost";
}

/**
 * @returns {Promise<{ sent: boolean, skipped?: boolean, error?: string }>}
 */
async function sendMailIfConfigured({ to, subject, text, html }) {
  const address = String(to || "").trim();
  if (!address) {
    return { sent: false, skipped: true, error: "no_recipient" };
  }
  const transport = getSmtpTransport();
  if (!transport) {
    console.info(
      "[emailService] Bỏ qua gửi mail (thiếu SMTP_HOST). To:",
      address,
    );
    return { sent: false, skipped: true };
  }
  try {
    await transport.sendMail({
      from: getFromAddress(),
      to: address,
      subject: String(subject || "").slice(0, 200),
      text: text || undefined,
      html: html || undefined,
    });
    return { sent: true };
  } catch (err) {
    console.error("[emailService] sendMail failed:", err?.message);
    return { sent: false, error: err?.message || "send_failed" };
  }
}

module.exports = {
  sendMailIfConfigured,
};
