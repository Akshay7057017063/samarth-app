
import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
const smtpPort = Number(process.env.SMTP_PORT || 587);

const smtpSecure =
  process.env.SMTP_SECURE !== undefined
    ? process.env.SMTP_SECURE.toLowerCase() === "true"
    : smtpPort === 465;

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,

  auth:
    process.env.SMTP_USER && process.env.SMTP_PASSWORD
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        }
      : undefined,

  tls: {
    rejectUnauthorized: true,
    servername: smtpHost,
  },

  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 30000,
});


// =====================================================
// HTML ESCAPE HELPER
// =====================================================

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// =====================================================
// GENERIC SEND MAIL
// =====================================================

export async function sendMail({
  to,
  subject,
  html,
  text,
}) {
  if (!to) {
    throw new Error("Recipient email is required.");
  }

  if (
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASSWORD
  ) {
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

// =====================================================
// LOGIN CODE EMAIL
// =====================================================

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

    text:
      `Hello ${name || "User"}, ` +
      `your login code is ${loginCode}. ` +
      `This code will expire soon.`,

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

        <p>
          Regards,<br />
          Digital Lyf PVT. LTD.
        </p>
      </div>
    `,
  });
}

// =====================================================
// PASSWORD RESET CODE EMAIL
// =====================================================

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

    text:
      `Hello ${name || "User"}, ` +
      `your password reset code is ${resetCode}.`,

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
          If you did not request a password reset,
          you can safely ignore this email.
        </p>

        <p>
          Regards,<br />
          Digital Lyf PVT. LTD.
        </p>
      </div>
    `,
  });
}

// =====================================================
// LOGIN CREDENTIALS EMAIL
// =====================================================

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

    text:
      `Hello ${name || "User"}, ` +
      `your login ID is ${loginId} ` +
      `and password is ${password}.`,

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

// =====================================================
// ACTIVATION PIN EMAIL
// =====================================================

export async function sendActivationPinEmail({
  email,
  name,
  memberId,
  pin,
  pinType = "unpaid",
  expiresAt,
}) {
  const normalizedPinType =
    String(pinType || "unpaid").toLowerCase();

  const typeLabel =
    normalizedPinType === "paid"
      ? "PAID"
      : "UNPAID";

  const safeName = escapeHtml(
    name || "Customer"
  );

  const safeMemberId = escapeHtml(
    memberId || ""
  );

  const safePin = escapeHtml(pin);

  // Convert expiry time to Indian time
  const expiryText = expiresAt
    ? new Date(expiresAt).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "short",
      }) + " (IST)"
    : "24 hours from now";

  const safeExpiry = escapeHtml(
    expiryText
  );

  return sendMail({
    to: email,

    subject:
      "Your Account Activation PIN - Digital Lyf PVT. LTD.",

    // =================================================
    // PLAIN TEXT EMAIL
    // =================================================

    text:
      `DIGITAL LYF PVT. LTD.\n\n` +
      `Hello ${name || "Customer"},\n\n` +
      `Your account activation PIN is: ${pin}\n\n` +
      `Member ID: ${memberId}\n` +
      `PIN Type: ${typeLabel}\n` +
      `PIN Expires: ${expiryText}\n\n` +
      `After successful activation, you can login to your account.\n\n` +
      `Do not share your activation PIN with anyone.\n\n` +
      `Regards,\n` +
      `Digital Lyf PVT. LTD.`,

    // =================================================
    // HTML EMAIL
    // =================================================

    html: `
      <div style="
        font-family:Arial,sans-serif;
        max-width:600px;
        margin:auto;
        padding:24px;
        color:#111827;
      ">

        <h2>
          DIGITAL LYF PVT. LTD.
        </h2>

        <p>
          Hello ${safeName},
        </p>

        <p>
          Your account has been created successfully.
          To activate your account, use the activation PIN below.
        </p>

        <!-- ACTIVATION PIN -->

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
          ${safePin}
        </div>

        <!-- ACCOUNT INFORMATION -->

        <div style="
          background:#f9fafb;
          padding:16px;
          border-radius:8px;
          margin:20px 0;
        ">

          <p>
            <strong>Member ID:</strong>
            ${safeMemberId}
          </p>

          <p>
            <strong>PIN Type:</strong>
            ${typeLabel}
          </p>

          <p>
            <strong>PIN Expires:</strong>
            ${safeExpiry}
          </p>

        </div>

        <p>
          Enter this PIN on the account activation page.
        </p>

        <p>
          After successful activation, you can login to your account.
        </p>

        <p>
          <strong>
            Do not share your activation PIN with anyone.
          </strong>
        </p>

        <p>
          Regards,<br />
          Digital Lyf PVT. LTD.
        </p>

      </div>
    `,
  });
}

// =====================================================
// VERIFY SMTP CONNECTION
// =====================================================

export async function verifyMailerConnection() {
  if (
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASSWORD
  ) {
    return {
      success: false,
      message:
        "SMTP credentials are not configured.",
    };
  }

  await transporter.verify();

  return {
    success: true,
    message:
      "SMTP connection is working.",
  };
}