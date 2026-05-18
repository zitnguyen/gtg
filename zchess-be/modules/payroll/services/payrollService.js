const mongoose = require("mongoose");
const payrollRepository = require("../repositories/payrollRepository");
const {
  computeDurationHours,
  computePayrollTotals,
  normalizeCompensationPayload,
  normalizeOptionalSalary,
} = require("../calculators/payrollCalculator");
const { toAdminPayrollRow, toTeacherSessionDto } = require("../dto/payrollDto");
const { auditPayrollAction } = require("./payrollAuditService");
const {
  assertNonNegativeNumber,
  requireFields,
  validateCompensation,
} = require("../validators/payrollValidator");

const makeHttpError = (statusCode, message) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const runInTransaction = async (handler) => {
  if (process.env.PAYROLL_USE_TRANSACTIONS !== "true") {
    return handler(null);
  }
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await handler(session);
    });
    return result;
  } finally {
    session.endSession();
  }
};

const ensureClassBelongsToTeacher = async ({ classId, teacherId }) => {
  const classDoc = await payrollRepository.findClassById(classId, "_id teacherId");
  if (!classDoc) throw makeHttpError(404, "Không tìm thấy lớp học");
  if (String(classDoc.teacherId) !== String(teacherId)) {
    throw makeHttpError(400, "Lớp học không thuộc giáo viên đã chọn");
  }
  return classDoc;
};

const createTeacherSession = async ({ user, body }) => {
  const classId = body.class_id || body.classId;
  const date = body.date;
  const startTime = body.start_time || body.startTime;
  const endTime = body.end_time || body.endTime;
  const note = body.note || "";

  if (body.salary !== undefined) {
    throw makeHttpError(400, "Teacher không được phép nhập lương");
  }
  requireFields(
    { classId, date, startTime, endTime },
    ["classId", "date", "startTime", "endTime"],
    "Thiếu thông tin ca dạy bắt buộc",
  );

  const ownClass = await payrollRepository.classBelongsToTeacher(
    classId,
    user._id,
  );
  if (!ownClass) {
    throw makeHttpError(403, "Bạn chỉ được tạo ca dạy cho lớp của mình");
  }

  const durationHours = computeDurationHours(startTime, endTime);
  if (!durationHours || durationHours <= 0) {
    throw makeHttpError(400, "start_time / end_time không hợp lệ");
  }

  const created = await payrollRepository.createSession({
    classId,
    teacherId: user._id,
    date: new Date(date),
    startTime,
    endTime,
    durationHours,
    note,
    salary: null,
    status: "Pending",
    createdBy: user._id,
  });

  const populated = await payrollRepository.findPopulatedSessionById(created._id);
  return toTeacherSessionDto(populated);
};

const createAdminSession = async ({ user, body }) => {
  const {
    teacherId,
    classId,
    date,
    startTime,
    endTime,
    note = "",
    salary,
    deductionAmount = 0,
    deductionNote = "",
    bonusAmount = 0,
    bonusNote = "",
    otherCostAmount = 0,
    otherCostNote = "",
  } = body || {};

  requireFields(
    { teacherId, classId, date, startTime, endTime },
    ["teacherId", "classId", "date", "startTime", "endTime"],
    "Thiếu teacherId, classId, date, startTime hoặc endTime",
  );

  const teacher = await payrollRepository.findTeacherById(teacherId, "_id");
  if (!teacher) throw makeHttpError(404, "Không tìm thấy giáo viên");
  await ensureClassBelongsToTeacher({ classId, teacherId });

  const durationHours = computeDurationHours(startTime, endTime);
  if (!durationHours || durationHours <= 0) {
    throw makeHttpError(400, "startTime / endTime không hợp lệ");
  }

  const compensation = normalizeCompensationPayload({
    salary,
    deductionAmount,
    deductionNote,
    bonusAmount,
    bonusNote,
    otherCostAmount,
    otherCostNote,
  });
  validateCompensation(compensation);

  return runInTransaction(async (session) => {
    const created = await payrollRepository.createSession(
      {
        classId,
        teacherId,
        date: new Date(date),
        startTime,
        endTime,
        durationHours,
        note,
        ...compensation,
        status: compensation.salary == null ? "Pending" : "Confirmed",
        createdBy: user._id,
      },
      { session },
    );
    auditPayrollAction({
      action: "session.create",
      actorId: user._id,
      targetId: created._id,
      metadata: { teacherId, classId },
    });
    return payrollRepository.findPopulatedSessionById(created._id);
  });
};

const getTeacherSessions = async (user) => {
  const sessions = await payrollRepository.findTeacherSessions(user._id);
  return sessions.map(toTeacherSessionDto);
};

const getAdminPayroll = async () => {
  const [teachers, aggregates] = await Promise.all([
    payrollRepository.findTeachers(),
    payrollRepository.aggregateAdminPayroll(),
  ]);
  const byTeacherId = new Map(
    aggregates.map((item) => [String(item._id), item]),
  );
  return teachers.map((teacher) =>
    toAdminPayrollRow(teacher, byTeacherId.get(String(teacher._id))),
  );
};

const getAdminPayrollByTeacher = async (teacherId) => {
  const teacher = await payrollRepository.findTeacherById(teacherId);
  if (!teacher) throw makeHttpError(404, "Không tìm thấy giáo viên");
  const sessions = await payrollRepository.findTeacherSessions(teacherId);
  const totals = computePayrollTotals(sessions);
  return {
    teacher,
    sessions,
    totalSalary: totals.totalSalary,
    totalDeductions: totals.totalDeductions,
    totalBonuses: totals.totalBonuses,
    totalOtherCosts: totals.totalOtherCosts,
    totalNetSalary: totals.totalNetSalary,
    totalHours: totals.totalHours,
    totalSessions: sessions.length,
  };
};

const updateSessionSalary = async ({ sessionId, salary }) => {
  const normalizedSalary = assertNonNegativeNumber(salary, "Salary không hợp lệ");
  return runInTransaction(async () => {
    const session = await payrollRepository.findSessionById(sessionId);
    if (!session) throw makeHttpError(404, "Không tìm thấy ca dạy");
    if (!session.createdBy) session.createdBy = session.teacherId;
    session.salary = normalizedSalary;
    if (session.status === "Pending") session.status = "Confirmed";
    await session.save();
    auditPayrollAction({
      action: "session.salary.update",
      targetId: session._id,
      metadata: { salary: normalizedSalary },
    });
    return payrollRepository.findPopulatedSessionById(session._id);
  });
};

const updateSessionCompensation = async ({ sessionId, body }) => {
  return runInTransaction(async () => {
    const session = await payrollRepository.findSessionById(sessionId);
    if (!session) throw makeHttpError(404, "Không tìm thấy ca dạy");
    const compensation = normalizeCompensationPayload(body, session);
    if (compensation.salary === null) compensation.salary = 0;
    if (Number.isNaN(compensation.salary)) {
      throw makeHttpError(400, "Salary không hợp lệ");
    }
    validateCompensation(compensation);
    if (!session.createdBy) session.createdBy = session.teacherId;
    Object.assign(session, compensation);
    if (session.status === "Pending") session.status = "Confirmed";
    await session.save();
    auditPayrollAction({
      action: "session.compensation.update",
      targetId: session._id,
      metadata: compensation,
    });
    return payrollRepository.findPopulatedSessionById(session._id);
  });
};

const resetSessionSalary = async (sessionId) => {
  return runInTransaction(async () => {
    const session = await payrollRepository.findSessionById(sessionId);
    if (!session) throw makeHttpError(404, "Không tìm thấy ca dạy");
    if (!session.createdBy) session.createdBy = session.teacherId;
    session.salary = null;
    session.deductionAmount = 0;
    session.deductionNote = "";
    session.bonusAmount = 0;
    session.bonusNote = "";
    session.otherCostAmount = 0;
    session.otherCostNote = "";
    if (session.status === "Paid") session.status = "Confirmed";
    await session.save();
    auditPayrollAction({
      action: "session.compensation.reset",
      targetId: session._id,
    });
    return payrollRepository.findPopulatedSessionById(session._id);
  });
};

const deleteSession = async (sessionId) => {
  const session = await payrollRepository.deleteSessionById(sessionId);
  if (!session) throw makeHttpError(404, "Không tìm thấy ca dạy");
  auditPayrollAction({
    action: "session.delete",
    targetId: sessionId,
  });
  return { message: "Đã xóa ca dạy", id: sessionId };
};

const getPayrollSummary = async () => {
  const byTeacher = await payrollRepository.aggregatePayrollSummary();
  const totals = byTeacher.reduce(
    (acc, item) => {
      acc.totalTeachers += 1;
      acc.totalSessions += item.totalSessions || 0;
      acc.totalHours += item.totalHours || 0;
      acc.totalSalary += item.totalSalary || 0;
      acc.totalDeductions += item.totalDeductions || 0;
      acc.totalBonuses += item.totalBonuses || 0;
      acc.totalOtherCosts += item.totalOtherCosts || 0;
      return acc;
    },
    {
      totalTeachers: 0,
      totalSessions: 0,
      totalHours: 0,
      totalSalary: 0,
      totalDeductions: 0,
      totalBonuses: 0,
      totalOtherCosts: 0,
    },
  );
  totals.totalHours = Number(totals.totalHours.toFixed(2));
  totals.totalNetSalary =
    totals.totalSalary +
    totals.totalBonuses -
    totals.totalDeductions -
    totals.totalOtherCosts;

  return {
    summary: totals,
    teachers: byTeacher,
  };
};

module.exports = {
  createAdminSession,
  createTeacherSession,
  deleteSession,
  getAdminPayroll,
  getAdminPayrollByTeacher,
  getPayrollSummary,
  getTeacherSessions,
  normalizeOptionalSalary,
  resetSessionSalary,
  updateSessionCompensation,
  updateSessionSalary,
};
