import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT || 587),
  secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",
  auth:
    process.env.SMTP_USER && process.env.SMTP_PASSWORD
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        }
      : undefined,
});

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendMail({ to, subject, html, text }) {
  if (!to) {
    throw new Error("Recipient email is required.");
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    throw new Error(
      "SMTP credentials are not configured. Please update SMTP_USER and SMTP_PASSWORD in .env."
    );
  }

  const info = await transporter.sendMail({
    from:
      process.env.SMTP_FROM ||
      `"Digital Lyf PVT. LTD." <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html,
  });

  return info;
}

export async function sendLoginCodeEmail({
  email,
  name,
  loginCode,
}) {
  const safeName = escapeHtml(name || "User");
  const safeCode = escapeHtml(loginCode);

  return sendMail({
    to: email,
    subject: "Your Digital Lyf Login Code",
    text: `Hello ${name || "User"}, your login code is ${loginCode}. This code will expire soon.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;">
        <h2>Digital Lyf PVT. LTD.</h2>
        <p>Hello ${safeName},</p>
        <p>Your login verification code is:</p>

        <div style="
          font-size:32px;
          font-weight:bold;
          letter-spacing:8px;
          padding:20px;
          background:#f3f4f6;
          text-align:center;
          border-radius:8px;
          margin:20px 0;
        ">
          ${safeCode}
        </div>

        <p>Please do not share this code with anyone.</p>
        <p>Regards,<br />Digital Lyf PVT. LTD.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetCodeEmail({
  email,
  name,
  resetCode,
}) {
  const safeName = escapeHtml(name || "User");
  const safeCode = escapeHtml(resetCode);

  return sendMail({
    to: email,
    subject: "Password Reset Code - Digital Lyf PVT. LTD.",
    text: `Hello ${name || "User"}, your password reset code is ${resetCode}.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;">
        <h2>Digital Lyf PVT. LTD.</h2>

        <p>Hello ${safeName},</p>

        <p>
          We received a request to reset your password.
          Use the verification code below:
        </p>

        <div style="
          font-size:32px;
          font-weight:bold;
          letter-spacing:8px;
          padding:20px;
          background:#f3f4f6;
          text-align:center;
          border-radius:8px;
          margin:20px 0;
        ">
          ${safeCode}
        </div>

        <p>
          If you did not request a password reset, you can safely ignore this email.
        </p>

        <p>
          Regards,<br />
          Digital Lyf PVT. LTD.
        </p>
      </div>
    `,
  });
}

export async function sendLoginCredentialsEmail({
  email,
  name,
  loginId,
  password,
}) {
  const safeName = escapeHtml(name || "User");
  const safeLoginId = escapeHtml(loginId);
  const safePassword = escapeHtml(password);

  return sendMail({
    to: email,
    subject: "Your Digital Lyf Login Credentials",
    text: `Hello ${name || "User"}, your login ID is ${loginId} and password is ${password}.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;">
        <h2>Digital Lyf PVT. LTD.</h2>

        <p>Hello ${safeName},</p>

        <p>Your account has been created successfully.</p>

        <div style="
          background:#f3f4f6;
          padding:20px;
          border-radius:8px;
          margin:20px 0;
        ">
          <p>
            <strong>Login ID:</strong>
            ${safeLoginId}
          </p>

          <p>
            <strong>Password:</strong>
            ${safePassword}
          </p>
        </div>

        <p>
          Please change your password after your first login.
        </p>

        <p>
          Regards,<br />
          Digital Lyf PVT. LTD.
        </p>
      </div>
    `,
  });
}

export async function verifyMailerConnection() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    return {
      success: false,
      message: "SMTP credentials are not configured.",
    };
  }

  await transporter.verify();

  return {
    success: true,
    message: "SMTP connection is working.",
  };
}