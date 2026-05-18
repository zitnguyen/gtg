import React, { useEffect, useMemo, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import exerciseAssignmentService from "../../../services/exerciseAssignmentService";
import studentService from "../../../services/studentService";
import classService from "../../../services/classService";

const ExerciseAssignmentManager = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [progressRows, setProgressRows] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    difficulty: "mixed",
    assignedDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    positionFen: new Chess().fen(),
    studentIds: [],
    classIds: [],
  });
  const [setupGame, setSetupGame] = useState(new Chess());
  const [fenInput, setFenInput] = useState(new Chess().fen());
  const [setupMoves, setSetupMoves] = useState([]);
  const [pdfFile, setPdfFile] = useState(null);
  const [autoAssigning, setAutoAssigning] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentRes, classRes, assignmentRes] = await Promise.all([
        studentService.getAll(),
        classService.getAll(),
        exerciseAssignmentService.getManagementAssignments(),
      ]);
      setStudents(Array.isArray(studentRes) ? studentRes : []);
      setClasses(Array.isArray(classRes) ? classRes : []);
      setAssignments(Array.isArray(assignmentRes?.items) ? assignmentRes.items : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedSummary = useMemo(
    () => ({
      studentCount: form.studentIds.length,
      classCount: form.classIds.length,
    }),
    [form],
  );

  const toggleInArray = (key, id) => {
    setForm((prev) => {
      const exists = prev[key].includes(id);
      const next = exists ? prev[key].filter((item) => item !== id) : [...prev[key], id];
      return { ...prev, [key]: next };
    });
  };

  const handleCreateAssignment = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) {
      alert("Vui lòng nhập tiêu đề.");
      return;
    }
    if (!form.positionFen.trim()) {
      alert("Vui lòng thiết lập thế cờ (FEN).");
      return;
    }
    if (form.studentIds.length === 0 && form.classIds.length === 0) {
      alert("Cần chọn học viên hoặc lớp.");
      return;
    }
    try {
      setSaving(true);
      await exerciseAssignmentService.createAssignment({
        ...form,
        exerciseIds: [],
        dueDate: new Date(form.dueDate).toISOString(),
        assignedDate: new Date(form.assignedDate).toISOString(),
      });
      alert("Đã giao bài tập thành công.");
      const resetFen = new Chess().fen();
      setForm((prev) => ({
        ...prev,
        title: "",
        description: "",
        positionFen: resetFen,
      }));
      setSetupGame(new Chess());
      setSetupMoves([]);
      setFenInput(resetFen);
      await loadData();
    } catch (error) {
      alert(error?.response?.data?.message || "Không thể tạo assignment.");
    } finally {
      setSaving(false);
    }
  };

  const onBoardDrop = (sourceSquare, targetSquare) => {
    const copy = new Chess(setupGame.fen());
    const move = copy.move({ from: sourceSquare, to: targetSquare, promotion: "q" });
    if (!move) return false;
    const nextFen = copy.fen();
    setSetupGame(copy);
    setSetupMoves(copy.history());
    setFenInput(nextFen);
    setForm((prev) => ({ ...prev, positionFen: nextFen }));
    return true;
  };

  const boardOptions = useMemo(
    () => ({
      id: "assignment-setup-board",
      position: setupGame.fen(),
      onPieceDrop: ({ sourceSquare, targetSquare }) =>
        onBoardDrop(sourceSquare, targetSquare),
      boardOrientation: "white",
      animationDurationInMs: 180,
      boardStyle: { width: "100%", maxWidth: "360px" },
    }),
    [setupGame],
  );

  const applyFen = () => {
    try {
      const copy = new Chess();
      copy.load(fenInput.trim());
      const nextFen = copy.fen();
      setSetupGame(copy);
      setSetupMoves(copy.history());
      setFenInput(nextFen);
      setForm((prev) => ({ ...prev, positionFen: nextFen }));
    } catch {
      alert("FEN không hợp lệ.");
    }
  };

  const handleViewProgress = async (assignmentId) => {
    try {
      const data = await exerciseAssignmentService.getAssignmentProgress(assignmentId);
      setSelectedAssignment(data?.assignment || null);
      setProgressRows(Array.isArray(data?.rows) ? data.rows : []);
    } catch (error) {
      alert(error?.response?.data?.message || "Không tải được tiến độ.");
    }
  };

  const handleAutoAssignPdf = async () => {
    if (!pdfFile) {
      alert("Vui lòng chọn file PDF.");
      return;
    }
    if (!form.title.trim()) {
      alert("Vui lòng nhập tiêu đề nhóm bài tập.");
      return;
    }
    if (form.studentIds.length === 0 && form.classIds.length === 0) {
      alert("Cần chọn học viên hoặc lớp.");
      return;
    }
    try {
      setAutoAssigning(true);
      const result = await exerciseAssignmentService.autoAssignFromPdf({
        file: pdfFile,
        title: form.title,
        description: form.description,
        difficulty: form.difficulty,
        studentIds: form.studentIds,
        classIds: form.classIds,
        assignedDate: new Date(form.assignedDate).toISOString(),
        dueDate: new Date(form.dueDate).toISOString(),
      });
      alert(
        result?.message ||
          `Đã tự động tạo ${result?.totalAssignments || 0} bài tập từ PDF.`,
      );
      setPdfFile(null);
      await loadData();
    } catch (error) {
      alert(error?.response?.data?.message || "Tự động giao bài từ PDF thất bại.");
    } finally {
      setAutoAssigning(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="rounded-2xl border border-border bg-background p-5">
        <h2 className="text-2xl font-bold">Giao bài tập cờ mỗi ngày</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Admin/Teacher tạo assignment với nhiều puzzle, giao theo học viên hoặc lớp.
        </p>
      </div>

      <form
        onSubmit={handleCreateAssignment}
        className="rounded-2xl border border-border bg-background p-5 space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            className="rounded-lg border border-border px-3 py-2"
            placeholder="Tiêu đề bài tập"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          />
          <select
            className="rounded-lg border border-border px-3 py-2"
            value={form.difficulty}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, difficulty: e.target.value }))
            }
          >
            <option value="mixed">Mixed</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <textarea
          className="w-full rounded-lg border border-border px-3 py-2"
          rows={2}
          placeholder="Mô tả ngắn"
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-sm">
            Ngày giao
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-border px-3 py-2"
              value={form.assignedDate}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, assignedDate: e.target.value }))
              }
            />
          </label>
          <label className="text-sm">
            Hạn nộp
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-border px-3 py-2"
              value={form.dueDate}
              onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
            />
          </label>
        </div>

        <div className="rounded-lg border border-border p-3">
          <div className="text-sm font-semibold mb-2">Thiết lập thế cờ bài tập</div>
          <div className="flex flex-col xl:flex-row gap-4 items-start">
            <div className="w-full max-w-[360px]">
              <Chessboard options={boardOptions} />
            </div>
            <div className="flex-1 w-full space-y-2">
              <textarea
                rows={3}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                value={fenInput}
                onChange={(e) => setFenInput(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={applyFen}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted"
                >
                  Áp dụng FEN
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const reset = new Chess();
                    const resetFen = reset.fen();
                    setSetupGame(reset);
                    setSetupMoves([]);
                    setFenInput(resetFen);
                    setForm((prev) => ({ ...prev, positionFen: resetFen }));
                  }}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted"
                >
                  Reset bàn cờ
                </button>
              </div>
              {setupMoves.length > 0 ? (
                <div className="text-xs text-muted-foreground">
                  Đã setup {setupMoves.length} nước đi.
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-3">
          <div className="text-sm font-semibold text-blue-800 mb-2">
            Tự động tạo bài tập từ PDF cờ vua
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
              className="text-sm"
            />
            <button
              type="button"
              onClick={handleAutoAssignPdf}
              disabled={autoAssigning}
              className="rounded-lg bg-blue-600 text-white px-3 py-1.5 text-sm font-semibold disabled:opacity-60"
            >
              {autoAssigning ? "Đang phân tích PDF..." : "Phân tích PDF & giao tự động"}
            </button>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Hệ thống sẽ trích xuất FEN/PGN từ PDF, tạo nhiều bài tập và giao cho danh sách học viên/lớp đã chọn.
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-lg border border-border p-3 max-h-64 overflow-auto">
            <div className="text-sm font-semibold mb-2">Học viên</div>
            {students.map((item) => (
              <label key={item._id} className="flex items-center gap-2 text-sm mb-1">
                <input
                  type="checkbox"
                  checked={form.studentIds.includes(item._id)}
                  onChange={() => toggleInArray("studentIds", item._id)}
                />
                <span>{item.fullName}</span>
              </label>
            ))}
          </div>
          <div className="rounded-lg border border-border p-3 max-h-64 overflow-auto">
            <div className="text-sm font-semibold mb-2">Lớp học</div>
            {classes.map((item) => (
              <label key={item._id} className="flex items-center gap-2 text-sm mb-1">
                <input
                  type="checkbox"
                  checked={form.classIds.includes(item._id)}
                  onChange={() => toggleInArray("classIds", item._id)}
                />
                <span>{item.className}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            1 thế cờ • {selectedSummary.studentCount} học viên • {selectedSummary.classCount} lớp
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-primary text-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
          >
            {saving ? "Đang giao..." : "Giao bài tập"}
          </button>
        </div>
      </form>

      <div className="rounded-2xl border border-border bg-background p-5">
        <h3 className="text-lg font-bold mb-3">Assignment đã tạo</h3>
        {loading ? (
          <div className="text-sm text-muted-foreground">Đang tải...</div>
        ) : assignments.length === 0 ? (
          <div className="text-sm text-muted-foreground">Chưa có assignment nào.</div>
        ) : (
          <div className="space-y-2">
            {assignments.map((item) => (
              <div
                key={item._id}
                className="rounded-lg border border-border p-3 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="font-semibold">{item.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(item.assignedDate).toLocaleDateString("vi-VN")} •{" "}
                    {item.positionFen ? "Đã thiết lập FEN" : "Chưa có FEN"} •{" "}
                    {item.studentIds?.length || 0} học viên
                  </div>
                </div>
                <button
                  type="button"
                  className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted"
                  onClick={() => handleViewProgress(item._id)}
                >
                  Xem tiến độ
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedAssignment && (
        <div className="rounded-2xl border border-border bg-background p-5">
          <h3 className="text-lg font-bold">
            Tiến độ: {selectedAssignment.title}
          </h3>
          <div className="mt-3 space-y-2">
            {progressRows.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                Chưa có dữ liệu làm bài.
              </div>
            ) : (
              progressRows.map((row) => (
                <div
                  key={row._id}
                  className="rounded-lg border border-border px-3 py-2 text-sm"
                >
                  {(() => {
                    const latestSubmission = Array.isArray(row.submissions)
                      ? row.submissions[row.submissions.length - 1]
                      : null;
                    const latestMoves = Array.isArray(latestSubmission?.moves)
                      ? latestSubmission.moves
                      : [];
                    return (
                      <>
                  <span className="font-semibold">
                    {row?.studentId?.fullName || "Học viên"}
                  </span>{" "}
                  • Nộp {row.submittedCount || 0} lần • {row.timeSpentSec}s
                  {row.latestSubmittedFen ? (
                    <div className="mt-1 text-xs text-muted-foreground break-all">
                      FEN mới nhất: {row.latestSubmittedFen}
                    </div>
                  ) : null}
                  {latestMoves.length > 0 ? (
                    <div className="mt-1 text-xs text-muted-foreground break-all">
                      Nước đi mới nhất: {latestMoves.join(" ")}
                    </div>
                  ) : null}
                      </>
                    );
                  })()}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseAssignmentManager;
