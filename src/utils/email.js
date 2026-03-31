const nodemailer = require("nodemailer");

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

async function sendMail({ to, subject, html }) {
  const transport = createTransport();
  if (!transport) {
    // In dev environments without SMTP configured, we don't hard-fail.
    // eslint-disable-next-line no-console
    console.warn("SMTP not configured. Email not sent.", { to, subject });
    return;
  }

  await transport.sendMail({
    from: process.env.EMAIL_FROM || "no-reply@ecommerce.local",
    to,
    subject,
    html,
  });
}

module.exports = { sendMail };

