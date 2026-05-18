const TeachingLog = require("../../../models/TeachingLog");
const Class = require("../../../models/Class");
const User = require("../../../models/User");

const POPULATE_SESSION = [
  { path: "classId", select: "className schedule" },
  { path: "teacherId", select: "fullName username" },
];

const findTeacherById = (teacherId, projection = "_id fullName username email phone") =>
  User.findOne({ _id: teacherId, role: "Teacher" }).select(projection);

const findTeachers = () =>
  User.find({ role: "Teacher" })
    .select("_id fullName username email phone")
    .sort({ fullName: 1, username: 1 });

const findClassById = (classId, projection = "_id teacherId") =>
  Class.findById(classId).select(projection);

const classBelongsToTeacher = (classId, teacherId) =>
  Class.exists({ _id: classId, teacherId });

const createSession = (payload, options = {}) => {
  const createOptions = options.session ? options : {};
  return TeachingLog.create([payload], createOptions).then((items) => items[0]);
};

const findSessionById = (sessionId) => TeachingLog.findById(sessionId);

const findPopulatedSessionById = (sessionId) =>
  TeachingLog.findById(sessionId).populate(POPULATE_SESSION);

const deleteSessionById = (sessionId) => TeachingLog.findByIdAndDelete(sessionId);

const findTeacherSessions = (teacherId) =>
  TeachingLog.find({ teacherId })
    .populate("classId", "className schedule")
    .sort({ date: -1, createdAt: -1 });

const aggregateAdminPayroll = () =>
  TeachingLog.aggregate([
    {
      $group: {
        _id: "$teacherId",
        totalSessions: { $sum: 1 },
        totalHours: { $sum: "$durationHours" },
        totalSalary: { $sum: { $ifNull: ["$salary", 0] } },
        totalDeductions: { $sum: { $ifNull: ["$deductionAmount", 0] } },
        totalBonuses: { $sum: { $ifNull: ["$bonusAmount", 0] } },
        totalOtherCosts: { $sum: { $ifNull: ["$otherCostAmount", 0] } },
        sessionsWithoutSalary: {
          $sum: {
            $cond: [{ $eq: ["$salary", null] }, 1, 0],
          },
        },
      },
    },
  ]);

const aggregatePayrollSummary = () =>
  TeachingLog.aggregate([
    {
      $group: {
        _id: "$teacherId",
        totalSessions: { $sum: 1 },
        totalHours: { $sum: "$durationHours" },
        totalSalary: { $sum: { $ifNull: ["$salary", 0] } },
        totalDeductions: { $sum: { $ifNull: ["$deductionAmount", 0] } },
        totalBonuses: { $sum: { $ifNull: ["$bonusAmount", 0] } },
        totalOtherCosts: { $sum: { $ifNull: ["$otherCostAmount", 0] } },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "teacher",
      },
    },
    { $unwind: "$teacher" },
    { $match: { "teacher.role": "Teacher" } },
    {
      $project: {
        _id: 0,
        teacherId: "$teacher._id",
        teacherName: {
          $ifNull: ["$teacher.fullName", "$teacher.username"],
        },
        totalSessions: 1,
        totalHours: { $round: ["$totalHours", 2] },
        totalSalary: 1,
        totalDeductions: 1,
        totalBonuses: 1,
        totalOtherCosts: 1,
        totalNetSalary: {
          $subtract: [
            { $add: ["$totalSalary", "$totalBonuses"] },
            { $add: ["$totalDeductions", "$totalOtherCosts"] },
          ],
        },
      },
    },
    { $sort: { teacherName: 1 } },
  ]);

module.exports = {
  aggregateAdminPayroll,
  aggregatePayrollSummary,
  classBelongsToTeacher,
  createSession,
  deleteSessionById,
  findClassById,
  findPopulatedSessionById,
  findSessionById,
  findTeacherById,
  findTeacherSessions,
  findTeachers,
};
