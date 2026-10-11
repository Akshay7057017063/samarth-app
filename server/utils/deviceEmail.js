import { sendMail } from "./mailer.js";
import { escapeHtml } from "./adminHelpers.js";

const COMPANY_NAME = "DIGITAL LYF PVT. LTD.";

const buildHtml = ({ title, color, name, lines }) => `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
  <div style="background:${color};color:#fff;padding:18px 24px;font-size:18px;font-weight:bold">${escapeHtml(title)}</div>
  <div style="padding:24px;color:#1e293b;font-size:14px;line-height:1.6">
    <p>Hello ${escapeHtml(name)},</p>
    ${lines.map((l) => `<p>${escapeHtml(l)}</p>`).join("")}
    <p style="margin-top:24px;color:#64748b;font-size:12px">${escapeHtml(COMPANY_NAME)}</p>
  </div>
</div>`;

const shortDevice = (label) =>
  String(label || "your new device").trim() || "your new device";

export const sendDeviceApprovedEmail = async ({
  email,
  name,
  deviceLabel,
}) => {
  if (!email) return;
  const displayName = String(name || "Customer").trim();
  const lines = [
    `Your new device (${shortDevice(deviceLabel)}) has been approved by admin.`,
    "You can now login on this device. Your previous device has been logged out and can no longer access your account.",
    "If you did not request this change, please contact admin immediately.",
  ];

  await sendMail({
    to: email,
    subject: `Device Approved - ${COMPANY_NAME}`,
    text: `Hello ${displayName},\n\n${lines.join("\n\n")}\n\n${COMPANY_NAME}`,
    html: buildHtml({
      title: "Device Approved",
      color: "#059669",
      name: displayName,
      lines,
    }),
  });
};

export const sendDeviceRejectedEmail = async ({
  email,
  name,
  deviceLabel,
  note,
}) => {
  if (!email) return;
  const displayName = String(name || "Customer").trim();
  const lines = [
    `Your request to use a new device (${shortDevice(deviceLabel)}) was rejected by admin.`,
    ...(note ? [`Reason: ${note}`] : []),
    "Your account continues to work only on your registered device. Please contact admin if you need help.",
  ];

  await sendMail({
    to: email,
    subject: `Device Request Rejected - ${COMPANY_NAME}`,
    text: `Hello ${displayName},\n\n${lines.join("\n\n")}\n\n${COMPANY_NAME}`,
    html: buildHtml({
      title: "Device Request Rejected",
      color: "#dc2626",
      name: displayName,
      lines,
    }),
  });
};