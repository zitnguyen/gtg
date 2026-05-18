import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Chess } from "chess.js";
import authService from "../../../services/authService";
import parentService from "../../../services/parentService";
import pdfPuzzleService from "../../../services/pdfPuzzleService";
import PuzzlePlayBoard from "../../../components/Chessboard/PuzzlePlayBoard";

const StudentPuzzleTodayPage = () => {
  const user = authService.getCurrentUser();
  const role = String(user?.role || "").toLowerCase();
  const [children, setChildren] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignmentIndex, setAssignmentIndex] = useState(0);
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [game, setGame] = useState(new Chess());
  const [message, setMessage] = useState("");
  const [orientation, setOrientation] = useState("white");
  const [submitting, setSubmitting] = useState(false);
  const [syncingMove, setSyncingMove] = useState(false);

  useEffect(() => {
    const loadChildren = async () => {
      if (role !== "parent" || !user?._id) return;
      try {
        const data = await parentService.getStudents(user._id);
        const rows = Array.isArray(data) ? data : [];
        setChildren(rows);
        if (rows[0]?._id) setSelectedStudentId(String(rows[0]._id));
      } catch {
        setChildren([]);
      }
    };
    loadChildren();
  }, [role, user?._id]);

  const loadAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const params = role === "parent" ? { studentId: selectedStudentId } : {};
      const data = await pdfPuzzleService.getTodayAssignments(params);
      const items = Array.isArray(data?.items) ? data.items : [];
      setAssignments(items);
      setAssignmentIndex(0);
      setPuzzleIndex(0);
      const firstPuzzle = items?.[0]?.puzzles?.[0];
      if (firstPuzzle?.fen) {
        const next = new Chess();
        next.load(firstPuzzle.fen);
        setGame(next);
      } else {
        setGame(new Chess());
      }
      setMessage("");
    } finally {
      setLoading(false);
    }
  }, [role, selectedStudentId]);

  useEffect(() => {
    if (role === "parent" && !selectedStudentId) return;
    loadAssignments();
  }, [loadAssignments, role, selectedStudentId]);

  const currentAssignment = assignments[assignmentIndex] || null;
  const puzzles = Array.isArray(currentAssignment?.puzzles) ? currentAssignment.puzzles : [];
  const currentPuzzle = puzzles[puzzleIndex] || null;

  useEffect(() => {
    if (!currentPuzzle?.fen) return;
    try {
      const next = new Chess();
      next.load(currentPuzzle.fen);
      setGame(next);
    } catch {
      setMessage("Puzzle có FEN lỗi.");
    }
  }, [currentPuzzle?._id]);

  const submitMoveToServer = async (moveSan) => {
    if (!currentPuzzle?._id) return;
    const latestMove = moveSan || game.history().slice(-1)[0] || "";
    if (!latestMove) {
      setMessage("Bạn cần đi một nước trước.");
      return;
    }
    try {
      setSyncingMove(true);
      const payload = {
        move: latestMove,
        studentId: selectedStudentId || undefined,
      };
      const res = await pdfPuzzleService.submitMove(currentPuzzle._id, payload);
      setMessage(
        `Đã lưu nước ${res?.move || latestMove}. Accuracy ${res?.accuracy || 0}%`,
      );
    } catch (error) {
      setMessage(error?.response?.data?.message || "Không thể gửi nước đi.");
    } finally {
      setSyncingMove(false);
    }
  };

  const onPieceDrop = useCallback(
    ({ sourceSquare, targetSquare }) => {
      const copy = new Chess(game.fen());
      const moved = copy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });
      if (!moved) {
        setMessage("Nước đi không hợp lệ.");
        return false;
      }
      setGame(copy);
      setMessage("");
      submitMoveToServer(moved.san || "").catch(() => {});
      return true;
    },
    [game, currentPuzzle?._id, selectedStudentId],
  );

  const handleSubmitMove = async () => {
    if (submitting || syncingMove) return;
    try {
      setSubmitting(true);
      await submitMoveToServer();
    } finally {
      setSubmitting(false);
    }
  };

  const progressText = useMemo(() => {
    if (!currentAssignment) return "";
    return `${puzzleIndex + 1}/${puzzles.length}`;
  }, [currentAssignment, puzzleIndex, puzzles.length]);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="rounded-2xl border border-border bg-background p-5">
        <h2 className="text-2xl font-bold">Bài tập hôm nay</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Giải puzzle được giao và hệ thống lưu đầy đủ lịch sử nước đi.
        </p>
        {role === "parent" && children.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {children.map((child) => (
              <button
                key={child._id}
                type="button"
                onClick={() => setSelectedStudentId(String(child._id))}
                className={`px-3 py-1.5 rounded-full text-sm border ${
                  String(selectedStudentId) === String(child._id)
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-background border-border text-foreground"
                }`}
              >
                {child.fullName}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="rounded-xl border border-border bg-background p-6 text-sm text-muted-foreground">
          Đang tải assignment...
        </div>
      ) : assignments.length === 0 ? (
        <div className="rounded-xl border border-border bg-background p-6 text-sm text-muted-foreground">
          Hôm nay chưa có bài tập nào.
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
          <div className="rounded-2xl border border-border bg-background p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <div className="font-semibold">{currentAssignment?._id}</div>
                <div className="text-xs text-muted-foreground">Puzzle {progressText}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setOrientation((prev) => (prev === "white" ? "black" : "white"))
                  }
                  className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted"
                >
                  Flip board
                </button>
                <button
                  type="button"
                  onClick={handleSubmitMove}
                  disabled={submitting || syncingMove}
                  className="rounded-lg bg-primary text-white px-3 py-1.5 text-sm disabled:opacity-60"
                >
                  {submitting || syncingMove ? "Đang gửi..." : "Gửi lại nước cuối"}
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-slate-900 p-3 flex justify-center">
              <div className="w-full max-w-[560px]">
                <PuzzlePlayBoard
                  game={game}
                  onPieceDrop={onPieceDrop}
                  orientation={orientation}
                />
              </div>
            </div>
            {message ? <div className="mt-3 text-sm font-medium">{message}</div> : null}
          </div>

          <div className="rounded-2xl border border-border bg-background p-4">
            <div className="text-sm font-semibold mb-3">Danh sách assignment</div>
            <div className="space-y-2">
              {assignments.map((assignment, aIdx) => (
                <button
                  key={assignment._id}
                  type="button"
                  onClick={() => {
                    setAssignmentIndex(aIdx);
                    setPuzzleIndex(0);
                  }}
                  className={`w-full text-left rounded-lg border px-3 py-2 ${
                    aIdx === assignmentIndex
                      ? "border-blue-500 bg-blue-50"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <div className="text-xs text-muted-foreground">#{assignment._id}</div>
                  <div className="text-sm font-semibold">
                    {(assignment?.puzzles || []).length} puzzle
                  </div>
                </button>
              ))}
            </div>
            {puzzles.length > 1 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {puzzles.map((puzzle, pIdx) => (
                  <button
                    key={puzzle._id}
                    type="button"
                    onClick={() => setPuzzleIndex(pIdx)}
                    className={`px-2.5 py-1 rounded text-xs border ${
                      pIdx === puzzleIndex
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-background border-border"
                    }`}
                  >
                    {pIdx + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPuzzleTodayPage;
