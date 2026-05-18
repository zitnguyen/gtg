const Attendance = require("../models/Attendance");
const asyncHandler = require("../middleware/asyncHandler");
const Class = require("../models/Class");
const Student = require("../models/Student");
const DAY_MAP = { CN: 0, T2: 1, T3: 2, T4: 3, T5: 4, T6: 5, T7: 6 };

function parseDayAnchor(dateInput) {
  if (!dateInput) return new Date();
  const s = String(dateInput).slice(0, 10);
  const parts = s.split("-");
  if (parts.length === 3) {
    const y = Number(parts[0]);
    const m = Number(parts[1]) - 1;
    const d = Number(parts[2]);
    return new Date(y, m, d, 12, 0, 0, 0);
  }
  return new Date(dateInput);
}

function dayRange(dateInput) {
  const anchor = parseDayAnchor(dateInput);
  const start = new Date(anchor);
  start.setHours(0, 0, 0, 0);
  const end = new Date(anchor);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

async function ensureTeacherOwnsClass(classId, reqUser) {
  if (!reqUser || reqUser.role !== "Teacher") return true;
  const ownClass = await Class.exists({ _id: classId, teacherId: reqUser._id });
  return Boolean(ownClass);
}

const buildScheduleSlotsFromLegacy = (schedule) => {
  if (!schedule || typeof schedule !== "string") return [];
  const timeMatch = schedule.match(/\((.*?)\)/);
  if (!timeMatch?.[1]) return [];
  const time = timeMatch[1].trim();
  const hhmm = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!hhmm.test(time)) return [];
  const daysPart = schedule.split("(")[0] || "";
  return daysPart
    .split("/")
    .map((d) => d.trim().toUpperCase())
    .filter(Boolean)
    .map((d) => DAY_MAP[d])
    .filter((d) => Number.isInteger(d))
    .map((day) => ({ day, time, duration: 90 }));
};

const hasClassScheduleOnDate = (classDoc, dateInput) => {
  const scheduleSlots =
    Array.isArray(classDoc?.scheduleSlots) && classDoc.scheduleSlots.length > 0
      ? classDoc.scheduleSlots
      : buildScheduleSlotsFromLegacy(classDoc?.schedule);
  if (!scheduleSlots.length) return false;
  const dayVal = parseDayAnchor(dateInput).getDay(); // 0..6
  return scheduleSlots.some((slot) => Number(slot?.day) === Number(dayVal));
};

exports.listAttendance = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.classId) filter.classId = req.query.classId;
  if (req.query.studentId) filter.studentId = req.query.studentId;
  if (req.query.date) {
    const { start, end } = dayRange(req.query.date);
    filter.date = { $gte: start, $lte: end };
  }

  if (req.user.role === "Teacher") {
    if (filter.classId) {
      const canAccess = await ensureTeacherOwnsClass(filter.classId, req.user);
      if (!canAccess) return res.status(403).json({ message: "Forbidden" });
    } else {
      const classDocs = await Class.find({ teacherId: req.user._id }).select("_id");
      filter.classId = { $in: classDocs.map((c) => c._id) };
    }
  }

  const attendance = await Attendance.find(filter)
    .populate("studentId", "fullName studentId")
    .populate("classId", "className");

  res.json(attendance);
});

const ALLOWED_STATUSES = new Set([
  "present",
  "absent",
  "excused",
  "late",
  "makeup",
]);
const COUNTS_AS_PRESENT = new Set(["present", "late", "makeup"]);

exports.markAttendance = asyncHandler(async (req, res) => {
  const { classId, studentId, date, status, note, isMakeup, originalDate } =
    req.body;
  if (!classId || !studentId || !date || !status) {
    return res.status(400).json({ message: "Thiếu dữ liệu điểm danh bắt buộc" });
  }
  if (!ALLOWED_STATUSES.has(status)) {
    return res.status(400).json({ message: `Trạng thái không hợp lệ: ${status}` });
  }
  const canAccess = await ensureTeacherOwnsClass(classId, req.user);
  if (!canAccess) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const studentExists = await Student.exists({
    _id: studentId,
    isDeleted: { $ne: true },
  });
  if (!studentExists) {
    return res.status(404).json({ message: "Học viên không tồn tại" });
  }

  const classDoc = await Class.findById(classId).select(
    "studentIds scheduleSlots schedule status",
  );
  if (!classDoc) {
    return res.status(404).json({ message: "Lớp học không tồn tại" });
  }
  if (classDoc.status === "Cancelled" || classDoc.status === "Finished") {
    return res.status(400).json({
      message: `Lớp đang ở trạng thái ${classDoc.status}, không thể điểm danh.`,
    });
  }
  const studentInClass = (classDoc.studentIds || []).some(
    (id) => String(id) === String(studentId),
  );
  if (!studentInClass) {
    return res.status(400).json({ message: "Học viên không thuộc lớp học này" });
  }
  // Buổi makeup không cần thuộc scheduleSlots gốc — bỏ qua kiểm tra lịch.
  if (status !== "makeup" && !isMakeup) {
    const hasSchedule = hasClassScheduleOnDate(classDoc, date);
    if (!hasSchedule) {
      return res
        .status(400)
        .json({ message: "Học viên không có lịch học trong ngày được chọn" });
    }
  }

  const anchor = parseDayAnchor(date);
  const idempotencyKey =
    typeof req.headers["idempotency-key"] === "string" &&
    req.headers["idempotency-key"].trim().length > 0 &&
    req.headers["idempotency-key"].trim().length <= 80
      ? req.headers["idempotency-key"].trim()
      : null;

  if (idempotencyKey) {
    const existingByKey = await Attendance.findOne({ idempotencyKey });
    if (existingByKey) {
      return res.status(200).json(existingByKey);
    }
  }

  // Atomic upsert theo (classId, studentId, date-anchor).
  let attendance = await Attendance.findOneAndUpdate(
    { classId, studentId, date: anchor },
    {
      $setOnInsert: {
        classId,
        studentId,
        date: anchor,
        markedBy: req.user?._id,
        idempotencyKey: idempotencyKey || undefined,
      },
    },
    { upsert: true, new: true },
  );

  const prevStatus = attendance.status || "absent";
  // Cập nhật fields còn lại (không $setOnInsert)
  attendance.status = status;
  attendance.note = note;
  attendance.isMakeup = Boolean(isMakeup) || status === "makeup";
  attendance.originalDate = originalDate ? new Date(originalDate) : null;
  attendance.markedBy = req.user?._id;
  await attendance.save();

  // Đồng bộ counter Student dựa theo dịch chuyển present-equivalence.
  const wasPresent = COUNTS_AS_PRESENT.has(prevStatus);
  const isPresent = COUNTS_AS_PRESENT.has(status);
  if (!wasPresent && isPresent) {
    await Student.findByIdAndUpdate(studentId, {
      $inc: { totalSessions: 1, completedLessons: 1 },
      $set: { lastActiveAt: new Date(), lifecycleStatus: "active" },
    });
  } else if (wasPresent && !isPresent) {
    const studentDoc = await Student.findById(studentId).select(
      "totalSessions completedLessons",
    );
    if (studentDoc) {
      studentDoc.totalSessions = Math.max((studentDoc.totalSessions || 0) - 1, 0);
      studentDoc.completedLessons = Math.max(
        (studentDoc.completedLessons || 0) - 1,
        0,
      );
      await studentDoc.save();
    }
  } else if (isPresent) {
    // Đánh dấu lại lastActiveAt khi điểm danh có mặt.
    await Student.findByIdAndUpdate(studentId, {
      $set: { lastActiveAt: new Date(), lifecycleStatus: "active" },
    });
  }

  res.status(201).json(attendance);
});

exports.getClassAttendance = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const canAccess = await ensureTeacherOwnsClass(classId, req.user);
  if (!canAccess) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const filter = { classId };
  if (req.query.date) {
    const { start, end } = dayRange(req.query.date);
    filter.date = { $gte: start, $lte: end };
  }

  const attendance = await Attendance.find(filter).populate(
    "studentId",
    "fullName studentId",
  );
  res.json(attendance);
});

exports.updateAttendance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await Attendance.findById(id).select("classId");
  if (!existing) return res.status(404).json({ message: "Not found" });

  const canAccess = await ensureTeacherOwnsClass(existing.classId, req.user);
  if (!canAccess) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const attendance = await Attendance.findByIdAndUpdate(id, req.body, {
    new: true,
  });
  res.json(attendance);
});
