const Inquiry = require("../models/Inquiry");
const asyncHandler = require("../middleware/asyncHandler");
const { notifyAdmins } = require("../modules/notifications/helpers/notifyUsers");

exports.createLead = asyncHandler(async (req, res) => {
  const { name, email, phone, message } = req.body;
  const doc = await Inquiry.create({
    name: name || "Lead",
    email: email || "",
    phone: phone || "0000000000",
    message: message || "",
    type: "General",
    status: "New",
  });

  await notifyAdmins({
    title: "Có phụ huynh liên hệ mới",
    content: `Liên hệ mới từ ${name || "Phụ huynh"}${phone ? ` - SĐT: ${phone}` : ""}`,
    targetPath: "/crm/inquiries",
    type: "LEAD_CREATED",
  });

  res.status(201).json({ ok: true, inquiry: doc });
});
