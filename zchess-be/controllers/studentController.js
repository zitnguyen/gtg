const Student = require("../models/Student");
const User = require("../models/User");
const Class = require("../models/Class");
const mongoose = require("mongoose");
const asyncHandler = require("../middleware/asyncHandler");
const SKILL_LEVELS = new Set([
  "kid1",
  "kid2",
  "level1",
  "level2",
  "level3",
  "level4",
  "level5",
  "level6",
  "level7",
  "level8",
  "level9",
  "level10",
]);

const sendSuccess = (res, { status = 200, data, message = "" }) => {
  return res.status(status).json({
    success: true,
    data,
    message,
  });
};

const sendFail = (res, { status = 400, message }) => {
  return res.status(status).json({
    success: false,
    data: null,
    message,
  });
};

const normalizeSkillLevel = (raw) => {
  if (!raw || typeof raw !== "string") return undefined;
  const value = raw.trim().toLowerCase();
  const aliases = {
    beginner: "level1",
    basic: "level1",
    advanced: "level10",
    kid: "kid1",
    "kid beginner": "kid1",
    "kid advanced": "kid2",
  };
  const normalized = aliases[value] || value;
  return SKILL_LEVELS.has(normalized) ? normalized : undefined;
};

const safeNumber = (value, fallback = 0) => {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const pickStudentPayload = (body) => {
  const hasTotalSessions = body.totalSessions !== undefined;
  const hasTotalLessons =
    body.totalLessons !== undefined || body.sessionsTotal !== undefined;
  const hasCompletedLessons = body.completedLessons !== undefined;
  const totalSessions = hasTotalSessions
    ? safeNumber(body.totalSessions, 0)
    : undefined;
  const totalLessons = hasTotalLessons
    ? safeNumber(
        body.totalLessons !== undefined ? body.totalLessons : body.sessionsTotal,
        0,
      )
    : undefined;
  const completedLessons = hasCompletedLessons
    ? safeNumber(body.completedLessons, 0)
    : undefined;
  const normalizedSkillLevel = normalizeSkillLevel(body.skillLevel);

  const payload = {};
  if (body.fullName !== undefined) payload.fullName = body.fullName;
  if (body.dateOfBirth !== undefined) payload.dateOfBirth = body.dateOfBirth;
  if (body.enrollmentDate !== undefined) {
    payload.enrollmentDate = body.enrollmentDate;
  }
  if (body.address !== undefined) payload.address = body.address;
  if (body.teacherId !== undefined) payload.teacherId = body.teacherId || undefined;
  if (normalizedSkillLevel) payload.skillLevel = normalizedSkillLevel;
  if (hasTotalSessions) payload.totalSessions = totalSessions;
  if (hasTotalLessons) payload.totalLessons = totalLessons;
  if (hasCompletedLessons) payload.completedLessons = completedLessons;
  if (body.note !== undefined) payload.note = body.note;
  return payload;
};

const findParentByPayload = async (req) => {
  const parentPhone = req.body.parentPhone;
  const parentId = req.body.parentId;

  if (parentPhone) {
    return User.findOne({ phone: parentPhone, role: "Parent" });
  }

  if (parentId) {
    if (!isValidObjectId(parentId)) {
      return null;
    }
    return User.findOne({ _id: parentId, role: "Parent" });
  }

  return null;
};

exports.createStudent = asyncHandler(async (req, res) => {
  if (!req.body.fullName) {
    return sendFail(res, {
      status: 400,
      message: "Thiếu thông tin tên học viên",
    });
  }
  if (req.body.skillLevel && !normalizeSkillLevel(req.body.skillLevel)) {
    return sendFail(res, {
      status: 400,
      message: "skillLevel không hợp lệ",
    });
  }

  const parent = await findParentByPayload(req);
  if (!parent) {
    return sendFail(res, {
      status: 400,
      message: "Không tìm thấy phụ huynh hợp lệ",
    });
  }

  const payload = pickStudentPayload(req.body);
  if (payload.totalSessions === undefined) payload.totalSessions = 0;
  if (payload.totalLessons === undefined) payload.totalLessons = 0;
  if (payload.completedLessons === undefined) payload.completedLessons = 0;
  if (payload.completedLessons > payload.totalLessons) {
    payload.completedLessons = payload.totalLessons;
  }
  const duplicateFilter = {
    fullName: payload.fullName,
    parentId: parent._id,
  };
  if (payload.dateOfBirth) {
    duplicateFilter.dateOfBirth = payload.dateOfBirth;
  }

  const duplicate = await Student.findOne({
    ...duplicateFilter,
    isDeleted: { $ne: true },
  });
  if (duplicate) {
    return sendFail(res, {
      status: 409,
      message: "Học viên đã tồn tại",
    });
  }

  const student = await Student.create({
    ...payload,
    parentId: parent._id,
  });

  await student.populate("parentId", "fullName email phone");
  await student.populate("teacherId", "fullName username email phone");

  return sendSuccess(res, {
    status: 201,
    data: student,
    message: "Tạo học viên thành công",
  });
});

exports.getAllStudents = asyncHandler(async (req, res) => {
  const { parentId, keyword, includeDeleted, page, limit } = req.query;
  const filter = {
    isDeleted: includeDeleted === "true" ? { $in: [true, false] } : { $ne: true },
  };

  if (parentId) filter.parentId = parentId;
  if (keyword) {
    filter.fullName = { $regex: keyword, $options: "i" };
  }

  const baseQuery = Student.find(filter)
    .populate("parentId", "fullName email phone")
    .populate("teacherId", "fullName username email phone")
    .sort("-createdAt");

  const hasPagination = page !== undefined || limit !== undefined;
  if (!hasPagination) {
    const students = await baseQuery;
    return sendSuccess(res, {
      data: students,
      message: "Lấy danh sách học viên thành công",
    });
  }

  const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
  const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 200);
  const skip = (pageNumber - 1) * limitNumber;

  const [students, total] = await Promise.all([
    baseQuery.skip(skip).limit(limitNumber),
    Student.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    data: {
      items: students,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber) || 1,
      },
    },
    message: "Lấy danh sách học viên thành công (phân trang)",
  });
});

exports.getStudentById = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return sendFail(res, {
      status: 400,
      message: "Invalid ID format",
    });
  }

  const student = await Student.findById(req.params.id).populate(
    "parentId",
    "fullName email phone",
  );
  await student?.populate("teacherId", "fullName username email phone");

  if (!student) {
    return sendFail(res, {
      status: 404,
      message: "Học viên không tồn tại",
    });
  }
  if (student.isDeleted) {
    return sendFail(res, {
      status: 404,
      message: "Học viên đã bị xóa",
    });
  }

  return sendSuccess(res, {
    data: student,
    message: "Lấy chi tiết học viên thành công",
  });
});

exports.updateStudent = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return sendFail(res, {
      status: 400,
      message: "Invalid ID format",
    });
  }

  const existing = await Student.findOne({
    _id: req.params.id,
    isDeleted: { $ne: true },
  });
  if (!existing) {
    return sendFail(res, {
      status: 404,
      message: "Học viên không tồn tại",
    });
  }
  if (req.body.skillLevel && !normalizeSkillLevel(req.body.skillLevel)) {
    return sendFail(res, {
      status: 400,
      message: "skillLevel không hợp lệ",
    });
  }
  if (req.body.fullName !== undefined && !String(req.body.fullName).trim()) {
    return sendFail(res, {
      status: 400,
      message: "Thiếu thông tin tên học viên",
    });
  }

  let nextParentId = existing.parentId;
  if (req.body.parentPhone || req.body.parentId) {
    const parent = await findParentByPayload(req);
    if (!parent) {
      return sendFail(res, {
        status: 400,
        message: "Không tìm thấy phụ huynh hợp lệ",
      });
    }
    nextParentId = parent._id;
  }

  const payload = pickStudentPayload(req.body);
  if (payload.totalSessions === undefined) payload.totalSessions = existing.totalSessions;
  if (payload.totalLessons === undefined) payload.totalLessons = existing.totalLessons;
  if (payload.completedLessons === undefined) {
    payload.completedLessons = existing.completedLessons;
  }
  if (payload.completedLessons > payload.totalLessons) {
    payload.completedLessons = payload.totalLessons;
  }
  payload.parentId = nextParentId;

  const student = await Student.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true,
  })
    .populate("parentId", "fullName email phone")
    .populate("teacherId", "fullName username email phone");

  return sendSuccess(res, {
    data: student,
    message: "Cập nhật học viên thành công",
  });
});

exports.deleteStudent = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return sendFail(res, {
      status: 400,
      message: "Invalid ID format",
    });
  }

  const student = await Student.findOneAndUpdate(
    { _id: req.params.id, isDeleted: { $ne: true } },
    { isDeleted: true, deletedAt: new Date(), lifecycleStatus: "archived" },
    { new: true },
  );
  if (!student) {
    return sendFail(res, {
      status: 404,
      message: "Học viên không tồn tại",
    });
  }

  // Archive, không xoá lịch sử học tập/tài chính. Dữ liệu Schedule/Progress
  // được giữ để có thể restore hoặc đối soát khi phụ huynh khiếu nại.
  await Class.updateMany(
    { studentIds: { $in: [student._id] } },
    { $pull: { studentIds: student._id } },
  );
  await Class.updateMany(
    { currentStudents: { $gt: 0 } },
    [{ $set: { currentStudents: { $size: { $ifNull: ["$studentIds", []] } } } }],
  );

  return sendSuccess(res, {
    data: { id: req.params.id, isDeleted: true },
    message: "Đã lưu trữ học viên và giữ nguyên lịch sử liên quan",
  });
});

exports.restoreStudent = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return sendFail(res, {
      status: 400,
      message: "Invalid ID format",
    });
  }

  const student = await Student.findOneAndUpdate(
    { _id: req.params.id, isDeleted: true },
    {
      isDeleted: false,
      deletedAt: null,
      lifecycleStatus: "active",
      lastActiveAt: new Date(),
    },
    { new: true, runValidators: true },
  )
    .populate("parentId", "fullName email phone")
    .populate("teacherId", "fullName username email phone");

  if (!student) {
    return sendFail(res, {
      status: 404,
      message: "Không tìm thấy học viên đã lưu trữ",
    });
  }

  return sendSuccess(res, {
    data: student,
    message: "Khôi phục học viên thành công",
  });
});

exports.getMyChildren = asyncHandler(async (req, res) => {
  const students = await Student.find({
    parentId: req.user._id,
    isDeleted: { $ne: true },
  }).sort("-createdAt");
  return sendSuccess(res, {
    data: students,
    message: "Lấy danh sách con của phụ huynh thành công",
  });
});

exports.getStudentsByParentId = asyncHandler(async (req, res) => {
  const { parentId } = req.params;
  if (!isValidObjectId(parentId)) {
    return sendFail(res, {
      status: 400,
      message: "Invalid ID format",
    });
  }

  if (
    req.user.role === "Parent" &&
    String(req.user._id) !== String(parentId)
  ) {
    return sendFail(res, {
      status: 403,
      message: "Forbidden",
    });
  }

  const students = await Student.find({ parentId, isDeleted: { $ne: true } })
    .populate("parentId", "fullName email phone")
    .populate("teacherId", "fullName username email phone")
    .sort("-createdAt");

  return sendSuccess(res, {
    data: students,
    message: "Lấy học viên theo phụ huynh thành công",
  });
});

exports.getLeaderboard = asyncHandler(async (req, res) => {
  const level = normalizeSkillLevel(req.query.level);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
  const childId = req.query.childId;

  const match = { isDeleted: { $ne: true } };

  const rows = await Student.aggregate([
    { $match: match },
    {
      $project: {
        fullName: 1,
        studentId: 1,
        skillLevel: 1,
        createdAt: 1,
        completedLessons: { $ifNull: ["$completedLessons", 0] },
        totalLessons: { $ifNull: ["$totalLessons", 0] },
      },
    },
    {
      $addFields: {
        progressPercent: {
          $cond: [
            { $gt: ["$totalLessons", 0] },
            {
              $round: [
                {
                  $multiply: [
                    { $divide: ["$completedLessons", "$totalLessons"] },
                    100,
                  ],
                },
                0,
              ],
            },
            0,
          ],
        },
      },
    },
    {
      $addFields: {
        skillLevelScore: {
          $switch: {
            branches: [
              { case: { $eq: ["$skillLevel", "kid1"] }, then: 1 },
              { case: { $eq: ["$skillLevel", "kid2"] }, then: 2 },
              { case: { $eq: ["$skillLevel", "level1"] }, then: 3 },
              { case: { $eq: ["$skillLevel", "level2"] }, then: 4 },
              { case: { $eq: ["$skillLevel", "level3"] }, then: 5 },
              { case: { $eq: ["$skillLevel", "level4"] }, then: 6 },
              { case: { $eq: ["$skillLevel", "level5"] }, then: 7 },
              { case: { $eq: ["$skillLevel", "level6"] }, then: 8 },
              { case: { $eq: ["$skillLevel", "level7"] }, then: 9 },
              { case: { $eq: ["$skillLevel", "level8"] }, then: 10 },
              { case: { $eq: ["$skillLevel", "level9"] }, then: 11 },
              { case: { $eq: ["$skillLevel", "level10"] }, then: 12 },
            ],
            default: 0,
          },
        },
        learningScore: {
          $add: [{ $multiply: ["$progressPercent", 1000] }, "$completedLessons"],
        },
      },
    },
    // Rank globally by level first (Level 10 highest), then learning metrics.
    // Tie-break rule: created earlier => higher rank.
    {
      $sort: {
        skillLevelScore: -1,
        learningScore: -1,
        completedLessons: -1,
        createdAt: 1,
        fullName: 1,
      },
    },
  ]);

  const rankedRowsAll = rows.map((item, index) => ({
    rank: index + 1,
    ...item,
  }));

  const rankedRows = level
    ? rankedRowsAll.filter((item) => String(item.skillLevel || "") === level)
    : rankedRowsAll;

  let myChildRank = null;
  if (childId && isValidObjectId(childId)) {
    const found = rankedRowsAll.find((item) => String(item._id) === String(childId));
    if (found) {
      myChildRank = found.rank;
    }
  }

  return sendSuccess(res, {
    data: {
      level: level || "all",
      totalInLevel: rankedRows.length,
      myChildRank,
      items: rankedRows.slice(0, limit),
    },
    message: "Lấy bảng xếp hạng thành công",
  });
});
