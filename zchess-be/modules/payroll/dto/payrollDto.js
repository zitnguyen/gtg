const toTeacherSessionDto = (log) => ({
  _id: log._id,
  teacherId: log.teacherId,
  classId: log.classId,
  date: log.date,
  startTime: log.startTime,
  endTime: log.endTime,
  durationHours: log.durationHours,
  salary: log.salary,
  deductionAmount: Number(log.deductionAmount || 0),
  deductionNote: log.deductionNote || "",
  bonusAmount: Number(log.bonusAmount || 0),
  bonusNote: log.bonusNote || "",
  otherCostAmount: Number(log.otherCostAmount || 0),
  otherCostNote: log.otherCostNote || "",
  note: log.note || "",
  status: log.status,
  createdAt: log.createdAt,
  updatedAt: log.updatedAt,
});

const toAdminPayrollRow = (teacher, stats = {}) => ({
  teacher,
  totalSessions: stats.totalSessions || 0,
  totalHours: Number((stats.totalHours || 0).toFixed(2)),
  totalSalary: stats.totalSalary || 0,
  totalDeductions: stats.totalDeductions || 0,
  totalBonuses: stats.totalBonuses || 0,
  totalOtherCosts: stats.totalOtherCosts || 0,
  totalNetSalary:
    (stats.totalSalary || 0) +
    (stats.totalBonuses || 0) -
    (stats.totalDeductions || 0) -
    (stats.totalOtherCosts || 0),
  sessionsWithoutSalary: stats.sessionsWithoutSalary || 0,
});

module.exports = {
  toAdminPayrollRow,
  toTeacherSessionDto,
};
