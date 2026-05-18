const Enrollment = require("../../../models/Enrollment");
const Class = require("../../../models/Class");
const Student = require("../../../models/Student");
const { logAction } = require("../../../services/auditLogger");
const {
  notifyParents,
  notifyUsers,
} = require("../../notifications/helpers/notifyUsers");

/**
 * transferEnrollment — chuyển học viên từ enrollment hiện tại sang lớp mới.
 *
 * Trả về:
 *   { newEnrollment, oldEnrollment }
 * Throw `Error` với `.statusCode` để controller chuyển sang HTTP error tương ứng.
 */
const fail = (statusCode, message) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

async function transferEnrollment({
  enrollmentId,
  targetClassId,
  reason,
  sessionsCarriedOver,
  feeAdjustment,
  actor,
  req,
}) {
  if (!enrollmentId || !targetClassId) {
    throw fail(400, "Thiếu enrollmentId hoặc targetClassId");
  }

  const oldEnrollment = await Enrollment.findById(enrollmentId);
  if (!oldEnrollment) throw fail(404, "Không tìm thấy ghi danh");
  if (oldEnrollment.status !== "Active" && oldEnrollment.status !== "Reserved") {
    throw fail(
      400,
      `Không thể chuyển từ trạng thái ${oldEnrollment.status}`,
    );
  }
  if (String(oldEnrollment.classId) === String(targetClassId)) {
    throw fail(400, "Lớp đích trùng với lớp hiện tại");
  }

  const [fromClass, toClass, student] = await Promise.all([
    Class.findById(oldEnrollment.classId),
    Class.findById(targetClassId),
    Student.findById(oldEnrollment.studentId).select(
      "fullName parentId isDeleted",
    ),
  ]);

  if (!fromClass) throw fail(404, "Lớp hiện tại không tồn tại");
  if (!toClass) throw fail(404, "Lớp đích không tồn tại");
  if (!student || student.isDeleted) throw fail(404, "Học viên không hợp lệ");
  if (toClass.status === "Cancelled" || toClass.status === "Finished") {
    throw fail(400, "Lớp đích không nhận học viên mới");
  }

  // Slot check
  const currentInTarget = Array.isArray(toClass.studentIds)
    ? toClass.studentIds.length
    : Number(toClass.currentStudents || 0);
  if (
    typeof toClass.maxStudents === "number" &&
    toClass.maxStudents > 0 &&
    currentInTarget >= toClass.maxStudents
  ) {
    throw fail(409, "Lớp đích đã đầy");
  }

  const sessionsKept = Math.max(
    0,
    Number(sessionsCarriedOver ?? oldEnrollment.sessionsUsed ?? 0),
  );
  const oldFee = Number(oldEnrollment.feeAmount || 0);
  const newFee =
    typeof feeAdjustment === "number" && Number.isFinite(feeAdjustment)
      ? Math.max(feeAdjustment, 0)
      : Number(toClass.fee || oldFee);

  // Tính phí mang sang: phần đã đóng (paidAmount).
  const paidCarried = Number(oldEnrollment.paidAmount || 0);

  // 1. Đánh dấu enrollment cũ Dropped
  const oldBefore = oldEnrollment.toObject();
  oldEnrollment.status = "Dropped";
  oldEnrollment.droppedAt = new Date();
  oldEnrollment.droppedReason = `Chuyển lớp: ${reason || ""}`.trim();
  await oldEnrollment.save();

  // 2. Pull khỏi lớp cũ
  await Class.findByIdAndUpdate(fromClass._id, {
    $pull: { studentIds: oldEnrollment.studentId },
    $inc: { currentStudents: -1 },
  });

  // 3. Tạo enrollment mới
  const newEnrollment = await Enrollment.create({
    studentId: oldEnrollment.studentId,
    classId: toClass._id,
    enrollmentDate: new Date(),
    status: "Active",
    feeAmount: newFee,
    paidAmount: paidCarried,
    paymentStatus: paidCarried >= newFee && newFee > 0 ? "paid" : paidCarried > 0 ? "partial" : "unpaid",
    paymentDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    sessionsTotal: toClass.totalSessions || oldEnrollment.sessionsTotal || 16,
    sessionsUsed: sessionsKept,
    transferLog: [
      {
        fromClassId: fromClass._id,
        toClassId: toClass._id,
        transferredAt: new Date(),
        transferredBy: actor?._id || null,
        sessionsCarriedOver: sessionsKept,
        feeCarriedOver: paidCarried,
        reason: reason || "",
      },
    ],
  });

  // 4. AddToSet vào lớp mới
  await Class.findByIdAndUpdate(toClass._id, {
    $addToSet: { studentIds: oldEnrollment.studentId },
    $inc: { currentStudents: 1 },
  });

  // 5. Audit log
  await logAction({
    req,
    actor,
    action: "enrollment.transfer",
    entity: "Enrollment",
    entityId: newEnrollment._id,
    before: oldBefore,
    after: newEnrollment.toObject(),
    metadata: {
      fromClassId: String(fromClass._id),
      toClassId: String(toClass._id),
      sessionsKept,
      paidCarried,
      newFee,
    },
  });

  // 6. Notify
  try {
    const teacherIds = [fromClass.teacherId, toClass.teacherId]
      .filter(Boolean)
      .map(String);
    const parentId = student.parentId ? [String(student.parentId)] : [];
    const summary = `${student.fullName} đã chuyển từ lớp "${fromClass.className}" sang "${toClass.className}".`;

    if (parentId.length) {
      await notifyUsers({
        userIds: parentId,
        title: "Học viên chuyển lớp",
        content: summary,
        targetPath: "/parent/dashboard",
        createdBy: actor?._id,
        type: "ENROLLMENT_TRANSFER",
      });
    }
    if (teacherIds.length) {
      await notifyUsers({
        userIds: teacherIds,
        title: "Học viên chuyển lớp",
        content: summary,
        targetPath: "/teacher/classes",
        createdBy: actor?._id,
        type: "ENROLLMENT_TRANSFER",
      });
    }
  } catch (notifyErr) {
    console.error("notify_transfer_failed", notifyErr?.message);
  }

  return { newEnrollment, oldEnrollment };
}

module.exports = { transferEnrollment };
