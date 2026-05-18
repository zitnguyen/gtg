/**
 * Task: Email xác nhận sau CK — bố cục tham khảo tkcursor (ORD#, bảng info, CTA, hỗ trợ)
 * Tác giả: DucManh-BlueOC
 */

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatViTimestamp(d = new Date()) {
  try {
    return d.toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return d.toISOString();
  }
}

/**
 * @param {object} p
 * @param {string} p.orderTag — ví dụ ORD-A1B2C3
 * @param {string} p.brandName — tên trung tâm
 * @param {string} p.buyerName
 * @param {string} p.introLine — câu mở đầu sau CK / sau duyệt admin
 * @param {{ title: string, slug?: string }[]} p.courses
 * @param {string} p.learnUrl — link bài học đầu hoặc trang khóa
 * @param {string} [p.supportEmail]
 * @param {string} [p.supportHotline]
 * @param {string} p.sentAtLabel
 */
function buildPurchaseActivationEmail(p) {
  const orderTag = escapeHtml(p.orderTag);
  const brand = escapeHtml(p.brandName || "Z Chess");
  const buyer = escapeHtml(p.buyerName || "bạn");
  const intro = escapeHtml(p.introLine);
  const learnUrl = String(p.learnUrl || "").trim();
  const learnUrlEsc = escapeHtml(learnUrl);
  const supportEmail = (p.supportEmail || "").trim();
  const supportHotline = (p.supportHotline || "").trim();
  const sentAt = escapeHtml(p.sentAtLabel);

  const courseRows = (p.courses || [])
    .map(
      (c) => `
      <tr>
        <td style="padding:10px 12px;border:1px solid #e2e8f0;color:#64748b;font-size:13px;width:38%;">Khóa học</td>
        <td style="padding:10px 12px;border:1px solid #e2e8f0;color:#0f172a;font-size:14px;font-weight:600;">${escapeHtml(c.title || "Khóa học")}</td>
      </tr>`,
    )
    .join("");

  const supportBlock =
    supportEmail || supportHotline
      ? `
      <p style="margin:20px 0 8px;font-size:15px;font-weight:600;color:#0f172a;">Cần hỗ trợ?</p>
      <p style="margin:0 0 8px;font-size:14px;color:#475569;line-height:1.6;">
        Nếu không vào được bài học hoặc cần hỗ trợ, hãy trả lời email này hoặc liên hệ:
      </p>
      <ul style="margin:0;padding-left:18px;color:#475569;font-size:14px;line-height:1.7;">
        ${supportHotline ? `<li>Hotline: <strong>${escapeHtml(supportHotline)}</strong></li>` : ""}
        ${supportEmail ? `<li>Email: <strong>${escapeHtml(supportEmail)}</strong></li>` : ""}
      </ul>`
      : `
      <p style="margin:20px 0 0;font-size:14px;color:#475569;line-height:1.6;">
        Nếu cần hỗ trợ, hãy trả lời email này hoặc liên hệ trung tâm qua trang web.
      </p>`;

  const subject = `Đơn #${p.orderTag} đã kích hoạt thành công — ${p.brandName || "Z Chess"}`.slice(
    0,
    200,
  );

  const html = `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08);">
          <tr>
            <td style="padding:20px 24px;background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);color:#f8fafc;">
              <p style="margin:0;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.85;">${brand}</p>
              <p style="margin:8px 0 0;font-size:20px;font-weight:700;">Kích hoạt khóa học</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px 8px;">
              <p style="margin:0;font-size:28px;line-height:1.2;">&#9989; Kích hoạt thành công!</p>
              <p style="margin:12px 0 0;font-size:15px;color:#475569;line-height:1.6;">
                Khóa học đã được gắn vào tài khoản của bạn — bạn có thể vào học ngay.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 20px;">
              <p style="margin:0;font-size:15px;color:#0f172a;line-height:1.65;">
                Xin chào <strong>${buyer}</strong>,<br/>
                ${intro}
              </p>
              <p style="margin:16px 0 8px;font-size:14px;color:#64748b;">
                Mã đơn: <strong style="color:#0f172a;font-family:ui-monospace,monospace;">#${orderTag}</strong>
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-top:12px;">
                ${courseRows}
                <tr>
                  <td style="padding:10px 12px;border:1px solid #e2e8f0;color:#64748b;font-size:13px;">Vào học</td>
                  <td style="padding:10px 12px;border:1px solid #e2e8f0;">
                    <a href="${learnUrlEsc}" style="display:inline-block;padding:10px 18px;background:#059669;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">Mở bài học ngay</a>
                  </td>
                </tr>
              </table>
              <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;word-break:break-all;">
                Hoặc dán liên kết: ${learnUrlEsc}
              </p>
              ${supportBlock}
              <p style="margin:28px 0 0;font-size:14px;color:#0f172a;">
                Cảm ơn bạn đã tin tưởng <strong>${brand}</strong>!
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:11px;color:#94a3b8;">
                Email tự động từ hệ thống — ${sentAt}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const courseLines = (p.courses || [])
    .map((c) => `- ${c.title || "Khóa học"}`)
    .join("\n");
  const text = [
    `${brand} — Kích hoạt thành công`,
    "",
    `Xin chào ${p.buyerName || "bạn"},`,
    p.introLine,
    `Mã đơn: #${p.orderTag}`,
    "",
    "Khóa học:",
    courseLines || "-",
    "",
    `Vào học: ${learnUrl}`,
    "",
    supportHotline ? `Hotline: ${supportHotline}` : "",
    supportEmail ? `Email: ${supportEmail}` : "",
    "",
    `— ${sentAt}`,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, html, text };
}

module.exports = {
  buildPurchaseActivationEmail,
  formatViTimestamp,
  escapeHtml,
};
