/**
 * Course domain logic extracted from the controller (zlss-style: fat service,
 * thin controller). Keeps response shapes compatible with existing API consumers.
 */
const Course = require("../models/Course");
const Chapter = require("../models/Chapter");
const Lesson = require("../models/Lesson");
const Order = require("../models/Order");
const Student = require("../models/Student");
const CourseAccess = require("../models/CourseAccess");
const AppError = require("../utils/AppError");
const mongoose = require("mongoose");

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
};

exports.createCourse = async (data, userId) => {
  const {
    title,
    description,
    price,
    salePrice,
    level,
    category,
    tags,
    thumbnail,
    heroBackground,
    isPublished,
  } = data;

  let slug = slugify(title);
  const existingCourse = await Course.findOne({ slug });
  if (existingCourse) {
    slug = `${slug}-${Date.now()}`;
  }

  return Course.create({
    title,
    slug,
    description,
    price,
    salePrice,
    level,
    category,
    tags,
    thumbnail,
    heroBackground,
    instructor: userId,
    isPublished,
  });
};

exports.getAllCourses = async (query) => {
  const { level, category, keyword, admin } = query;
  const filter = {};
  if (admin !== "true") {
    filter.isPublished = true;
  }

  if (level) filter.level = level;
  if (category) filter.category = category;
  if (keyword) {
    filter.$or = [
      { title: { $regex: keyword, $options: "i" } },
      { tags: { $in: [new RegExp(keyword, "i")] } },
    ];
  }

  const courses = await Course.find(filter)
    .populate("instructor", "fullName avatar")
    .select("-description")
    .sort("-createdAt");

  if (!courses.length) return courses;

  const courseIds = courses.map((course) => course._id);
  const enrolledStats = await Order.aggregate([
    {
      $match: {
        status: "completed",
        "items.courseId": { $in: courseIds },
      },
    },
    { $unwind: "$items" },
    {
      $match: {
        "items.courseId": { $in: courseIds },
      },
    },
    {
      $group: {
        _id: "$items.courseId",
        buyers: { $addToSet: "$userId" },
      },
    },
    {
      $project: {
        _id: 1,
        enrolledStudents: { $size: "$buyers" },
      },
    },
  ]);

  const enrolledMap = new Map(
    enrolledStats.map((item) => [String(item._id), Number(item.enrolledStudents || 0)]),
  );

  const lessonStats = await Lesson.aggregate([
    {
      $match: {
        courseId: { $in: courseIds },
      },
    },
    {
      $group: {
        _id: "$courseId",
        totalLessons: { $sum: 1 },
        totalDuration: { $sum: { $ifNull: ["$duration", 0] } },
      },
    },
  ]);

  const lessonMap = new Map(
    lessonStats.map((item) => [
      String(item._id),
      {
        totalLessons: Number(item.totalLessons || 0),
        totalDuration: Number(item.totalDuration || 0),
      },
    ]),
  );

  return courses.map((course) => ({
    ...course.toObject(),
    totalLessons:
      lessonMap.get(String(course._id))?.totalLessons ??
      Number(course.totalLessons || 0),
    totalDuration:
      lessonMap.get(String(course._id))?.totalDuration ??
      Number(course.totalDuration || 0),
    enrolledStudents: enrolledMap.get(String(course._id)) || 0,
  }));
};

const canViewCourseContent = async (courseId, user) => {
  if (!user) return false;
  const role = String(user.role || "").toLowerCase();
  if (role === "admin") return true;

  const directAccess = await CourseAccess.exists({ courseId, userId: user._id });
  if (directAccess) return true;

  if (role === "parent") {
    const linkedGrantedStudent = await Student.exists({
      parentId: user._id,
      _id: {
        $in: await CourseAccess.find({ courseId })
          .distinct("userId"),
      },
      isDeleted: { $ne: true },
    });
    return Boolean(linkedGrantedStudent);
  }
  return false;
};

exports.getCourseBySlug = async (slug, user) => {
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(String(slug));
  const course = await (isObjectId
    ? Course.findById(slug)
    : Course.findOne({ slug })).populate(
    "instructor",
    "fullName avatar specialization",
  );

  if (!course) {
    throw new AppError("Không tìm thấy khóa học", 404);
  }

  const chapters = await Chapter.find({ courseId: course._id }).sort("order");
  const canViewContent = await canViewCourseContent(course._id, user);
  const courseContent = await Promise.all(
    chapters.map(async (chapter) => {
      const lessons = await Lesson.find({ chapterId: chapter._id }).sort("order");
      if (!canViewContent) {
        return {
          _id: chapter._id,
          title: chapter.title,
          order: chapter.order,
          lessonCount: lessons.length,
          lessons: [],
        };
      }
      return {
        ...chapter.toObject(),
        lessons,
      };
    }),
  );

  return {
    ...course.toObject(),
    chapters: courseContent,
    canViewContent,
  };
};

exports.getCourseById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("ID khóa học không hợp lệ", 400);
  }

  const course = await Course.findById(id).populate(
    "instructor",
    "fullName avatar specialization",
  );

  if (!course) {
    throw new AppError("Không tìm thấy khóa học", 404);
  }

  const chapters = await Chapter.find({ courseId: course._id }).sort("order");
  const courseContent = await Promise.all(
    chapters.map(async (chapter) => {
      const lessons = await Lesson.find({ chapterId: chapter._id }).sort("order");
      return {
        ...chapter.toObject(),
        lessons,
      };
    }),
  );

  const accessUserIds = await CourseAccess.find({ courseId: course._id }).distinct(
    "userId",
  );

  return {
    ...course.toObject(),
    chapters: courseContent,
    accessUserIds: accessUserIds.map((item) => String(item)),
  };
};

exports.getCourseAccess = async (courseId) => {
  const accessList = await CourseAccess.find({ courseId }).populate(
    "userId",
    "_id fullName username email role",
  );
  return accessList.map((item) => item.userId).filter(Boolean);
};

exports.setCourseAccess = async (courseId, userIds, grantedBy) => {
  const sanitizedIds = Array.from(
    new Set(
      (Array.isArray(userIds) ? userIds : [])
        .map((id) => String(id || "").trim())
        .filter((id) => mongoose.Types.ObjectId.isValid(id)),
    ),
  );

  await CourseAccess.deleteMany({ courseId });
  if (sanitizedIds.length === 0) return [];

  await CourseAccess.insertMany(
    sanitizedIds.map((userId) => ({
      courseId,
      userId,
      grantedBy,
    })),
    { ordered: false },
  );

  return CourseAccess.find({ courseId }).distinct("userId");
};

exports.updateCourse = async (id, body) => {
  const course = await Course.findByIdAndUpdate(id, body, {
    new: true,
    runValidators: true,
  });

  if (!course) {
    throw new AppError("Không tìm thấy khóa học", 404);
  }

  return course;
};

exports.deleteCourse = async (id) => {
  const course = await Course.findByIdAndDelete(id);
  if (!course) {
    throw new AppError("Không tìm thấy khóa học", 404);
  }

  await Chapter.deleteMany({ courseId: course._id });
  await Lesson.deleteMany({ courseId: course._id });

  return course;
};

/**
 * Courses the user has purchased (completed orders), inspired by zlss order flow.
 */
exports.getMyCourses = async (userId) => {
  const [orders, accessRows] = await Promise.all([
    Order.find({
      userId,
      status: "completed",
    }).populate("items.courseId"),
    CourseAccess.find({ userId }).populate("courseId"),
  ]);

  const courses = [];
  const seen = new Set();

  for (const order of orders) {
    for (const item of order.items || []) {
      const course = item?.courseId;
      if (!course?._id) continue;
      const key = String(course._id);
      if (seen.has(key)) continue;
      seen.add(key);
      courses.push(course);
    }
  }

  for (const row of accessRows) {
    const course = row?.courseId;
    if (!course?._id) continue;
    const key = String(course._id);
    if (seen.has(key)) continue;
    seen.add(key);
    courses.push(course);
  }

  return courses;
};

exports.getParentChildrenCourses = async (parentUserId) => {
  const children = await Student.find({
    parentId: parentUserId,
    isDeleted: { $ne: true },
  })
    .select("_id fullName")
    .sort({ fullName: 1 });

  if (!children.length) return [];

  const childIds = children.map((child) => child._id);
  const accessRows = await CourseAccess.find({
    userId: { $in: [...childIds, parentUserId] },
  }).populate("courseId");

  if (!accessRows.length) {
    return children.map((child) => ({
      studentId: child._id,
      studentName: child.fullName,
      courses: [],
    }));
  }

  const validCourseDocs = accessRows
    .map((row) => row.courseId)
    .filter((course) => course && course._id);
  const courseIds = [...new Set(validCourseDocs.map((course) => String(course._id)))];

  const chapters = await Chapter.find({
    courseId: { $in: courseIds },
  })
    .select("_id courseId order")
    .sort({ order: 1 });

  const chapterIds = chapters.map((chapter) => chapter._id);
  const lessons = await Lesson.find({
    chapterId: { $in: chapterIds },
  })
    .select("_id chapterId order")
    .sort({ order: 1 });

  const firstLessonByCourse = new Map();
  const chapterCourseMap = new Map(
    chapters.map((chapter) => [String(chapter._id), String(chapter.courseId)]),
  );
  for (const lesson of lessons) {
    const courseId = chapterCourseMap.get(String(lesson.chapterId));
    if (!courseId) continue;
    if (!firstLessonByCourse.has(courseId)) {
      firstLessonByCourse.set(courseId, String(lesson._id));
    }
  }

  const resultByStudent = new Map(
    children.map((child) => [
      String(child._id),
      {
        studentId: child._id,
        studentName: child.fullName,
        courses: [],
      },
    ]),
  );

  const seenByStudentCourse = new Set();
  const parentDirectCourses = [];
  for (const row of accessRows) {
    const ownerUserId = String(row.userId);
    const course = row.courseId;
    if (!course?._id) continue;

    if (ownerUserId === String(parentUserId)) {
      parentDirectCourses.push(course);
      continue;
    }

    if (!resultByStudent.has(ownerUserId)) continue;
    const dedupeKey = `${ownerUserId}_${course._id}`;
    if (seenByStudentCourse.has(dedupeKey)) continue;
    seenByStudentCourse.add(dedupeKey);

    resultByStudent.get(ownerUserId).courses.push({
      _id: course._id,
      title: course.title,
      slug: course.slug,
      thumbnail: course.thumbnail,
      description: course.description || "",
      firstLessonId: firstLessonByCourse.get(String(course._id)) || null,
    });
  }

  // If access is granted directly to Parent account, show those courses across children cards.
  for (const child of children) {
    const studentId = String(child._id);
    for (const course of parentDirectCourses) {
      const dedupeKey = `${studentId}_${course._id}`;
      if (seenByStudentCourse.has(dedupeKey)) continue;
      seenByStudentCourse.add(dedupeKey);
      resultByStudent.get(studentId).courses.push({
        _id: course._id,
        title: course.title,
        slug: course.slug,
        thumbnail: course.thumbnail,
        description: course.description || "",
        firstLessonId: firstLessonByCourse.get(String(course._id)) || null,
      });
    }
  }

  return Array.from(resultByStudent.values());
};
