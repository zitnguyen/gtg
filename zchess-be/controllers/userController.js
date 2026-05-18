const User = require("../models/User");
const Teacher = require("../models/Teacher");
const Class = require("../models/Class");
const bcrypt = require("bcryptjs");
const asyncHandler = require("../middleware/asyncHandler");

const VALID_TRAINING_LEVELS = ["beginner", "intermediate", "advanced"];

exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id || req.user.id).select("-password");
  if (!user) {
    return res.status(404).json({ message: "Không tìm thấy người dùng" });
  }
  const doc = user.toObject ? user.toObject() : user;
  if (!Number.isFinite(doc.elo) || doc.elo < 100) {
    await User.findByIdAndUpdate(user._id, { elo: 100 });
    doc.elo = 100;
  }
  res.json(doc);
});

exports.updateMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id || req.user.id);
  if (!user) {
    return res.status(404).json({ message: "Không tìm thấy người dùng" });
  }

  const { fullName, phone, avatarUrl } = req.body;
  if (typeof fullName === "string") {
    const trimmed = fullName.trim();
    if (!trimmed) {
      return res.status(400).json({ message: "Họ tên không được để trống" });
    }
    user.fullName = trimmed;
  }
  if (typeof phone === "string") {
    user.phone = phone.trim();
  }
  if (typeof avatarUrl === "string") {
    user.avatarUrl = avatarUrl.trim();
  }

  await user.save();
  const doc = user.toObject ? user.toObject() : user;
  delete doc.password;
  res.json(doc);
});

exports.changeMyPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "Vui lòng nhập mật khẩu hiện tại và mật khẩu mới" });
  }
  if (String(newPassword).length < 6) {
    return res.status(400).json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự" });
  }

  const user = await User.findById(req.user._id || req.user.id);
  if (!user) {
    return res.status(404).json({ message: "Không tìm thấy người dùng" });
  }

  const matched = await user.matchPassword(currentPassword);
  if (!matched) {
    return res.status(400).json({ message: "Mật khẩu hiện tại không đúng" });
  }

  user.password = newPassword;
  await user.save();
  res.json({ message: "Đổi mật khẩu thành công" });
});

exports.createUser = asyncHandler(async (req, res) => {
  const {
    username,
    fullName,
    email,
    phone,
    password,
    role,
    specialization,
    trainingLevel,
    experienceYears,
    certification,
    avatarUrl,
    lastname,
    firstname,
  } = req.body;

  const normalizedEmailInput = String(email || "").trim().toLowerCase();
  const normalizedUsername = String(username || "").trim();
  const normalizedPhoneInput = String(phone || "").trim();
  const normalizedEmail = normalizedEmailInput || undefined;
  const normalizedPhone = normalizedPhoneInput || undefined;

  const duplicateConditions = [];
  if (normalizedEmailInput) duplicateConditions.push({ email: normalizedEmailInput });
  if (normalizedUsername) duplicateConditions.push({ username: normalizedUsername });
  if (normalizedPhoneInput) duplicateConditions.push({ phone: normalizedPhoneInput });

  const userExists = duplicateConditions.length
    ? await User.findOne({ $or: duplicateConditions }).select(
        "email username phone",
      )
    : null;
  if (userExists) {
    let duplicateField = "thông tin";
    if (normalizedEmailInput && userExists.email === normalizedEmailInput)
      duplicateField = "email";
    else if (normalizedUsername && userExists.username === normalizedUsername)
      duplicateField = "tên đăng nhập";
    else if (normalizedPhoneInput && userExists.phone === normalizedPhoneInput)
      duplicateField = "số điện thoại";

    return res
      .status(409)
      .json({ message: `Người dùng đã tồn tại (${duplicateField} bị trùng)` });
  }

  const finalFullName = String(fullName || `${lastname || ""} ${firstname || ""}`).trim();
  const normalizedExperienceYearsInput = String(experienceYears ?? "").trim();
  const normalizedExperienceYears = normalizedExperienceYearsInput
    ? Number(normalizedExperienceYearsInput)
    : undefined;
  if (
    normalizedExperienceYearsInput &&
    !Number.isFinite(normalizedExperienceYears)
  ) {
    return res
      .status(400)
      .json({ message: "Số năm kinh nghiệm phải là một số hợp lệ" });
  }

  let user;
  if (role === "Teacher") {
    const normalizedTrainingLevel = String(trainingLevel || "").trim().toLowerCase();
    if (!VALID_TRAINING_LEVELS.includes(normalizedTrainingLevel)) {
      return res.status(400).json({
        message:
          "Vui lòng chọn cấp độ huấn luyện hợp lệ (cơ bản, trung cấp, nâng cao)",
      });
    }

    const teacherPayload = {
      username: normalizedUsername,
      fullName: finalFullName,
      password,
      role,
      specialization: String(specialization || "").trim(),
      trainingLevel: normalizedTrainingLevel,
      certification: String(certification || "").trim(),
      avatarUrl: avatarUrl || "",
    };
    if (normalizedEmail) teacherPayload.email = normalizedEmail;
    if (normalizedPhone) teacherPayload.phone = normalizedPhone;
    if (normalizedExperienceYears !== undefined)
      teacherPayload.experienceYears = normalizedExperienceYears;
    user = await Teacher.create(teacherPayload);
  } else {
    const userPayload = {
      username: normalizedUsername,
      fullName: finalFullName,
      password,
      role: role || "Parent",
      avatarUrl: avatarUrl || "",
      elo: 100,
    };
    if (normalizedEmail) userPayload.email = normalizedEmail;
    if (normalizedPhone) userPayload.phone = normalizedPhone;
    if (req.body.linkedStudentId) {
      userPayload.linkedStudentId = req.body.linkedStudentId;
    }
    user = await User.create(userPayload);
  }

  res.status(201).json({
    _id: user._id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
  });
});

exports.getAllUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  const users = await User.find(filter);
  res.json(users);
});

exports.getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "Không tìm thấy người dùng" });
  }
  res.json(user);
});

exports.updateUser = asyncHandler(async (req, res) => {
  const { password, ...updateData } = req.body;

  let user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "Không tìm thấy người dùng" });
  }
  if (password && password.trim() !== "") {
    const salt = await bcrypt.genSalt(10);
    updateData.password = await bcrypt.hash(password, salt);
  }
  const nextEmailInput = Object.prototype.hasOwnProperty.call(updateData, "email")
    ? String(updateData.email || "").trim().toLowerCase()
    : undefined;
  const nextUsername = Object.prototype.hasOwnProperty.call(updateData, "username")
    ? String(updateData.username || "").trim()
    : undefined;
  const nextPhoneInput = Object.prototype.hasOwnProperty.call(updateData, "phone")
    ? String(updateData.phone || "").trim()
    : undefined;
  const nextEmail = nextEmailInput || undefined;
  const nextPhone = nextPhoneInput || undefined;

  const duplicateConditions = [];
  if (nextEmailInput) duplicateConditions.push({ email: nextEmailInput });
  if (nextUsername) duplicateConditions.push({ username: nextUsername });
  if (nextPhoneInput) duplicateConditions.push({ phone: nextPhoneInput });

  if (duplicateConditions.length) {
    const duplicateUser = await User.findOne({
      _id: { $ne: req.params.id },
      $or: duplicateConditions,
    }).select("email username phone");

    if (duplicateUser) {
      let duplicateField = "thông tin";
      if (nextEmailInput && duplicateUser.email === nextEmailInput)
        duplicateField = "email";
      else if (nextUsername && duplicateUser.username === nextUsername)
        duplicateField = "tên đăng nhập";
      else if (nextPhoneInput && duplicateUser.phone === nextPhoneInput)
        duplicateField = "số điện thoại";

      return res
        .status(409)
        .json({ message: `Người dùng đã tồn tại (${duplicateField} bị trùng)` });
    }
  }

  if (nextEmail !== undefined) updateData.email = nextEmail;
  if (nextUsername !== undefined) updateData.username = nextUsername;
  if (nextPhone !== undefined) updateData.phone = nextPhone;
  /** Chuỗi rỗng: không ghi xuống DB — tránh index unique sparse coi "" là giá trị → E11000 → 400. */
  if (Object.prototype.hasOwnProperty.call(updateData, "email") && !nextEmailInput) {
    delete updateData.email;
  }
  if (Object.prototype.hasOwnProperty.call(updateData, "phone") && !nextPhoneInput) {
    delete updateData.phone;
  }
  if (Object.prototype.hasOwnProperty.call(updateData, "experienceYears")) {
    const normalizedExperienceYearsInput = String(
      updateData.experienceYears ?? "",
    ).trim();
    if (!normalizedExperienceYearsInput) {
      delete updateData.experienceYears;
    } else {
      const normalizedExperienceYears = Number(normalizedExperienceYearsInput);
      if (!Number.isFinite(normalizedExperienceYears)) {
        return res
          .status(400)
          .json({ message: "Số năm kinh nghiệm phải là một số hợp lệ" });
      }
      updateData.experienceYears = normalizedExperienceYears;
    }
  }
  if (user.role === "Teacher") {
    if (Object.prototype.hasOwnProperty.call(updateData, "trainingLevel")) {
      const normalizedTrainingLevel = String(updateData.trainingLevel || "")
        .trim()
        .toLowerCase();
      if (
        normalizedTrainingLevel &&
        !VALID_TRAINING_LEVELS.includes(normalizedTrainingLevel)
      ) {
        return res.status(400).json({
          message:
            "Cấp độ huấn luyện không hợp lệ (chỉ nhận: beginner, intermediate, advanced)",
        });
      }
      updateData.trainingLevel = normalizedTrainingLevel;
    }

    user = await Teacher.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });
  } else {
    user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  res.json(user);
});

exports.deleteUser = asyncHandler(async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "Đã xóa người dùng" });
});

exports.getTeachers = asyncHandler(async (req, res) => {
  const keyword = String(req.query.keyword || "").trim();
  const filter = { role: "Teacher" };
  if (keyword) {
    filter.$or = [
      { fullName: { $regex: keyword, $options: "i" } },
      { username: { $regex: keyword, $options: "i" } },
      { email: { $regex: keyword, $options: "i" } },
      { phone: { $regex: keyword, $options: "i" } },
      { specialization: { $regex: keyword, $options: "i" } },
    ];
  }

  const teachers = await User.find(filter)
    .select(
      "_id username fullName email phone role specialization trainingLevel experienceYears certification avatarUrl createdAt",
    )
    .sort({ createdAt: -1 })
    .lean();

  res.json(
    teachers.map((teacher) => ({
      ...teacher,
      status: "Active",
    })),
  );
});

exports.getTeacherById = asyncHandler(async (req, res) => {
  const teacher = await User.findOne({ _id: req.params.id, role: "Teacher" })
    .select(
      "_id username fullName email phone role specialization trainingLevel experienceYears certification avatarUrl createdAt",
    )
    .lean();

  if (!teacher) {
    return res.status(404).json({ message: "Không tìm thấy giáo viên" });
  }

  const classes = await Class.find({ teacherId: teacher._id })
    .select("_id className status schedule")
    .sort({ createdAt: -1 })
    .lean();

  return res.json({
    id: teacher._id,
    username: teacher.username || "",
    email: teacher.email || "",
    fullName: teacher.fullName || "",
    phone: teacher.phone || "",
    specialization: teacher.specialization || "",
    trainingLevel: teacher.trainingLevel || "beginner",
    experienceYears: teacher.experienceYears || 0,
    certificates: teacher.certification || "",
    avatarUrl: teacher.avatarUrl || "",
    status: "Active",
    classes,
    classCount: classes.length,
  });
});

exports.getOnlineUsers = asyncHandler(async (_req, res) => {
  const onlineThresholdMinutes = Number(process.env.ONLINE_USER_THRESHOLD_MINUTES || 5);
  const threshold = new Date(Date.now() - onlineThresholdMinutes * 60 * 1000);

  const users = await User.find({
    role: { $in: ["Admin", "Teacher", "Parent", "Student"] },
    isOnline: true,
    lastSeenAt: { $gte: threshold },
  })
    .select("_id username fullName role avatarUrl lastSeenAt isOnline")
    .sort({ lastSeenAt: -1 })
    .lean();

  res.json({
    totalOnline: users.length,
    thresholdMinutes: onlineThresholdMinutes,
    users: users.map((user) => ({
      ...user,
      displayName: user.fullName || user.username || "Unknown",
    })),
  });
});

exports.getUserActivityStatuses = asyncHandler(async (_req, res) => {
  const onlineThresholdMinutes = Number(process.env.ONLINE_USER_THRESHOLD_MINUTES || 5);
  const thresholdMs = onlineThresholdMinutes * 60 * 1000;
  const nowMs = Date.now();

  const users = await User.find({
    role: { $in: ["Admin", "Teacher", "Parent", "Student"] },
  })
    .select("_id username fullName role avatarUrl lastSeenAt isOnline")
    .sort({ lastSeenAt: -1, createdAt: -1 })
    .lean();

  const activityUsers = users.map((user) => {
    const lastSeenMs = user?.lastSeenAt ? new Date(user.lastSeenAt).getTime() : 0;
    const isActive = Boolean(user.isOnline) && lastSeenMs > 0 && nowMs - lastSeenMs <= thresholdMs;
    return {
      ...user,
      displayName: user.fullName || user.username || "Unknown",
      isActive,
    };
  });

  const onlineCount = activityUsers.filter((u) => u.isActive).length;
  res.json({
    thresholdMinutes: onlineThresholdMinutes,
    totalUsers: activityUsers.length,
    totalOnline: onlineCount,
    users: activityUsers,
  });
});
