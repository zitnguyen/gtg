import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  ExternalLink,
  ArrowRight,
  Volume2,
  VolumeX,
  Home,
} from "lucide-react";
import { motion } from "framer-motion";
import { useLearningPageController } from "../hooks/useLearningPageController";
import {
  TrainingBoard,
  EvalBar,
  EngineStatusBadge,
} from "../../chess-ui";
import MoveCoach from "../components/MoveCoach";
import HintButton from "../components/HintButton";
import MoveFeedback from "../components/MoveFeedback";
import TrainingControls from "../components/TrainingControls";
import LessonSidebar from "../components/LessonSidebar";
import {
  isSoundMuted,
  setSoundMuted,
} from "../../../lib/chess/boardSounds";
import { ENGINE_STATUS } from "../../../lib/chess-engine";

const LearningPage = () => {
  const {
    activeReplayMoveIndex,
    activeReplayMoveNote,
    chessAllowDragging,
    chessFen,
    chessLastMove,
    chessLegalMoves,
    chessViewportRef,
    currentExercise,
    exerciseHint,
    exerciseIndex,
    exerciseMessage,
    handleHintExercise,
    handleReplayNext,
    handleReplayPrev,
    handleResetBoard,
    handleSaveChessProgress,
    handleSubmitExercise,
    invalidMoveMessage,
    isAllExercisesSolved,
    isChessLesson,
    isExerciseMode,
    isLichessLink,
    isReplayMode,
    lesson,
    lessonExercises,
    loading,
    loadingProgress,
    moveHistory,
    navigateToCourse,
    navigateToLesson,
    nextLesson,
    onDropPiece,
    onSquareClick,
    pageBackgroundStyle,
    prevLesson,
    replayMoves,
    replayStep,
    savingProgress,
    selectedSquare,
    submittingExercise,
    videoEmbedUrl,
  } = useLearningPageController();

  const [orientation, setOrientation] = useState("white");
  const [muted, setMuted] = useState(() => isSoundMuted());
  const [exerciseSolvedMap] = useState({});
  const desktopBoardRowRef = useRef(null);
  const mobileSquareRef = useRef(null);
  const [boardPixel, setBoardPixel] = useState(320);
  const [isLgLayout, setIsLgLayout] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(min-width: 1024px)").matches
      : false,
  );

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setIsLgLayout(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  /**
   * lg+: đo hàng EvalBar + bàn. <lg: đo ô aspect-square (cạnh = min(w,h)) — ổn định mobile.
   * Author: DucManh-BlueOC
   */
  useLayoutEffect(() => {
    const el = isLgLayout ? desktopBoardRowRef.current : mobileSquareRef.current;
    if (!el) return undefined;
    const measure = () => {
      const r = el.getBoundingClientRect();
      const w = Math.max(0, r.width);
      const h = Math.max(0, r.height);
      let side;
      if (isLgLayout) {
        const evalReserve = 14 + 12;
        const pad = 10;
        const usableW = Math.max(0, w - evalReserve - pad);
        const usableH = Math.max(0, h - pad);
        const cap = 680;
        side = Math.floor(
          Math.min(cap, usableW, usableH > 56 ? usableH : usableW),
        );
        if (side < 220) {
          side = Math.floor(Math.min(cap, Math.max(usableW, usableH)));
        }
        side = Math.min(cap, Math.max(200, side));
      } else {
        const cap = 580;
        side = Math.floor(Math.min(w, h > 8 ? h : w));
        side = Math.min(cap, Math.max(120, side));
      }
      setBoardPixel((prev) => (prev === side ? prev : side));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [isLgLayout]);

  const handleToggleSound = () => {
    const next = !muted;
    setMuted(next);
    setSoundMuted(next);
  };

  const handleFlip = () =>
    setOrientation((prev) => (prev === "white" ? "black" : "white"));

  const evalCpForWhite = useMemo(() => {
    // Engine integration is opt-in; we surface a neutral bar in the lesson by
    // default and let the analysis page drive real evaluation.
    return 0;
  }, []);

  const coachTitle = isExerciseMode
    ? `Bài tập ${exerciseIndex + 1}/${lessonExercises.length}`
    : isReplayMode
      ? "Tua nước đi"
      : "Học tự do";
  const coachGoal = isExerciseMode
    ? currentExercise?.explanation || "Tìm nước đi tốt nhất từ vị trí này."
    : isReplayMode
      ? activeReplayMoveIndex < 0
        ? "Bấm Tiến hoặc phím mũi tên phải để xem giải thích từng nước đi."
        : activeReplayMoveNote ||
          `Nước ${activeReplayMoveIndex + 1}: chưa có ghi chú.`
      : "Khám phá thế cờ và lưu lại nước đi của bạn.";

  if (loading)
    return (
      <div className="text-center py-20 text-foreground bg-background min-h-screen">
        Đang tải bài học...
      </div>
    );
  if (!lesson)
    return (
      <div className="text-center py-20 text-foreground bg-background min-h-screen">
        Không tìm thấy bài học.
      </div>
    );

  const renderChessSurface = () => {
    if (lesson.chessMode === "external" || isLichessLink(lesson.content)) {
      return lesson.content ? (
        <iframe
          src={lesson.content}
          className="w-full h-full bg-background"
          frameBorder="0"
          allowFullScreen
          title="External chess platform"
        />
      ) : (
        <div className="flex flex-col items-center justify-center w-full h-full text-muted-foreground gap-3">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-2xl">
            ♞
          </div>
          <p>Bài học bàn cờ ngoài chưa có liên kết.</p>
        </div>
      );
    }

    const trainingControlsProps = {
      showReplay: isReplayMode,
      showSave: !isReplayMode && !isExerciseMode,
      step: replayStep,
      total: replayMoves.length,
      onPrev: handleReplayPrev,
      onNext: handleReplayNext,
      onStart: () => {
        while (replayStep > 0) handleReplayPrev();
      },
      onEnd: () => {
        while (replayStep < replayMoves.length) handleReplayNext();
      },
      onReset: handleResetBoard,
      onFlip: handleFlip,
      onSave: handleSaveChessProgress,
      saving: savingProgress,
    };

    return (
      <div className="flex h-full min-h-0 w-full min-w-0 max-w-[100vw] flex-col gap-2 bg-slate-950/85 p-2 backdrop-blur-[1px] sm:gap-3 sm:p-3 md:p-5">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 gap-y-2 sm:gap-3">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <EngineStatusBadge status={ENGINE_STATUS.IDLE} />
            <button
              type="button"
              onClick={handleToggleSound}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-slate-700 bg-slate-800/70 text-slate-200 hover:bg-slate-700"
              title={muted ? "Bật âm thanh" : "Tắt âm thanh"}
            >
              {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              {muted ? "Tắt âm" : "Có âm"}
            </button>
            <span className="text-xs text-slate-400">
              {loadingProgress
                ? "Đang tải bàn cờ..."
                : `${moveHistory.length} nước đi`}
            </span>
          </div>
          <div className="hidden md:block shrink-0">
            <TrainingControls {...trainingControlsProps} />
          </div>
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 sm:gap-4 lg:grid lg:grid-rows-1 lg:grid-cols-[minmax(0,1fr)_minmax(17.5rem,22rem)] xl:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
          {!isLgLayout ? (
            <div className="flex w-full min-w-0 max-w-full shrink-0 flex-col items-center gap-2 sm:gap-3 lg:hidden">
              <div
                ref={mobileSquareRef}
                className="box-border aspect-square mx-auto w-full min-w-0 max-w-full shrink-0 [max-height:min(76dvh,calc(100svw-1rem))] [max-width:min(40rem,calc(100svw-1rem))]"
              >
                <TrainingBoard
                  id="lesson-board-mobile"
                  boardWidth={boardPixel}
                  fen={chessFen}
                  orientation={orientation}
                  onPieceDrop={onDropPiece}
                  onSquareClick={onSquareClick}
                  selectedSquare={selectedSquare}
                  legalMoves={chessLegalMoves}
                  lastMove={chessLastMove}
                  allowDragging={chessAllowDragging}
                />
              </div>
              {isExerciseMode ? (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <HintButton onHint={handleHintExercise} />
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={handleSubmitExercise}
                    disabled={submittingExercise}
                    className="inline-flex items-center gap-1 rounded-xl bg-sky-500 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-400 disabled:opacity-60"
                  >
                    {submittingExercise ? "Đang chấm..." : "Nộp đáp án"}
                  </motion.button>
                </div>
              ) : null}
            </div>
          ) : (
            <div
              ref={desktopBoardRowRef}
              className="hidden min-h-0 h-full min-w-0 w-full max-w-full flex-1 items-center justify-center gap-3 overflow-x-hidden overflow-y-hidden lg:flex xl:gap-4"
            >
              <div className="hidden shrink-0 self-center lg:block">
                <EvalBar
                  cpForWhite={evalCpForWhite}
                  orientation={orientation}
                  height={boardPixel}
                  label="0.00"
                />
              </div>
              <div className="flex shrink-0 flex-col items-center justify-center gap-3">
                <TrainingBoard
                  id="lesson-board"
                  boardWidth={boardPixel}
                  fen={chessFen}
                  orientation={orientation}
                  onPieceDrop={onDropPiece}
                  onSquareClick={onSquareClick}
                  selectedSquare={selectedSquare}
                  legalMoves={chessLegalMoves}
                  lastMove={chessLastMove}
                  allowDragging={chessAllowDragging}
                />
                {isExerciseMode ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <HintButton onHint={handleHintExercise} />
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      type="button"
                      onClick={handleSubmitExercise}
                      disabled={submittingExercise}
                      className="inline-flex items-center gap-1 rounded-xl bg-sky-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-sky-400 disabled:opacity-60"
                    >
                      {submittingExercise ? "Đang chấm..." : "Nộp đáp án"}
                    </motion.button>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          <div className="flex min-h-0 min-w-0 max-w-full flex-1 flex-col overflow-y-auto overflow-x-hidden lg:h-full">
            <LessonSidebar
            subtitle={lesson.type === "chess" ? "Bài học cờ vua" : null}
            title={lesson.title}
            exercises={isExerciseMode ? lessonExercises : []}
            exerciseIndex={exerciseIndex}
            exerciseSolvedMap={exerciseSolvedMap}
            moves={moveHistory}
            cursor={isReplayMode ? replayStep : moveHistory.length}
            coachSlot={
              <MoveCoach
                title={coachTitle}
                goal={coachGoal}
                hint={isExerciseMode ? exerciseHint : null}
                praise={
                  isExerciseMode &&
                  exerciseMessage?.toLowerCase()?.includes("chính xác")
                    ? exerciseMessage
                    : null
                }
                variant={
                  exerciseMessage?.toLowerCase()?.includes("chính xác")
                    ? "praise"
                    : "goal"
                }
              />
            }
            feedbackSlot={
              <div className="space-y-2">
                <MoveFeedback message={invalidMoveMessage} variant="warning" />
                {isExerciseMode &&
                exerciseMessage &&
                !exerciseMessage.toLowerCase().includes("chính xác") ? (
                  <MoveFeedback message={exerciseMessage} variant="danger" />
                ) : null}
              </div>
            }
            />
          </div>
        </div>

        {/* Mobile: thanh tua/lưu ở đáy vùng bài học — dễ bấm ngón tay cái. Author: DucManh-BlueOC */}
        <div
          className="md:hidden mt-auto w-full min-w-0 max-w-full shrink-0 rounded-b-2xl border-t border-slate-800/90 bg-slate-950/95 px-1 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] backdrop-blur-md sm:px-2"
          role="toolbar"
          aria-label="Điều khiển bàn cờ"
        >
          <TrainingControls {...trainingControlsProps} variant="dock" />
        </div>
      </div>
    );
  };

  return (
    <div
      className="flex flex-col h-[100dvh] min-h-0 overflow-hidden bg-background text-foreground"
      style={pageBackgroundStyle}
    >
      {/* Learning route không dùng Public Header — cần nút Trang chủ (nhất là mobile). Author: DucManh-BlueOC */}
      <header className="shrink-0 h-14 md:h-16 flex items-center gap-2 px-3 sm:px-6 border-b border-border bg-background min-w-0">
        <button
          type="button"
          onClick={navigateToCourse}
          className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors sm:mr-2"
          aria-label="Quay lại khóa học"
        >
          <ArrowLeft size={20} className="shrink-0" />
          <span className="hidden sm:inline text-sm font-medium">
            Quay lại khóa học
          </span>
          <span className="sm:hidden text-xs font-medium max-w-[5.5rem] truncate">
            Khóa học
          </span>
        </button>
        <div className="flex-1 min-w-0 text-center sm:text-left min-h-0 flex items-center">
          <h1 className="text-sm sm:text-base md:text-lg font-bold truncate leading-tight">
            {lesson.title}
          </h1>
        </div>
        <Link
          to="/"
          title="Về trang chủ Z CHESS"
          aria-label="Trang chủ"
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-2.5 py-2 text-sm font-semibold text-foreground shadow-sm hover:bg-muted/80 active:bg-muted transition-colors sm:px-3"
        >
          <Home size={20} className="shrink-0" aria-hidden />
          <span className="hidden sm:inline">Trang chủ</span>
        </Link>
      </header>

      <div
        className={`flex min-h-0 flex-1 justify-center overflow-x-hidden ${
          isChessLesson
            ? "overflow-y-auto p-2 sm:p-4 md:p-5"
            : "overflow-y-auto p-8"
        }`}
      >
        <div
          className={`w-full min-w-0 max-w-[min(100%,80rem)] ${
            isChessLesson ? "flex h-full min-h-0 flex-col" : "max-w-4xl"
          }`}
        >
          <div
            ref={isChessLesson ? chessViewportRef : null}
            className={`bg-black rounded-2xl shadow-2xl relative ${
              lesson.type === "chess"
                ? "flex-1 min-h-0 mb-3 sm:mb-4 flex flex-col overflow-x-hidden overflow-y-auto"
                : "aspect-video mb-8 overflow-hidden"
            }`}
          >
            {lesson.type === "video" && lesson.content ? (
              lesson.content.includes("youtube") ||
              lesson.content.includes("youtu.be") ? (
                <iframe
                  src={videoEmbedUrl}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <video controls className="w-full h-full">
                  <source src={lesson.content} type="video/mp4" />
                  Trình duyệt của bạn không hỗ trợ video tag.
                </video>
              )
            ) : lesson.type === "chess" ? (
              renderChessSurface()
            ) : (
              <div className="flex flex-col items-center justify-center w-full h-full text-muted-foreground">
                <FileText size={64} className="mb-4 opacity-50" />
                <p>Bài học này là dạng văn bản hoặc không có video.</p>
              </div>
            )}
          </div>

          {(!isChessLesson ||
            lesson.description ||
            lesson.chessMode === "external" ||
            isLichessLink(lesson.content)) && (
            <div className="prose prose-invert max-w-none">
              <h2 className="text-2xl font-bold mb-4">Nội dung bài học</h2>
              {lesson.type !== "video" && lesson.type !== "chess" && (
                <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
              )}
              {lesson.type === "chess" &&
                (lesson.chessMode === "external" ||
                  isLichessLink(lesson.content)) &&
                lesson.content && (
                  <a
                    href={lesson.content}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-foreground hover:opacity-80"
                  >
                    <ExternalLink size={16} />
                    Mở trực tiếp nền tảng chess
                  </a>
                )}
              {lesson.description && <p>{lesson.description}</p>}
            </div>
          )}

          <div
            className={`${
              isChessLesson ? "mt-3" : "mt-8"
            } flex flex-col gap-2 sm:flex-row sm:justify-between sm:gap-3`}
          >
            {prevLesson ? (
              <button
                type="button"
                onClick={() => navigateToLesson(prevLesson._id)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 sm:w-auto"
                title={`Về ${prevLesson.title}`}
              >
                <ArrowLeft size={16} />
                Bài học trước
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-muted px-4 py-2.5 text-sm font-semibold text-muted-foreground sm:w-auto"
              >
                Đã là bài đầu
              </button>
            )}

            {nextLesson ? (
              <button
                type="button"
                onClick={() => navigateToLesson(nextLesson._id)}
                disabled={!isAllExercisesSolved}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                title={
                  isAllExercisesSolved
                    ? `Sang ${nextLesson.title}`
                    : "Bạn cần giải đúng toàn bộ bài tập trước khi qua bài tiếp theo"
                }
              >
                Bài học tiếp theo
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-muted px-4 py-2.5 text-sm font-semibold text-muted-foreground sm:w-auto"
              >
                Đã là bài cuối
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningPage;
