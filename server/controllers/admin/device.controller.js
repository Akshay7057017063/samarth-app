import mongoose from "mongoose";

import { User } from "../../models/User.js";
import { UserDevice } from "../../models/UserDevice.js";
import {
  sendDeviceApprovedEmail,
  sendDeviceRejectedEmail,
} from "../../utils/deviceEmail.js";

const trySendEmail = async (sender, userId, extra = {}) => {
  try {
    const customer = await User.findById(userId).select("name email");
    if (!customer?.email) return false;
    await sender({ email: customer.email, name: customer.name, ...extra });
    return true;
  } catch (error) {
    console.error("Device email error:", error.message);
    return false;
  }
};

// =====================================================
// ADMIN DEVICE MANAGEMENT
// =====================================================

const isObjectId = (v) => mongoose.Types.ObjectId.isValid(v);

const findCustomer = async (idOrCode) => {
  const value = String(idOrCode || "").trim();
  if (!value) return null;

  if (isObjectId(value)) {
    const byId = await User.findById(value);
    if (byId) return byId;
  }

  return User.findOne({
    $or: [
      { memberId: value.toUpperCase() },
      { userCode: value.toUpperCase() },
    ],
  });
};

const adminSummary = (admin) =>
  admin?._id ? String(admin._id) : admin?.id || null;

const formatDevice = (d, usersById = {}, adminsById = {}) => {
  const o = d.toObject ? d.toObject() : d;
  const customer = usersById[String(o.userId)];

  return {
    _id: String(o._id),
    userId: String(o.userId),
    memberId: o.memberId,
    customerName: customer?.name || "",
    customerPhone: customer?.phone || "",
    deviceIdShort: String(o.deviceId || "").slice(0, 12),
    deviceLabel: o.deviceLabel,
    userAgent: o.userAgent,
    lastIp: o.lastIp,
    status: o.status,
    activatedVia: o.activatedVia,
    registeredAt: o.registeredAt,
    requestedAt: o.requestedAt,
    approvedAt: o.approvedAt,
    revokedAt: o.revokedAt,
    rejectedAt: o.rejectedAt,
    lastLoginAt: o.lastLoginAt,
    approvedByName: adminsById[String(o.approvedBy)]?.name || "",
    revokedByName: adminsById[String(o.revokedBy)]?.name || "",
    rejectedByName: adminsById[String(o.rejectedBy)]?.name || "",
    replacedDeviceIdShort: String(o.replacedDeviceId || "").slice(0, 12),
    adminNote: o.adminNote,
    identityVerified: o.identityVerified,
  };
};

const hydrate = async (devices) => {
  const userIds = [...new Set(devices.map((d) => String(d.userId)))];
  const adminIds = [
    ...new Set(
      devices
        .flatMap((d) => [d.approvedBy, d.revokedBy, d.rejectedBy])
        .filter(Boolean)
        .map(String)
    ),
  ];

  const [users, admins] = await Promise.all([
    User.find({ _id: { $in: userIds } }).select("name phone"),
    adminIds.length
      ? User.find({ _id: { $in: adminIds } }).select("name")
      : [],
  ]);

  const usersById = Object.fromEntries(users.map((u) => [String(u._id), u]));
  const adminsById = Object.fromEntries(admins.map((a) => [String(a._id), a]));

  return devices.map((d) => formatDevice(d, usersById, adminsById));
};

// GET /api/admin/devices?status=pending|active|revoked|rejected|all
export const listDevices = async (req, res) => {
  try {
    const status = String(req.query.status || "pending");
    const filter = {};

    if (status !== "all") filter.status = status;

    const search = String(req.query.search || "").trim().toUpperCase();
    if (search) filter.memberId = { $regex: search, $options: "i" };

    const devices = await UserDevice.find(filter)
      .sort({ requestedAt: -1, updatedAt: -1 })
      .limit(300);

    return res.json({
      success: true,
      devices: await hydrate(devices),
    });
  } catch (error) {
    console.error("❌ List devices error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to load devices." });
  }
};

// GET /api/admin/customers/:id/devices
export const getCustomerDevices = async (req, res) => {
  try {
    const customer = await findCustomer(req.params.id);
    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found." });
    }

    const devices = await UserDevice.find({ userId: customer._id }).sort({
      updatedAt: -1,
    });

    return res.json({
      success: true,
      devices: await hydrate(devices),
    });
  } catch (error) {
    console.error("❌ Customer devices error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to load customer devices." });
  }
};

// POST /api/admin/devices/:deviceId/approve
// body: { identityVerified: true, note?: string }
export const approveDevice = async (req, res) => {
  try {
    if (req.body?.identityVerified !== true) {
      return res.status(400).json({
        success: false,
        message:
          "Confirm that you verified the customer's identity before approving a new device.",
      });
    }

    if (!isObjectId(req.params.deviceId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid device id." });
    }

    const pending = await UserDevice.findOne({
      _id: req.params.deviceId,
      status: "pending",
    });

    if (!pending) {
      return res.status(404).json({
        success: false,
        message: "Pending device request not found.",
      });
    }

    const adminId = adminSummary(req.user);
    const now = new Date();

    // 1) Revoke the current active device (if any)
    const oldActive = await UserDevice.findOneAndUpdate(
      { userId: pending.userId, status: "active" },
      {
        $set: {
          status: "revoked",
          revokedAt: now,
          revokedBy: adminId,
          adminNote: "Replaced by admin-approved device.",
        },
      },
      { new: true }
    );

    // 2) Activate the new device
    try {
      pending.status = "active";
      pending.approvedAt = now;
      pending.approvedBy = adminId;
      pending.activatedVia = "admin_approval";
      pending.identityVerified = true;
      pending.adminNote = String(req.body?.note || "").trim().slice(0, 300);
      pending.replacedDeviceId = oldActive?.deviceId || "";
      await pending.save();
    } catch (saveError) {
      // Restore previous device if activation failed
      if (oldActive) {
        await UserDevice.updateOne(
          { _id: oldActive._id },
          {
            $set: {
              status: "active",
              revokedAt: null,
              revokedBy: null,
              adminNote: "",
            },
          }
        );
      }
      throw saveError;
    }

    // 3) Invalidate every existing session/token of the customer
    await User.updateOne(
      { _id: pending.userId },
      { $inc: { sessionVersion: 1 } }
    );

    return res.json({
      success: true,
      message:
        "New device approved. Old device and all previous sessions were revoked. " + ((await trySendEmail(sendDeviceApprovedEmail, pending.userId, { deviceLabel: pending.deviceLabel })) ? "Email sent to customer." : "Email could not be sent."),
    });
  } catch (error) {
    console.error("❌ Approve device error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to approve device." });
  }
};

// POST /api/admin/devices/:deviceId/reject  body: { note?: string }
export const rejectDevice = async (req, res) => {
  try {
    if (!isObjectId(req.params.deviceId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid device id." });
    }

    const device = await UserDevice.findOneAndUpdate(
      { _id: req.params.deviceId, status: "pending" },
      {
        $set: {
          status: "rejected",
          rejectedAt: new Date(),
          rejectedBy: adminSummary(req.user),
          adminNote: String(req.body?.note || "").trim().slice(0, 300),
        },
      },
      { new: true }
    );

    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Pending device request not found.",
      });
    }

    return res.json({
      success: true,
      message: "Device request rejected. " + ((await trySendEmail(sendDeviceRejectedEmail, device.userId, { deviceLabel: device.deviceLabel, note: device.adminNote })) ? "Email sent to customer." : "Email could not be sent."),
    });
  } catch (error) {
    console.error("❌ Reject device error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to reject device." });
  }
};

// POST /api/admin/customers/:id/devices/revoke
// body: { identityVerified: true, note?: string }
// Removes the active device and all sessions. The next login
// (after the customer was verified) registers a fresh device.
export const revokeActiveDevice = async (req, res) => {
  try {
    if (req.body?.identityVerified !== true) {
      return res.status(400).json({
        success: false,
        message:
          "Confirm that you verified the customer's identity before resetting the device.",
      });
    }

    const customer = await findCustomer(req.params.id);
    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found." });
    }

    const revoked = await UserDevice.findOneAndUpdate(
      { userId: customer._id, status: "active" },
      {
        $set: {
          status: "revoked",
          revokedAt: new Date(),
          revokedBy: adminSummary(req.user),
          identityVerified: true,
          adminNote: String(req.body?.note || "").trim().slice(0, 300),
        },
      },
      { new: true }
    );

    await User.updateOne(
      { _id: customer._id },
      { $inc: { sessionVersion: 1 } }
    );

    return res.json({
      success: true,
      message: revoked
        ? "Device revoked. The customer's next login will register a new device."
        : "No active device found. All sessions were reset.",
    });
  } catch (error) {
    console.error("❌ Revoke device error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to revoke device." });
  }
};
