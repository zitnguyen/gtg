const asyncHandler = require("../middleware/asyncHandler");
const Class = require("../models/Class");
const Enrollment = require("../models/Enrollment");
const Student = require("../models/Student");
const ClassEvent = require("../models/ClassEvent");
const {
  transferEnrollment,
} = require("../modules/operations/services/enrollmentTransferService");
const {
  cancelSession,
  scheduleMakeup,
  substituteTeacher,
} = require("../modules/operations/services/classLifecycleService");
const {
  joinWaitlist,
  listWaitlist,
  promoteFromWaitlist,
  cancelWaitlist,
} = require("../modules/operations/services/waitlistService");

const sendError = (res, err) => {
  const status = Number(err?.statusCode) || 500;
  return res.status(status).json({ message: err?.message || "Internal error" });
};

const ensureTeacherOwnsClass = async (classId, user) => {
  if (!user) return false;
  if (user.role === "Admin") return true;
  if (user.role !== "Teacher") return false;
  const owns = await Class.exists({ _id: classId, teacherId: user._id });
  return Boolean(owns);
};

// --- Enrollment transfer ---

exports.transferEnrollmentHandler = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const {
      targetClassId,
      reason,
      sessionsCarriedOver,
      feeAdjustment,
    } = req.body || {};

    // Teacher chỉ được chuyển nếu sở hữu cả lớp nguồn
    if (req.user.role === "Teacher") {
      const enr = await Enrollment.findById(id).select("classId");
      if (!enr) return res.status(404).json({ message: "Không tìm thấy ghi danh" });
      const owns = await ensureTeacherOwnsClass(enr.classId, req.user);
      if (!owns) return res.status(403).json({ message: "Forbidden" });
    }

    const result = await transferEnrollment({
      enrollmentId: id,
      targetClassId,
      reason,
      sessionsCarriedOver,
      feeAdjustment,
      actor: req.user,
      req,
    });
    return res.status(201).json(result);
  } catch (err) {
    if (err?.statusCode) return sendError(res, err);
    throw err;
  }
});

// --- Class session lifecycle ---

exports.cancelClassSession = asyncHandler(async (req, res) => {
  try {
    const owns = await ensureTeacherOwnsClass(req.params.id, req.user);
    if (!owns) return res.status(403).json({ message: "Forbidden" });
    const event = await cancelSession({
      classId: req.params.id,
      originalDate: req.body?.originalDate,
      reason: req.body?.reason,
      actor: req.user,
      req,
    });
    res.status(201).json(event);
  } catch (err) {
    if (err?.statusCode) return sendError(res, err);
    throw err;
  }
});

exports.scheduleMakeupSession = asyncHandler(async (req, res) => {
  try {
    const owns = await ensureTeacherOwnsClass(req.params.id, req.user);
    if (!owns) return res.status(403).json({ message: "Forbidden" });
    const event = await scheduleMakeup({
      classId: req.params.id,
      originalDate: req.body?.originalDate,
      newDate: req.body?.newDate,
      substituteTeacherId: req.body?.substituteTeacherId,
      reason: req.body?.reason,
      actor: req.user,
      req,
    });
    res.status(201).json(event);
  } catch (err) {
    if (err?.statusCode) return sendError(res, err);
    throw err;
  }
});

exports.assignSubstituteTeacher = asyncHandler(async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const event = await substituteTeacher({
      classId: req.params.id,
      originalDate: req.body?.originalDate,
      substituteTeacherId: req.body?.substituteTeacherId,
      reason: req.body?.reason,
      actor: req.user,
      req,
    });
    res.status(201).json(event);
  } catch (err) {
    if (err?.statusCode) return sendError(res, err);
    throw err;
  }
});

exports.listClassEvents = asyncHandler(async (req, res) => {
  const owns = await ensureTeacherOwnsClass(req.params.id, req.user);
  if (!owns) return res.status(403).json({ message: "Forbidden" });
  const filter = { classId: req.params.id };
  if (req.query.type) filter.type = req.query.type;
  const events = await ClassEvent.find(filter)
    .sort("-originalDate")
    .populate("originalTeacherId", "fullName username")
    .populate("substituteTeacherId", "fullName username")
    .populate("createdBy", "fullName username");
  res.json(events);
});

// --- Waitlist ---

exports.joinWaitlistHandler = asyncHandler(async (req, res) => {
  try {
    const { studentId, notes } = req.body || {};

    // Parent chỉ được waitlist cho con của mình.
    if (req.user.role === "Parent") {
      const owns = await Student.exists({ _id: studentId, parentId: req.user._id });
      if (!owns) return res.status(403).json({ message: "Forbidden" });
    }

    // Teacher chỉ được waitlist vào lớp do mình phụ trách.
    if (req.user.role === "Teacher") {
      const owns = await ensureTeacherOwnsClass(req.params.id, req.user);
      if (!owns) return res.status(403).json({ message: "Forbidden" });
    }

    const entry = await joinWaitlist({
      classId: req.params.id,
      studentId,
      parentId: req.user.role === "Parent" ? req.user._id : undefined,
      notes,
      actor: req.user,
      req,
    });
    res.status(201).json(entry);
  } catch (err) {
    if (err?.statusCode) return sendError(res, err);
    throw err;
  }
});

exports.listWaitlistHandler = asyncHandler(async (req, res) => {
  const owns = await ensureTeacherOwnsClass(req.params.id, req.user);
  if (!owns && req.user.role !== "Admin") {
    return res.status(403).json({ message: "Forbidden" });
  }
  const items = await listWaitlist({ classId: req.params.id });
  res.json(items);
});

exports.promoteWaitlistHandler = asyncHandler(async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const result = await promoteFromWaitlist({
      waitlistId: req.params.waitlistId,
      actor: req.user,
      req,
    });
    res.status(201).json(result);
  } catch (err) {
    if (err?.statusCode) return sendError(res, err);
    throw err;
  }
});

exports.cancelWaitlistHandler = asyncHandler(async (req, res) => {
  try {
    if (req.user.role !== "Admin" && req.user.role !== "Parent") {
      return res.status(403).json({ message: "Forbidden" });
    }
    // Parent chỉ huỷ waitlist của con mình
    const ClassWaitlist = require("../models/ClassWaitlist");
    if (req.user.role === "Parent") {
      const entry = await ClassWaitlist.findById(req.params.waitlistId).select(
        "studentId",
      );
      if (!entry)
        return res.status(404).json({ message: "Không tìm thấy waitlist" });
      const owns = await Student.exists({
        _id: entry.studentId,
        parentId: req.user._id,
      });
      if (!owns) return res.status(403).json({ message: "Forbidden" });
    }
    const entry = await cancelWaitlist({
      waitlistId: req.params.waitlistId,
      actor: req.user,
      req,
    });
    res.json(entry);
  } catch (err) {
    if (err?.statusCode) return sendError(res, err);
    throw err;
  }
});

// --- Inactive students ---

exports.listInactiveStudents = asyncHandler(async (req, res) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({ message: "Forbidden" });
  }
  const days = Math.max(1, Math.min(365, parseInt(req.query.days, 10) || 60));
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const items = await Student.find({
    isDeleted: { $ne: true },
    $or: [{ lastActiveAt: { $lt: cutoff } }, { lastActiveAt: null }],
  })
    .select("studentId fullName lifecycleStatus lastActiveAt parentId teacherId")
    .populate("parentId", "fullName phone")
    .populate("teacherId", "fullName")
    .limit(500)
    .lean();
  res.json({ days, count: items.length, items });
});
