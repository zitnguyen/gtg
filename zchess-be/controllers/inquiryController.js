const Inquiry = require("../models/Inquiry");
const asyncHandler = require("../middleware/asyncHandler");
const { notifyAdmins } = require("../modules/notifications/helpers/notifyUsers");

exports.createInquiry = asyncHandler(async (req, res) => {
  const { name, email, phone, message, type } = req.body;

  const inquiry = new Inquiry({
    name,
    email,
    phone,
    message,
    type,
  });

  await inquiry.save();

  await notifyAdmins({
    title: "Có phụ huynh liên hệ mới",
    content: `Liên hệ mới từ ${name || "Phụ huynh"}${
      phone ? ` - SĐT: ${phone}` : ""
    }${type ? ` - Loại: ${type}` : ""}`,
    targetPath: "/crm/inquiries",
    type: "INQUIRY_CREATED",
  });

  res.status(201).json({ message: "Inquiry submitted successfully", inquiry });
});

exports.getInquiries = asyncHandler(async (req, res) => {
  const inquiries = await Inquiry.find().sort({ createdAt: -1 });
  res.json(inquiries);
});

exports.updateInquiry = asyncHandler(async (req, res) => {
  const inquiry = await Inquiry.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!inquiry) return res.status(404).json({ message: "Inquiry not found" });
  res.json(inquiry);
});

exports.deleteInquiry = asyncHandler(async (req, res) => {
  const inquiry = await Inquiry.findByIdAndDelete(req.params.id);
  if (!inquiry) return res.status(404).json({ message: "Inquiry not found" });
  res.json({ message: "Đã xóa liên hệ", id: req.params.id });
});
