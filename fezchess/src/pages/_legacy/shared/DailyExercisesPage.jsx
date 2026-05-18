/**
 * @legacy Bài tập theo assignment cũ; route hiện tại dùng StudentPuzzleTodayPage.
 */
import React, { useEffect, useMemo, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import authService from "../../../services/authService";
import parentService from "../../../services/parentService";
import exerciseAssignmentService from "../../../services/exerciseAssignmentService";

const DailyExercisesPage = () => {
  const user = authService.getCurrentUser();
  const role = String(user?.role || "").toLowerCase();
  const [children, setChildren] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeAssignmentIndex, setActiveAssignmentIndex] = useState(0);
  const [game, setGame] = useState(new Chess());
  const [moveHistory, setMoveHistory] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastSubmitAt, setLastSubmitAt] = useState(null);

  useEffect(() => {
    const initChildren = async () => {
      if (role !== "parent" || !user?._id) return;
      try {
        const rows = await parentService.getStudents(user._id);
        const safeRows = Array.isArray(rows) ? rows : [];
        setChildren(safeRows);
        if (safeRows[0]?._id) setSelectedStudentId(String(safeRows[0]._id));
      } catch {
        setChildren([]);
      }
    };
    initChildren();
  }, [role, user?._id]);

  const loadAssignments = async (studentId) => {
    try {
      setLoading(true);
      const data = await exerciseAssignmentService.getMyTodayAssignments(
        studentId ? { studentId } : {},
      );
      const assignmentItems = Array.isArray(data?.items) ? data.items : [];
      setItems(assignmentItems);
      setActiveAssignmentIndex(0);
      setFeedback("");
      const firstFen = String(assignmentItems?.[0]?.positionFen || "").trim();
      if (firstFen) {
        try {
          const nextGame = new Chess();
          nextGame.load(firstFen);
          setGame(nextGame);
          setMoveHistory(nextGame.history());
        } catch {
          const emptyGame = new Chess();
          setGame(emptyGame);
          setMoveHistory(emptyGame.history());
          setFeedback("Có bài tập chứa FEN lỗi, vui lòng liên hệ giáo viên/admin.");
        }
      } else {
        const emptyGame = new Chess();
        setGame(emptyGame);
        setMoveHistory(emptyGame.history());
      }
    } catch (error) {
      setItems([]);
      setFeedback(error?.response?.data?.message || "Không tải được bài tập hôm nay.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === "parent") {
      if (!selectedStudentId) return;
      loadAssignments(selectedStudentId);
      return;
    }
    loadAssignments("");
  }, [selectedStudentId, role]);

  const currentAssignment = items[activeAssignmentIndex] || null;

  const restartCurrentPuzzle = () => {
    if (!currentAssignment?.positionFen) return;
    try {
      const resetGame = new Chess();
      resetGame.load(String(currentAssignment.positionFen || "").trim());
      setGame(resetGame);
      setMoveHistory(resetGame.history());
    } catch {
      const emptyGame = new Chess();
      setGame(emptyGame);
      setMoveHistory(emptyGame.history());
      setFeedback("FEN của bài tập không hợp lệ.");
    }
  };

  useEffect(() => {
    restartCurrentPuzzle();
  }, [currentAssignment?._id]);

  const onDrop = ({ sourceSquare, targetSquare }) => {
    const copy = new Chess(game.fen());
    const moved = copy.move({ from: sourceSquare, to: targetSquare, promotion: "q" });
    if (!moved) return false;
    setGame(copy);
    setMoveHistory(copy.history());
    setFeedback("");
    return true;
  };

  const boardOptions = useMemo(
    () => ({
      id: "daily-exercise-board",
      position: game.fen(),
      onPieceDrop: onDrop,
      boardOrientation: "white",
      animationDurationInMs: 180,
      boardStyle: { width: "100%", maxWidth: "560px" },
    }),
    [game],
  );

  const handleSubmit = async () => {
    if (!currentAssignment?._id) return;
    try {
      setSubmitting(true);
      const now = Date.now();
      const deltaSec = lastSubmitAt ? Math.max(1, Math.round((now - lastSubmitAt) / 1000)) : 1;
      const payload = {
        fen: game.fen(),
        pgn: game.pgn(),
        moves: game.history(),
        studentId: selectedStudentId || undefined,
        timeSpentSec: deltaSec,
      };
      await exerciseAssignmentService.submitBoard(
        currentAssignment._id,
        payload,
      );
      setLastSubmitAt(now);
      setFeedback("Đã nộp FEN thành công cho giáo viên.");
    } catch (error) {
      setFeedback(error?.response?.data?.message || "Nộp đáp án thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="rounded-2xl border border-border bg-background p-5">
        <h2 className="text-2xl font-bold">Bài tập hôm nay</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Học viên di chuyển trực tiếp trên bàn cờ được giao và nộp FEN hiện tại.
        </p>
        {role === "parent" && children.length > 0 && (
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
        )}
      </div>

      {loading ? (
        <div className="rounded-xl border border-border bg-background p-6 text-sm text-muted-foreground">
          Đang tải bài tập...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-border bg-background p-6 text-sm text-muted-foreground">
          Hôm nay chưa có assignment nào.
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
          <div className="rounded-2xl border border-border bg-background p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <div className="font-semibold">{currentAssignment?.title}</div>
                <div className="text-xs text-muted-foreground">
                  Đã nộp {currentAssignment?.progress?.submittedCount || 0} lần
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={restartCurrentPuzzle}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted"
                >
                  Làm lại
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="rounded-lg bg-primary text-white px-3 py-1.5 text-sm disabled:opacity-60"
                >
                  {submitting ? "Đang nộp..." : "Nộp FEN"}
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-slate-900 p-3 flex justify-center">
              <div className="w-full max-w-[560px]">
                <Chessboard
                  options={boardOptions}
                />
              </div>
            </div>
            {feedback ? (
              <div className="mt-3 text-sm font-medium text-foreground">
                {feedback}
              </div>
            ) : null}
            {currentAssignment?.description ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {currentAssignment.description}
              </p>
            ) : null}
            <p className="mt-2 text-xs text-muted-foreground break-all">
              FEN hiện tại: {game.fen()}
            </p>
            <div className="mt-2 text-xs text-muted-foreground">
              Nước đi đã ghi: {moveHistory.length}
            </div>
            {moveHistory.length > 0 ? (
              <div className="mt-1 flex flex-wrap gap-1">
                {moveHistory.map((move, idx) => (
                  <span
                    key={`${move}-${idx}`}
                    className="rounded bg-muted px-2 py-0.5 text-xs text-foreground"
                  >
                    {idx + 1}. {move}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-border bg-background p-4">
            <div className="text-sm font-semibold mb-3">Danh sách assignment hôm nay</div>
            <div className="space-y-2">
              {items.map((assignment, idx) => (
                <button
                  key={assignment._id}
                  type="button"
                  onClick={() => {
                    setActiveAssignmentIndex(idx);
                    setFeedback("");
                  }}
                  className={`w-full text-left rounded-lg border px-3 py-2 ${
                    idx === activeAssignmentIndex
                      ? "border-blue-500 bg-blue-50"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <div className="text-sm font-semibold">{assignment.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Nộp {assignment.progress?.submittedCount || 0} lần •{" "}
                    {assignment.progress?.timeSpentSec || 0}s
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyExercisesPage;
