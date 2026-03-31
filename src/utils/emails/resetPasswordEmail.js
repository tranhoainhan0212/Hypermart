function escapeHtml(input) {
  return String(input || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function resetPasswordEmailTemplate({ resetUrl, brandName }) {
  const safeUrl = escapeHtml(resetUrl);
  const safeBrand = escapeHtml(brandName || "E-Commerce");

  return `
  <div style="font-family: ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial; line-height:1.6; color:#111827;">
    <div style="max-width:640px; margin:0 auto; padding:24px;">
      <div style="padding:20px; border:1px solid #e5e7eb; border-radius:16px; background:#ffffff;">
        <h2 style="margin:0 0 12px; font-size:18px;">Đặt lại mật khẩu - ${safeBrand}</h2>
        <p style="margin:0 0 12px; font-size:14px; color:#374151;">
          Bạn đã yêu cầu đặt lại mật khẩu. Link này có hiệu lực trong <b>30 phút</b>.
        </p>
        <div style="margin:16px 0;">
          <a href="${safeUrl}"
             style="display:inline-block; padding:10px 14px; background:#111827; color:#ffffff; text-decoration:none; border-radius:12px; font-size:14px;">
            Đặt lại mật khẩu
          </a>
        </div>
        <p style="margin:0 0 8px; font-size:12px; color:#6b7280;">
          Nếu nút không hoạt động, copy link sau và mở trên trình duyệt:
        </p>
        <p style="margin:0; font-size:12px; color:#111827; word-break:break-all;">
          ${safeUrl}
        </p>
        <hr style="border:none; border-top:1px solid #e5e7eb; margin:16px 0;" />
        <p style="margin:0; font-size:12px; color:#6b7280;">
          Nếu bạn không yêu cầu reset mật khẩu, hãy bỏ qua email này.
        </p>
      </div>
    </div>
  </div>
  `;
}

module.exports = { resetPasswordEmailTemplate };

