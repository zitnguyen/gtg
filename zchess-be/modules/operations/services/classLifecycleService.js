const ClassEvent = require("../../../models/ClassEvent");
const Class = require("../../../models/Class");
const { logAction } = require("../../../services/auditLogger");
const {
  notifyUsers,
} = require("../../notifications/helpers/notifyUsers");

const fail = (statusCode, message) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const collectClassParents = async (classId) => {
  // Lấy danh sách parent thông qua studentIds → student.parentId.
  // Để tránh circular import, làm lazy require.
  const Student = require("../../../models/Student");
  const klass = await Class.findById(classId).select("studentIds className teacherId");
  if (!klass) return { klass: null, parentIds: [], teacherId: null };
  const students = await Student.find({
    _id: { $in: klass.studentIds || [] },
    isDeleted: { $ne: true },
  }).select("parentId");
  const parentIds = Array.from(
    new Set(students.map((s) => s.parentId && String(s.parentId)).filter(Boolean)),
  );
  return { klass, parentIds, teacherId: klass.teacherId };
};

async function cancelSession({ classId, originalDate, reason, actor, req }) {
  if (!classId || !originalDate) {
    throw fail(400, "Thiếu classId hoặc originalDate");
  }
  const date = new Date(originalDate);
  if (Number.isNaN(date.getTime())) throw fail(400, "originalDate không hợp lệ");

  const { klass, parentIds, teacherId } = await collectClassParents(classId);
  if (!klass) throw fail(404, "Lớp không tồn tại");

  const event = await ClassEvent.create({
    classId,
    type: "cancelled",
    originalDate: date,
    originalTeacherId: teacherId,
    reason: reason || "",
    createdBy: actor?._id,
    notifiedAt: new Date(),
  });

  await logAction({
    req,
    actor,
    action: "class.cancel-session",
    entity: "ClassEvent",
    entityId: event._id,
    after: event.toObject(),
    metadata: { classId, originalDate: date.toISOString() },
  });

  try {
    const dateLabel = date.toLocaleDateString("vi-VN");
    const audience = [...parentIds, teacherId && String(teacherId)].filter(Boolean);
    if (audience.length) {
      await notifyUsers({
        userIds: audience,
        title: `Buổi học ngày ${dateLabel} bị huỷ`,
        content: `Lớp "${klass.className}" sẽ tạm huỷ buổi ngày ${dateLabel}. Lý do: ${reason || "Không có"}.`,
        targetPath: "",
        createdBy: actor?._id,
        type: "CLASS_SESSION_CANCELLED",
      });
    }
  } catch (e) {
    console.error("notify_cancel_failed", e?.message);
  }

  return event;
}

async function scheduleMakeup({
  classId,
  originalDate,
  newDate,
  substituteTeacherId,
  reason,
  actor,
  req,
}) {
  if (!classId || !newDate) throw fail(400, "Thiếu classId hoặc newDate");
  const dateNew = new Date(newDate);
  if (Number.isNaN(dateNew.getTime())) throw fail(400, "newDate không hợp lệ");
  const dateOriginal = originalDate ? new Date(originalDate) : null;

  const { klass, parentIds, teacherId } = await collectClassParents(classId);
  if (!klass) throw fail(404, "Lớp không tồn tại");

  // Tìm cancelled event cũ (nếu có) để liên kết.
  let relatedEvent = null;
  if (dateOriginal) {
    relatedEvent = await ClassEvent.findOne({
      classId,
      type: "cancelled",
      originalDate: dateOriginal,
    }).sort("-createdAt");
  }

  const event = await ClassEvent.create({
    classId,
    type: "makeup",
    originalDate: dateOriginal || dateNew,
    newDate: dateNew,
    originalTeacherId: teacherId,
    substituteTeacherId: substituteTeacherId || null,
    relatedEventId: relatedEvent?._id || null,
    reason: reason || "",
    createdBy: actor?._id,
    notifiedAt: new Date(),
  });

  await logAction({
    req,
    actor,
    action: "class.makeup-session",
    entity: "ClassEvent",
    entityId: event._id,
    after: event.toObject(),
    metadata: { classId, originalDate: dateOriginal?.toISOString(), newDate: dateNew.toISOString() },
  });

  try {
    const audience = [...parentIds, teacherId && String(teacherId), substituteTeacherId && String(substituteTeacherId)]
      .filter(Boolean);
    const fmt = (d) => d.toLocaleDateString("vi-VN");
    if (audience.length) {
      await notifyUsers({
        userIds: audience,
        title: "Buổi học bù",
        content: `Lớp "${klass.className}" có buổi bù vào ${fmt(dateNew)}${
          dateOriginal ? ` cho buổi ${fmt(dateOriginal)}` : ""
        }.`,
        targetPath: "",
        createdBy: actor?._id,
        type: "CLASS_MAKEUP_SCHEDULED",
      });
    }
  } catch (e) {
    console.error("notify_makeup_failed", e?.message);
  }

  return event;
}

async function substituteTeacher({
  classId,
  originalDate,
  substituteTeacherId,
  reason,
  actor,
  req,
}) {
  if (!classId || !originalDate || !substituteTeacherId) {
    throw fail(400, "Thiếu classId, originalDate hoặc substituteTeacherId");
  }
  const date = new Date(originalDate);
  if (Number.isNaN(date.getTime())) throw fail(400, "originalDate không hợp lệ");

  const { klass, parentIds, teacherId } = await collectClassParents(classId);
  if (!klass) throw fail(404, "Lớp không tồn tại");

  const event = await ClassEvent.create({
    classId,
    type: "substituted",
    originalDate: date,
    originalTeacherId: teacherId,
    substituteTeacherId,
    reason: reason || "",
    createdBy: actor?._id,
    notifiedAt: new Date(),
  });

  await logAction({
    req,
    actor,
    action: "class.substitute-teacher",
    entity: "ClassEvent",
    entityId: event._id,
    after: event.toObject(),
    metadata: {
      classId,
      originalDate: date.toISOString(),
      substituteTeacherId: String(substituteTeacherId),
    },
  });

  try {
    const dateLabel = date.toLocaleDateString("vi-VN");
    const audience = [
      ...parentIds,
      teacherId && String(teacherId),
      String(substituteTeacherId),
    ].filter(Boolean);
    if (audience.length) {
      await notifyUsers({
        userIds: audience,
        title: `Lớp "${klass.className}" có giáo viên thay`,
        content: `Buổi ngày ${dateLabel} sẽ được giảng dạy bởi giáo viên thay. Lý do: ${reason || "Không có"}.`,
        targetPath: "",
        createdBy: actor?._id,
        type: "CLASS_TEACHER_SUBSTITUTED",
      });
    }
  } catch (e) {
    console.error("notify_substitute_failed", e?.message);
  }

  return event;
}

module.exports = {
  cancelSession,
  scheduleMakeup,
  substituteTeacher,
};
