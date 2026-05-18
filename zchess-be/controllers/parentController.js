const crypto = require("crypto");
const Parent = require("../models/Parents");
const User = require("../models/User");
const Student = require("../models/Student");
const asyncHandler = require("../middleware/asyncHandler");

const PARENT_UPDATABLE_FIELDS = ["fullName", "email", "phone", "address", "avatarUrl"];

const pickParentPatch = (body = {}) => {
  const patch = {};
  PARENT_UPDATABLE_FIELDS.forEach((field) => {
    if (body[field] !== undefined) {
      patch[field] = typeof body[field] === "string" ? body[field].trim() : body[field];
    }
  });
  return patch;
};

const generateTempPassword = () => {
  // 12 ký tự alphanum, đủ entropy cho temp password và bắt đổi sau khi đăng nhập đầu.
  return crypto.randomBytes(9).toString("base64").replace(/[+/=]/g, "").slice(0, 12);
};

exports.getAllParents = asyncHandler(async (req, res) => {
  const parents = await User.find({ role: { $regex: /^parent$/i } });
  res.json(parents);
});

exports.getParentById = asyncHandler(async (req, res) => {
  if (req.user?.role === "Parent" && String(req.user._id) !== String(req.params.id)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  const parent = await User.findOne({
    _id: req.params.id,
    role: { $regex: /^parent$/i },
  });
  if (!parent)
    return res.status(404).json({ message: "Không tìm thấy phụ huynh" });
  res.json(parent);
});

exports.createParent = asyncHandler(async (req, res) => {
  const { fullName, phone, email, address } = req.body;

  const username = phone;
  const password = generateTempPassword();
  const emailToUse = email || `${phone}@zchess.com`;

  const existingUser = await User.findOne({
    $or: [{ username }, { email: emailToUse }, { phone: phone }],
  });

  if (existingUser) {
    if (existingUser.phone === phone)
      return res.status(400).json({ message: "Số điện thoại này đã được đăng ký" });
    if (existingUser.email === emailToUse)
      return res.status(400).json({ message: "Email này đã được sử dụng" });
    return res
      .status(400)
      .json({ message: "Phụ huynh với số điện thoại hoặc email này đã tồn tại" });
  }

  const parent = new Parent({
    username,
    password,
    fullName,
    phone,
    email: emailToUse,
    address,
    role: "Parent",
  });

  try {
    await parent.save();
    // Trả mật khẩu tạm 1 lần để Admin chuyển tới phụ huynh; tránh log/persist nơi khác.
    const payload = parent.toObject ? parent.toObject() : { ...parent };
    delete payload.password;
    payload.tempPassword = password;
    res.status(201).json(payload);
  } catch (err) {
    if (err.code === 11000) {
      if (err.keyPattern?.phone)
        return res.status(400).json({ message: "Số điện thoại này đã được đăng ký" });
      if (err.keyPattern?.email)
        return res.status(400).json({ message: "Email này đã được sử dụng" });
    }
    throw err;
  }
});

exports.updateParent = asyncHandler(async (req, res) => {
  if (req.user?.role === "Parent" && String(req.user._id) !== String(req.params.id)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  if (req.body.phone) {
    const duplicate = await User.findOne({
      phone: req.body.phone,
      _id: { $ne: req.params.id },
      role: { $regex: /^parent$/i },
    });
    if (duplicate) {
      return res
        .status(400)
        .json({ message: "Số điện thoại này đã được sử dụng bởi tài khoản khác" });
    }
  }

  try {
    // Whitelist trường được sửa: tránh PH/Admin "leo quyền" qua role/password/isDeleted...
    const patch = pickParentPatch(req.body);
    const parent = await User.findOneAndUpdate(
      { _id: req.params.id, role: { $regex: /^parent$/i } },
      { $set: patch },
      { new: true, runValidators: true },
    );
    if (!parent)
      return res.status(404).json({ message: "Không tìm thấy phụ huynh" });
    res.json(parent);
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.phone) {
      return res
        .status(400)
        .json({ message: "Số điện thoại này đã được sử dụng bởi tài khoản khác" });
    }
    throw err;
  }
});

exports.deleteParent = asyncHandler(async (req, res) => {
  const deletedParent = await User.findOneAndDelete({
    _id: req.params.id,
    role: { $regex: /^parent$/i },
  });
  if (!deletedParent) {
    return res.status(404).json({ message: "Không tìm thấy phụ huynh" });
  }

  await Student.updateMany(
    { parentId: req.params.id, isDeleted: { $ne: true } },
    { $set: { isDeleted: true, deletedAt: new Date() } },
  );

  res.json({
    message: "Đã xóa phụ huynh và các học viên liên quan",
    deletedId: req.params.id,
  });
});

exports.getParentStudents = asyncHandler(async (req, res) => {
  if (req.user?.role === "Parent" && String(req.user._id) !== String(req.params.id)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  const students = await Student.find({
    parentId: req.params.id,
    isDeleted: { $ne: true },
  });
  res.json(students);
});
