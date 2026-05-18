const puzzleRepository = require("../repositories/puzzleRepository");

const resolveStudentIds = async ({ studentIds = [], classIds = [] }) => {
  const idSet = new Set((Array.isArray(studentIds) ? studentIds : []).map(String));
  const classes = await puzzleRepository.findClassesByIds(
    Array.isArray(classIds) ? classIds : [],
  );
  classes.forEach((item) => {
    (Array.isArray(item?.studentIds) ? item.studentIds : []).forEach((id) => {
      idSet.add(String(id));
    });
  });
  return Array.from(idSet);
};

const assignPuzzles = async ({ body, userId }) => {
  const puzzleIds = Array.isArray(body.puzzleIds) ? body.puzzleIds : [];
  const studentIds = Array.isArray(body.studentIds) ? body.studentIds : [];
  const classIds = Array.isArray(body.classIds) ? body.classIds : [];
  const deadline = body.deadline ? new Date(body.deadline) : null;

  if (!puzzleIds.length) {
    const error = new Error("Thiếu puzzleIds.");
    error.statusCode = 400;
    throw error;
  }
  if (!deadline || Number.isNaN(deadline.getTime())) {
    const error = new Error("Deadline không hợp lệ.");
    error.statusCode = 400;
    throw error;
  }

  const puzzles = await puzzleRepository.findPuzzlesByIds(puzzleIds);
  if (puzzles.length !== puzzleIds.length) {
    const error = new Error("Một số puzzle không tồn tại.");
    error.statusCode = 400;
    throw error;
  }

  const finalStudentIds = await resolveStudentIds({ studentIds, classIds });
  if (!finalStudentIds.length) {
    const error = new Error("Không tìm thấy học viên để giao bài.");
    error.statusCode = 400;
    throw error;
  }

  const students = await puzzleRepository.findActiveStudentsByIds(finalStudentIds);
  if (!students.length) {
    const error = new Error("Danh sách học viên không hợp lệ.");
    error.statusCode = 400;
    throw error;
  }

  const assignments = await puzzleRepository.insertAssignments(
    students.map((student) => ({
      studentId: student._id,
      puzzleIds: puzzles.map((puzzle) => puzzle._id),
      deadline,
      status: "active",
      createdBy: userId,
    })),
  );
  return { items: assignments, total: assignments.length };
};

module.exports = {
  assignPuzzles,
  resolveStudentIds,
};
