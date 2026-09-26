import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT || 587),
  secure: process.env.MAIL_SECURE === "true",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});

export const sendLoginCredentialsEmail = async ({
  email,
  name,
  loginId,
  password,
}) => {
  const mailOptions = {
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to: email,
    subject: "Your Samarth Login Credentials",
    html: `
      <div style="margin:0;padding:30px;background:#f8fafc;font-family:Arial,sans-serif;">
        <div style="max-width:600px;margin:auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
          
          <div style="padding:24px;background:#2563eb;color:#ffffff;">
            <h1 style="margin:0;font-size:24px;">Samarth</h1>
            <p style="margin:6px 0 0;font-size:14px;">
              Welcome to Samarth Platform
            </p>
          </div>

          <div style="padding:28px;">
            <h2 style="margin-top:0;color:#0f172a;">
              Welcome, ${name}
            </h2>

            <p style="color:#475569;line-height:1.6;">
              Your Samarth customer account has been created successfully.
              You can use the following credentials to login.
            </p>

            <div style="margin:24px 0;padding:20px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
              <p style="margin:0 0 12px;color:#64748b;font-size:13px;">
                Login ID
              </p>

              <p style="margin:0;color:#0f172a;font-size:18px;font-weight:bold;">
                ${loginId}
              </p>

              <p style="margin:20px 0 12px;color:#64748b;font-size:13px;">
                Password
              </p>

              <p style="margin:0;color:#0f172a;font-size:18px;font-weight:bold;">
                ${password}
              </p>
            </div>

            <p style="color:#475569;line-height:1.6;">
              Please keep your login credentials secure and do not share your
              password with anyone.
            </p>

            <p style="margin-top:28px;color:#64748b;font-size:13px;">
              Regards,<br />
              <strong>Samarth Team</strong>
            </p>
          </div>
        </div>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};