
import express from "express";
import {
  sendMail,
  verifyMailerConnection,
} from "../utils/mailer.js";

const router = express.Router();

function isValidEmail(value) {
  if (typeof value !== "string") return false;

  const email = value.trim();

  return (
    email.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );
}

// GET /api/test-email?to=your@email.com
router.get("/test-email", async (req, res) => {
  try {
    const rawTo = req.query.to ?? process.env.SMTP_USER;

    if (typeof rawTo !== "string" || !rawTo.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Recipient email is required. Use /api/test-email?to=your@email.com",
      });
    }

    const to = rawTo.trim();

    if (!isValidEmail(to)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid recipient email address.",
      });
    }

    // Check SMTP configuration and connection
    const smtpStatus = await verifyMailerConnection();

    if (!smtpStatus?.success) {
      console.error(
        "SMTP verification failed:",
        smtpStatus?.message
      );

      return res.status(503).json({
        success: false,
        message: "SMTP connection verification failed.",
      });
    }

    // Send test email
    const info = await sendMail({
      to,
      subject: "SMTP Test Email - Digital Lyf PVT. LTD.",
      text:
        "Hello,\n\n" +
        "This is a test email from Digital Lyf PVT. LTD.\n\n" +
        "The email server accepted your message for sending.\n\n" +
        "Regards,\nDigital Lyf PVT. LTD.",

      html: `
        <div style="font-family:Arial,sans-serif;
                    max-width:600px;margin:auto;padding:24px;
                    color:#111827;">
          <h2>Digital Lyf PVT. LTD.</h2>
          <p>Hello,</p>
          <p>This is a test email from the Digital Lyf backend.</p>
          <div style="background:#f3f4f6;padding:20px;
                      border-radius:8px;margin:20px 0;">
            <strong>SMTP Status:</strong> Email accepted for sending.
          </div>
          <p>Please check your inbox and spam folder.</p>
          <p>Regards,<br />Digital Lyf PVT. LTD.</p>
        </div>
      `,
    });

    console.info("Test email accepted by SMTP:", {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    });

    return res.status(200).json({
      success: true,
      message: "Test email accepted by SMTP for delivery.",
      to,
      messageId: info.messageId,
    });
  } catch (error) {
    // Detailed error stays in server logs
    console.error("TEST EMAIL ERROR:", {
      message: error.message,
      code: error.code,
      command: error.command,
      responseCode: error.responseCode,
    });

    return res.status(500).json({
      success: false,
      message:
        "Failed to send test email. Check server logs and SMTP settings.",
    });
  }
});

export default router;