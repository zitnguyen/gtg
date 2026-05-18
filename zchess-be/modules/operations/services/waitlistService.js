const ClassWaitlist = require("../../../models/ClassWaitlist");
const Class = require("../../../models/Class");
const Student = require("../../../models/Student");
const Enrollment = require("../../../models/Enrollment");
const { logAction } = require("../../../services/auditLogger");

const fail = (statusCode, message) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

async function joinWaitlist({ classId, studentId, parentId, notes, actor, req }) {
  if (!classId || !studentId) throw fail(400, "Thiếu classId hoặc studentId");
  const [klass, student, alreadyEnrolled] = await Promise.all([
    Class.findById(classId).select("status maxStudents currentStudents"),
    Student.findById(studentId).select("isDeleted parentId"),
    Enrollment.exists({
      studentId,
      classId,
      status: { $in: ["Active", "Reserved"] },
    }),
  ]);
  if (!klass) throw fail(404, "Lớp không tồn tại");
  if (klass.status === "Cancelled" || klass.status === "Finished") {
    throw fail(400, "Lớp này không nhận học viên mới");
  }
  if (!student || student.isDeleted) throw fail(404, "Học viên không hợp lệ");
  if (alreadyEnrolled) throw fail(409, "Học viên đã ghi danh lớp này");

  const lastWaiting = await ClassWaitlist.find({ classId, status: "waiting" })
    .sort("-position")
    .limit(1);
  const nextPosition = (lastWaiting[0]?.position || 0) + 1;

  const entry = await ClassWaitlist.create({
    classId,
    studentId,
    parentId: parentId || student.parentId || null,
    position: nextPosition,
    status: "waiting",
    notes: notes || "",
    createdBy: actor?._id,
  });

  await logAction({
    req,
    actor,
    action: "waitlist.join",
    entity: "ClassWaitlist",
    entityId: entry._id,
    after: entry.toObject(),
    metadata: { classId: String(classId), studentId: String(studentId) },
  });

  return entry;
}

async function listWaitlist({ classId }) {
  return ClassWaitlist.find({ classId, status: "waiting" })
    .sort("position")
    .populate("studentId", "fullName studentId parentId")
    .populate("parentId", "fullName phone");
}

async function promoteFromWaitlist({ waitlistId, actor, req }) {
  const entry = await ClassWaitlist.findById(waitlistId);
  if (!entry) throw fail(404, "Không tìm thấy waitlist");
  if (entry.status !== "waiting")
    throw fail(400, `Trạng thái waitlist hiện tại: ${entry.status}`);

  const klass = await Class.findById(entry.classId);
  if (!klass) throw fail(404, "Lớp không tồn tại");
  const currentInClass = Array.isArray(klass.studentIds)
    ? klass.studentIds.length
    : Number(klass.currentStudents || 0);
  if (
    typeof klass.maxStudents === "number" &&
    klass.maxStudents > 0 &&
    currentInClass >= klass.maxStudents
  ) {
    throw fail(409, "Lớp đã đầy, không thể promote");
  }

  // Tránh tạo enrollment trùng (đã active từ luồng khác)
  const existing = await Enrollment.findOne({
    studentId: entry.studentId,
    classId: entry.classId,
    status: { $in: ["Active", "Reserved"] },
  });

  let enrollment;
  if (existing) {
    enrollment = existing;
  } else {
    enrollment = await Enrollment.create({
      studentId: entry.studentId,
      classId: entry.classId,
      enrollmentDate: new Date(),
      status: "Active",
      feeAmount: Number(klass.fee || 0),
      paidAmount: 0,
      paymentStatus: "unpaid",
      paymentDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      sessionsTotal: klass.totalSessions || 16,
      sessionsUsed: 0,
    });
    await Class.findByIdAndUpdate(entry.classId, {
      $addToSet: { studentIds: entry.studentId },
      $inc: { currentStudents: 1 },
    });
  }

  entry.status = "promoted";
  entry.promotedAt = new Date();
  await entry.save();

  await logAction({
    req,
    actor,
    action: "waitlist.promote",
    entity: "ClassWaitlist",
    entityId: entry._id,
    after: entry.toObject(),
    metadata: {
      enrollmentId: String(enrollment._id),
      classId: String(klass._id),
      studentId: String(entry.studentId),
    },
  });

  return { entry, enrollment };
}

async function cancelWaitlist({ waitlistId, actor, req }) {
  const entry = await ClassWaitlist.findById(waitlistId);
  if (!entry) throw fail(404, "Không tìm thấy waitlist");
  if (entry.status !== "waiting")
    throw fail(400, `Đã ${entry.status}, không thể huỷ`);

  entry.status = "cancelled";
  await entry.save();

  await logAction({
    req,
    actor,
    action: "waitlist.cancel",
    entity: "ClassWaitlist",
    entityId: entry._id,
    after: entry.toObject(),
  });

  return entry;
}

module.exports = {
  joinWaitlist,
  listWaitlist,
  promoteFromWaitlist,
  cancelWaitlist,
};
