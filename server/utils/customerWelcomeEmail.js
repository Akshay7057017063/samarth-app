import { sendMail } from "./mailer.js";
import { escapeHtml } from "./adminHelpers.js";

const COMPANY_NAME = "DIGITAL LYF PVT. LTD.";
const DEFAULT_FRONTEND_URL = "http://localhost:5173";

// =====================================================
// HELPERS
// =====================================================

// Only allow http/https URLs; otherwise fall back to the default.
const getFrontendUrl = () => {
  const raw = String(
    process.env.CUSTOMER_FRONTEND_URL || DEFAULT_FRONTEND_URL
  ).trim();

  try {
    const url = new URL(raw);

    return ["http:", "https:"].includes(url.protocol)
      ? url.toString()
      : DEFAULT_FRONTEND_URL;
  } catch {
    return DEFAULT_FRONTEND_URL;
  }
};

// =====================================================
// SEND CUSTOMER WELCOME EMAIL
// =====================================================

export const sendCustomerWelcomeEmail = async ({ email, name, memberId }) => {
  if (!email) {
    throw new Error("Customer email is required to send the welcome email.");
  }

  const displayName = String(name || "Customer").trim();
  const displayMemberId = String(memberId || "").trim();
  const frontendUrl = getFrontendUrl();

  const safeName = escapeHtml(displayName);
  const safeEmail = escapeHtml(email);
  const safeMemberId = escapeHtml(displayMemberId);
  const safeFrontendUrl = escapeHtml(frontendUrl);
  const safeCompany = escapeHtml(COMPANY_NAME);

  const year = new Date().getFullYear();

  await sendMail({
    to: email,

    subject: `Welcome to ${COMPANY_NAME} - Registration Successful`,

    text: `
Welcome to ${COMPANY_NAME}

Hello ${displayName},

Your registration has been successfully completed.

Your Member ID: ${displayMemberId}
Registered Email: ${email}

You can now access your ${COMPANY_NAME} account.

Website:
${frontendUrl}

Thank you for joining ${COMPANY_NAME}.

Regards,
${COMPANY_NAME}
    `.trim(),

    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to ${safeCompany}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;">

  <!-- Preheader (inbox preview text) -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#f8fafc;">
    Your registration is complete. Your Member ID is ${safeMemberId}.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="background:#f8fafc;padding:30px 15px;font-family:Arial,Helvetica,sans-serif;">
    <tr>
      <td align="center">

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
          style="max-width:600px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding:25px;background:#0f172a;color:#ffffff;">
              <h1 style="margin:0;font-size:24px;color:#ffffff;">${safeCompany}</h1>
              <p style="margin:8px 0 0;font-size:14px;color:#cbd5e1;">Welcome to our platform</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:30px;">

              <h2 style="margin:0 0 15px;color:#0f172a;font-size:22px;">Welcome, ${safeName}!</h2>

              <p style="margin:0;color:#475569;font-size:15px;line-height:1.7;">
                Your registration with <strong>${safeCompany}</strong>
                has been successfully completed.
              </p>

              <!-- Member card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                style="margin:25px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 10px;font-size:14px;color:#64748b;">Your Member ID</p>
                    <p style="margin:0;font-size:26px;font-weight:700;letter-spacing:1px;color:#2563eb;">${safeMemberId}</p>
                    <p style="margin:18px 0 0;font-size:14px;color:#64748b;">Registered Email</p>
                    <p style="margin:5px 0 0;font-size:15px;font-weight:600;color:#0f172a;">${safeEmail}</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 20px;color:#475569;font-size:14px;line-height:1.7;">
                Your account has been created successfully.
                You can now use your registered credentials to access the platform.
              </p>

              <!-- Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <a href="${safeFrontendUrl}" target="_blank" rel="noopener noreferrer"
                      style="display:inline-block;padding:13px 24px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:600;">
                      Visit DIGITAL LYF
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:25px 0 0;color:#64748b;font-size:13px;line-height:1.6;">
                Thank you for joining <strong>${safeCompany}</strong>
              </p>

              <p style="margin:20px 0 0;color:#0f172a;font-size:14px;line-height:1.6;">
                Regards,<br />
                <strong>${safeCompany}</strong>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:16px;background:#f8fafc;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                &copy; ${year} ${safeCompany}. All rights reserved.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
    `,
  });
};