const Puzzle = require("../../../models/Puzzle");
const PuzzleAssignment = require("../../../models/PuzzleAssignment");
const Student = require("../../../models/Student");
const ClassModel = require("../../../models/Class");

const insertPuzzles = (rows = []) => Puzzle.insertMany(rows, { ordered: true });

const findPuzzlesByIds = (puzzleIds = []) =>
  Puzzle.find({ _id: { $in: puzzleIds } }).select("_id");

const listRecentPuzzles = ({ limit = 500 } = {}) =>
  Puzzle.find({})
    .populate("createdBy", "fullName role")
    .sort({ createdAt: -1 })
    .limit(limit);

const findClassesByIds = (classIds = []) =>
  ClassModel.find({ _id: { $in: classIds.filter(Boolean) } }).select(
    "studentIds",
  );

const findActiveStudentsByIds = (studentIds = []) =>
  Student.find({
    _id: { $in: studentIds },
    isDeleted: { $ne: true },
  }).select("_id");

const insertAssignments = (rows = []) =>
  PuzzleAssignment.insertMany(rows, { ordered: true });

module.exports = {
  findActiveStudentsByIds,
  findClassesByIds,
  findPuzzlesByIds,
  insertAssignments,
  insertPuzzles,
  listRecentPuzzles,
};
