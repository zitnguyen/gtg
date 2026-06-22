import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  RotateCcw,
  FlipVertical2,
  Home,
  Lightbulb,
  BookOpen,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  List,
  PanelLeft,
  X,
} from "lucide-react";
import { useLearningPageController } from "../hooks/useLearningPageController";
import { TrainingBoard, MoveList } from "../../chess-ui";
import MoveFeedback from "../components/MoveFeedback";
import TrainingControls from "../components/TrainingControls";
import { BOARD_THEMES } from "../../../lib/chess/boardTheme";
import courseService from "../../../services/courseService";

/* ─── Board theme ─────────────────────────────────────── */
const THEME_META = [
  { key: "midnight", label: "Đêm", dark: "#3a4661", light: "#e8edf6" },
  { key: "emerald", label: "Xanh", dark: "#5d8350", light: "#eef2e6" },
  { key: "classic", label: "Cổ điển", dark: "#b58863", light: "#f0d9b5" },
];
const BOARD_THEME_KEY = "zchess_board_theme";

/* ─── Helpers ─────────────────────────────────────────── */
function flattenCurriculum(curriculum = []) {
  const result = [];
  curriculum.forEach((ch) => {
    (ch.lessons || []).forEach((l) => result.push({ ...l, chapterTitle: ch.title }));
  });
  return result;
}

/* ─── Sub-components ──────────────────────────────────── */
function BoardThemePicker({ current, onChange }) {
  return (
    <div className="flex items-center gap-1.5">
      {THEME_META.map(({ key, label, dark, light }) => (
        <button
          key={key}
          type="button"
          title={label}
          onClick={() => onChange(key)}
          className={`w-7 h-7 rounded overflow-hidden border-2 transition-all ${
            current === key
              ? "border-white scale-110 shadow"
              : "border-transparent opacity-60 hover:opacity-100"
          }`}
          style={{ background: `linear-gradient(135deg, ${dark} 50%, ${light} 50%)` }}
        />
      ))}
    </div>
  );
}

function ProgressCircle({ done }) {
  return done ? (
    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-red-400" />
  ) : (
    <Circle className="h-3.5 w-3.5 shrink-0 text-slate-600" />
  );
}

/* ═══════════════════════════════════════════════════════ */
const LearningPage = () => {
  const { courseSlug, lessonId } = useParams();

  const {
    activeReplayMoveIndex,
    activeReplayMoveArrows,
    activeReplayMoveNote,
    canExercise,
    exerciseActive,
    exercisePlayerColor,
    exerciseResult,
    exitExercise,
    handleExerciseReset,
    isExerciseMode,
    startExercise,
    chessAllowDragging,
    chessFen,
    chessLastMove,
    chessLegalMoves,
    chessViewportRef,
    handleJumpToMove,
    handleReplayNext,
    handleReplayPrev,
    handleResetBoard,
    handleSaveChessProgress,
    invalidMoveMessage,
    isChessLesson,
    isReplayMode,
    lesson,
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
    videoEmbedUrl,
    isCloudinaryVideoLesson,
    isExerciseForcedByLesson,
    isLichessLink,
    handleHint,
    hintSquare,
    hintArrow,
    hintsUsed,
    maxHints,
  } = useLearningPageController();

  /* ── UI state ── */
  const [orientation, setOrientation] = useState("white");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [boardTheme, setBoardTheme] = useState(
    () => localStorage.getItem(BOARD_THEME_KEY) || "midnight",
  );
  const [collapsedChapters, setCollapsedChapters] = useState({});
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

  /* ── Curriculum ── */
  const [curriculum, setCurriculum] = useState([]);
  const [courseTitle, setCourseTitle] = useState("");
  useEffect(() => {
    if (!courseSlug) return;
    courseService.getCourseBySlug(courseSlug).then((res) => {
      setCurriculum(res?.curriculum || []);
      setCourseTitle(res?.course?.title || "");
    }).catch(() => {});
  }, [courseSlug]);

  const flatLessons = useMemo(() => flattenCurriculum(curriculum), [curriculum]);
  const currentIndex = useMemo(
    () => flatLessons.findIndex((l) => String(l._id) === String(lessonId)),
    [flatLessons, lessonId],
  );
  const lessonIndexMap = useMemo(() => {
    const map = {};
    let i = 0;
    curriculum.forEach((ch) =>
      (ch.lessons || []).forEach((l) => { map[String(l._id)] = i++; }),
    );
    return map;
  }, [curriculum]);

  /* ── Board sizing ── */
  const boardAreaRef = useRef(null);
  const [boardPixel, setBoardPixel] = useState(480);

  const measureBoard = useCallback(() => {
    const el = boardAreaRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const availW = width - 16;
    const availH = height - 16;
    setBoardPixel(Math.max(200, Math.min(700, Math.floor(Math.min(availW, availH)))));
  }, []);

  useLayoutEffect(() => {
    if (!boardAreaRef.current) return;
    measureBoard();
    const ro = new ResizeObserver(measureBoard);
    ro.observe(boardAreaRef.current);
    window.addEventListener("resize", measureBoard);
    return () => { ro.disconnect(); window.removeEventListener("resize", measureBoard); };
  }, [loading, measureBoard]);

  /* ── Mobile touch navigation (replay mode only) ── */
  const swipeRef = useRef(null);

  const handleBoardTouchStart = useCallback((e) => {
    if (!isReplayMode) return;
    const t = e.touches[0];
    swipeRef.current = { x: t.clientX, y: t.clientY, ts: Date.now() };
  }, [isReplayMode]);

  const handleBoardTouchEnd = useCallback((e) => {
    if (!isReplayMode || !swipeRef.current) return;
    const t = e.changedTouches[0];
    const { x: sx, y: sy, ts } = swipeRef.current;
    swipeRef.current = null;

    const dx = t.clientX - sx;
    const dy = t.clientY - sy;
    const dt = Date.now() - ts;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);

    // Horizontal swipe: > 50 px, more horizontal than vertical, under 500 ms
    if (adx > 50 && adx > ady && dt < 500) {
      if (dx < 0) handleReplayNext();
      else handleReplayPrev();
      return;
    }

    // Tap: < 15 px movement, under 300 ms → left half = prev, right half = next
    if (adx < 15 && ady < 15 && dt < 300) {
      const el = boardAreaRef.current;
      if (!el) return;
      const { left, width } = el.getBoundingClientRect();
      if (t.clientX >= left + width / 2) handleReplayNext();
      else handleReplayPrev();
    }
  }, [isReplayMode, handleReplayNext, handleReplayPrev]);

  /* ── Handlers ── */
  const handleThemeChange = (key) => {
    if (!BOARD_THEMES[key]) return;
    setBoardTheme(key);
    localStorage.setItem(BOARD_THEME_KEY, key);
  };
  const handleFlip = () => setOrientation((p) => (p === "white" ? "black" : "white"));
  const handleStartExercise = (color) => {
    startExercise(color);
    setOrientation(color === "b" ? "black" : "white");
    setShowColorPicker(false);
  };
  const toggleChapter = (idx) =>
    setCollapsedChapters((p) => ({ ...p, [idx]: !p[idx] }));

  useEffect(() => {
    if (!showColorPicker) return;
    const close = (e) => {
      if (!e.target.closest("[data-exercise-picker]")) setShowColorPicker(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [showColorPicker]);

  /* close mobile drawers when lesson changes */
  useEffect(() => {
    setMobileSidebarOpen(false);
    setMobilePanelOpen(false);
  }, [lessonId]);

  /* Auto-set board orientation when exercise lesson loads */
  useEffect(() => {
    if (!lesson) return;
    if (lesson.exerciseMode && lesson.exercisePlayerColor) {
      setOrientation(lesson.exercisePlayerColor === "b" ? "black" : "white");
    }
  }, [lesson?._id, lesson?.exerciseMode, lesson?.exercisePlayerColor]);

  /* ── Derived labels ── */
  const colorLabel = exercisePlayerColor === "b" ? "Đen" : "Trắng";
  const coachGoal = isExerciseMode
    ? exerciseResult === "completed"
      ? "Xuất sắc! Bạn đã hoàn thành tất cả nước đi đúng."
      : exerciseResult === "wrong"
        ? "Sai rồi! Đang đặt lại bàn cờ..."
        : activeReplayMoveIndex >= 0
          ? `Tiếp tục! Đã đúng ${activeReplayMoveIndex + 1}/${replayMoves.length} nước.`
          : "Di chuyển quân đúng vị trí. Sai sẽ làm lại từ đầu."
    : isReplayMode
      ? activeReplayMoveIndex < 0
        ? "Bấm Tiến hoặc phím → để xem giải thích từng nước."
        : activeReplayMoveNote || `Nước ${activeReplayMoveIndex + 1}: chưa có ghi chú.`
      : "Khám phá thế cờ và lưu lại nước đi của bạn.";

  const trainingControlsProps = {
    // When lesson forces exercise mode, hide replay nav completely
    showReplay: isReplayMode && !isExerciseForcedByLesson,
    showSave: !isReplayMode && !isExerciseMode && !isExerciseForcedByLesson,
    step: replayStep,
    total: replayMoves.length,
    onPrev: handleReplayPrev,
    onNext: handleReplayNext,
    onStart: () => { let s = replayStep; while (s-- > 0) handleReplayPrev(); },
    onEnd: () => { let s = replayStep; while (s++ < replayMoves.length) handleReplayNext(); },
    onReset: isExerciseMode ? handleExerciseReset : handleResetBoard,
    onFlip: handleFlip,
    onSave: handleSaveChessProgress,
    saving: savingProgress,
  };

  /* ─── Loading ─────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0d1117] text-slate-400 text-sm gap-2">
        <span className="text-2xl animate-pulse">♞</span> Đang tải bài học...
      </div>
    );
  }
  if (!lesson) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0d1117] text-slate-400 text-sm">
        Không tìm thấy bài học.
      </div>
    );
  }

  /* ─── Derived ─────────────────────────────────────────── */
  const currentMoveSan = replayMoves[activeReplayMoveIndex] || null;
  const hasNote = Boolean(activeReplayMoveNote);
  const progressPct = flatLessons.length > 0 ? Math.round(((currentIndex + 1) / flatLessons.length) * 100) : 0;

  /* ─── Non-chess content (same 3-col shell as chess) ─────── */
  if (!isChessLesson) {
    return (
      <div className="flex flex-col h-[100dvh] overflow-hidden text-white" style={{background:"#0d1117"}}>
        {/* TOP HEADER */}
        <header className="shrink-0 flex items-center gap-0 border-b border-white/8 z-30" style={{background:"#161b27", height:"52px"}}>
          <div className="flex items-center gap-3 px-4 h-full border-r border-white/8 shrink-0" style={{minWidth:"220px"}}>
            <button type="button" onClick={navigateToCourse}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <p className="text-[11px] text-slate-500 truncate leading-none mb-0.5">Khóa học</p>
              <p className="text-[13px] font-semibold text-slate-200 truncate leading-none">{courseTitle || courseSlug}</p>
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center px-4 min-w-0">
            <p className="text-sm font-bold text-white truncate max-w-md">{lesson.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-32 h-1.5 rounded-full overflow-hidden" style={{background:"rgba(255,255,255,0.1)"}}>
                <div className="h-full rounded-full transition-all duration-500" style={{width:`${progressPct}%`, background:"linear-gradient(90deg,#dc2626,#f97316)"}} />
              </div>
              <span className="text-[11px] text-slate-500">{currentIndex + 1}/{flatLessons.length}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 h-full border-l border-white/8 shrink-0">
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide" style={{background:"rgba(100,116,139,0.2)",color:"#94a3b8",border:"1px solid rgba(100,116,139,0.25)"}}>
              {lesson.type === "video" ? "▶ Video" : lesson.type === "text" ? "📄 Bài đọc" : "📝 Quiz"}
            </span>
            <button type="button" onClick={() => { setMobileSidebarOpen(true); setMobilePanelOpen(false); }}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
              <PanelLeft className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* BODY */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {(mobileSidebarOpen || mobilePanelOpen) && (
            <div className="fixed inset-0 z-40 bg-black/70 md:hidden"
              onClick={() => { setMobileSidebarOpen(false); setMobilePanelOpen(false); }} />
          )}

          {/* LEFT SIDEBAR */}
          <aside
            className={`flex flex-col overflow-hidden shrink-0 border-r border-white/8
              w-[240px]
              fixed md:relative inset-y-0 left-0 z-50 top-0 md:top-auto
              transition-transform duration-300
              ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
            style={{background:"#161b27"}}
          >
            <button type="button" onClick={() => setMobileSidebarOpen(false)}
              className="md:hidden absolute top-3 right-3 z-10 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
            <div className="shrink-0 px-4 py-3.5 border-b border-white/8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-sm" style={{background:"rgba(220,38,38,0.18)",border:"1px solid rgba(220,38,38,0.28)"}}>📚</div>
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-white truncate">{courseTitle || courseSlug}</p>
                  <p className="text-[10px] text-slate-500">{flatLessons.length} bài học</p>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 py-1">
              {curriculum.map((chapter, chIdx) => {
                const isCollapsed = collapsedChapters[chIdx];
                return (
                  <div key={chIdx}>
                    <button type="button" onClick={() => toggleChapter(chIdx)}
                      className="w-full flex items-center gap-2 px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:bg-white/5 hover:text-slate-300 transition-colors">
                      {isCollapsed ? <ChevronRightIcon className="h-3 w-3 shrink-0" /> : <ChevronDown className="h-3 w-3 shrink-0" />}
                      <span className="truncate">{chapter.title}</span>
                    </button>
                    {!isCollapsed && (chapter.lessons || []).map((l) => {
                      const idx = lessonIndexMap[String(l._id)] ?? 0;
                      const isActive = String(l._id) === String(lessonId);
                      return (
                        <button key={l._id} type="button" onClick={() => navigateToLesson(l._id)}
                          className={`w-full flex items-center gap-2.5 pl-4 pr-3 py-2.5 text-left transition-all ${
                            isActive ? "text-white" : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
                          }`}
                          style={isActive ? {background:"linear-gradient(90deg,rgba(220,38,38,0.22),transparent)",borderLeft:"2px solid #ef4444"} : {borderLeft:"2px solid transparent"}}
                        >
                          <span className={`text-[10px] font-mono w-5 text-right shrink-0 ${isActive ? "text-red-400" : "text-slate-600"}`}>{idx + 1}.</span>
                          <span className="flex-1 text-[12px] leading-snug truncate">{l.title}</span>
                          <ProgressCircle done={false} />
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </aside>

          {/* CENTER: video / text content */}
          <main className="flex-1 min-w-0 flex flex-col overflow-hidden" style={{background:"#0d1117"}}>
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-start p-4 md:p-8"
              style={{background:"radial-gradient(ellipse 80% 70% at 50% 30%, rgba(20,30,60,0.7) 0%, #0d1117 100%)"}}>
              {lesson.type === "video" && lesson.content ? (
                <div className="w-full max-w-4xl rounded-2xl overflow-hidden bg-black shadow-2xl" style={{aspectRatio:"16/9"}}>
                  {isCloudinaryVideoLesson ? (
                    <video src={videoEmbedUrl} controls controlsList="nodownload"
                      className="w-full h-full" preload="metadata" playsInline>
                      Trình duyệt không hỗ trợ video.
                    </video>
                  ) : (
                    <iframe src={videoEmbedUrl} className="w-full h-full" frameBorder="0" allowFullScreen />
                  )}
                </div>
              ) : (
                <div className="w-full max-w-3xl rounded-2xl p-6 text-slate-300 leading-relaxed"
                  style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)"}}>
                  {lesson.content || <span className="text-slate-600 italic">Không có nội dung.</span>}
                </div>
              )}
              {lesson.description && (
                <p className="mt-5 text-sm text-slate-400 max-w-4xl leading-relaxed">{lesson.description}</p>
              )}
            </div>
          </main>

          {/* RIGHT PANEL */}
          <aside className="hidden md:flex flex-col overflow-hidden shrink-0 border-l border-white/8 w-[260px]"
            style={{background:"#161b27"}}>
            {/* Info box */}
            <div className="shrink-0 p-4 border-b border-white/8">
              <div className="rounded-xl px-4 py-3 text-center" style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)"}}>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {lesson.type === "video" ? "Xem video bài giảng và chuyển sang bài tiếp theo." : "Đọc nội dung và chuyển sang bài tiếp theo."}
                </p>
              </div>
            </div>
            {/* Spacer */}
            <div className="flex-1" />
            {/* Nav */}
            <div className="shrink-0 p-3 border-t border-white/8 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => prevLesson && navigateToLesson(prevLesson._id)}
                  disabled={!prevLesson}
                  className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed"
                  style={{border:"1px solid rgba(255,255,255,0.12)",background:"rgba(255,255,255,0.04)"}}>
                  <ArrowLeft className="h-4 w-4 shrink-0" /> Trước
                </button>
                <button type="button" onClick={() => nextLesson && navigateToLesson(nextLesson._id)}
                  disabled={!nextLesson}
                  className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-25 disabled:cursor-not-allowed transition-opacity hover:opacity-90"
                  style={{background:"linear-gradient(135deg,#dc2626,#b91c1c)"}}>
                  Tiếp theo <ArrowRight className="h-4 w-4 shrink-0" />
                </button>
              </div>
              <button type="button" onClick={navigateToCourse}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors rounded-lg hover:bg-white/5">
                <Home className="h-3.5 w-3.5" /> Về trang khóa học
              </button>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  /* ─── Chess layout ────────────────────────────────────── */
  const panelBg   = "#0f1322";
  const headerBg  = "#0c1020";
  const borderClr = "rgba(255,255,255,0.06)";

  return (
    <div
      className="flex flex-col h-[100dvh] overflow-hidden text-white"
      style={{background:"#0d0f1a"}}
      ref={chessViewportRef}
    >
      {/* ══ TOP HEADER ══════════════════════════════════════ */}
      <header className="shrink-0 flex items-center z-30" style={{background:headerBg, height:"52px", borderBottom:`1px solid ${borderClr}`, backdropFilter:"blur(12px)"}}>
        {/* Back */}
        <div className="flex items-center gap-3 px-4 h-full shrink-0" style={{minWidth:"220px", borderRight:`1px solid ${borderClr}`}}>
          <button type="button" onClick={navigateToCourse}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition-all shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-600 truncate leading-none mb-0.5 uppercase tracking-wider">Khóa học</p>
            <p className="text-[13px] font-semibold text-slate-200 truncate leading-none">{courseTitle || courseSlug}</p>
          </div>
        </div>

        {/* Title + progress */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 min-w-0">
          <p className="text-[13px] font-bold text-white truncate max-w-md">{lesson.title}</p>
          <div className="flex items-center gap-2.5 mt-1">
            <div className="w-28 h-1 rounded-full overflow-hidden" style={{background:"rgba(255,255,255,0.08)"}}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{width:`${progressPct}%`, background:"linear-gradient(90deg,#ef4444,#f97316)"}} />
            </div>
            <span className="text-[10px] text-slate-600 tabular-nums">{currentIndex + 1}/{flatLessons.length}</span>
          </div>
        </div>

        {/* Badge + mobile toggles */}
        <div className="flex items-center gap-2 px-4 h-full shrink-0" style={{borderLeft:`1px solid ${borderClr}`}}>
          {(isExerciseMode || isExerciseForcedByLesson) ? (
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide"
              style={{background:"rgba(245,158,11,0.15)",color:"#fbbf24",border:"1px solid rgba(245,158,11,0.3)"}}>
              ⚔ {exercisePlayerColor === "b" ? "♚ Đen" : "♔ Trắng"}
            </span>
          ) : isReplayMode ? (
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide"
              style={{background:"rgba(239,68,68,0.15)",color:"#f87171",border:"1px solid rgba(239,68,68,0.3)"}}>
              ▶ Xem lại
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide"
              style={{background:"rgba(100,116,139,0.12)",color:"#64748b",border:"1px solid rgba(100,116,139,0.2)"}}>
              Tự do
            </span>
          )}
          <button type="button" onClick={() => { setMobileSidebarOpen(true); setMobilePanelOpen(false); }}
            className="md:hidden p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/8 transition-all">
            <PanelLeft className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => { setMobilePanelOpen(true); setMobileSidebarOpen(false); }}
            className="md:hidden p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/8 transition-all">
            <List className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* ══ BODY ════════════════════════════════════════════ */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {(mobileSidebarOpen || mobilePanelOpen) && (
          <div className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm md:hidden"
            onClick={() => { setMobileSidebarOpen(false); setMobilePanelOpen(false); }} />
        )}

        {/* ── LEFT SIDEBAR ──────────────────────────────── */}
        <aside
          className={`flex flex-col overflow-hidden shrink-0 w-[240px]
            fixed md:relative inset-y-0 left-0 z-50 top-0 md:top-auto transition-transform duration-300
            ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
          style={{background:panelBg, borderRight:`1px solid ${borderClr}`}}
        >
          <button type="button" onClick={() => setMobileSidebarOpen(false)}
            className="md:hidden absolute top-3 right-3 z-10 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>

          <div className="shrink-0 px-4 py-3 border-b" style={{borderColor:borderClr}}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-sm"
                style={{background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.25)"}}>
                <BookOpen className="h-4 w-4 text-red-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{courseTitle || courseSlug}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wide">{flatLessons.length} bài học</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 py-1">
            {curriculum.map((chapter, chIdx) => {
              const isCollapsed = collapsedChapters[chIdx];
              return (
                <div key={chIdx}>
                  <button type="button" onClick={() => toggleChapter(chIdx)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-slate-300 transition-colors">
                    {isCollapsed ? <ChevronRightIcon className="h-3 w-3 shrink-0" /> : <ChevronDown className="h-3 w-3 shrink-0" />}
                    <span className="truncate">{chapter.title}</span>
                  </button>
                  {!isCollapsed && (chapter.lessons || []).map((l) => {
                    const idx = lessonIndexMap[String(l._id)] ?? 0;
                    const isActive = String(l._id) === String(lessonId);
                    return (
                      <button key={l._id} type="button" onClick={() => navigateToLesson(l._id)}
                        className={`w-full flex items-center gap-2.5 pl-6 pr-3 py-2.5 text-left transition-all relative ${
                          isActive ? "text-white" : "text-slate-500 hover:text-slate-300"
                        }`}
                        style={isActive ? {background:"linear-gradient(90deg,rgba(239,68,68,0.18),rgba(239,68,68,0.04),transparent)"} : {}}
                      >
                        {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-red-500" />}
                        <span className={`text-xs font-mono w-4 text-right shrink-0 ${isActive ? "text-red-400" : "text-slate-600"}`}>{idx + 1}.</span>
                        <span className="flex-1 text-sm leading-snug truncate">{l.title}</span>
                        <ProgressCircle done={false} />
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </aside>

        {/* ── CENTER: board ─────────────────────────────── */}
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden" style={{background:"#0d0f1a"}}>
          <div
            ref={boardAreaRef}
            className="flex-1 min-h-0 flex items-center justify-center p-3 md:p-6 relative"
            style={{touchAction:"none"}}
            onTouchStart={handleBoardTouchStart}
            onTouchEnd={handleBoardTouchEnd}
          >
            {/* Ambient glow */}
            <div className="absolute inset-0 pointer-events-none"
              style={{background:"radial-gradient(ellipse 55% 55% at 50% 50%, rgba(79,126,255,0.06) 0%, transparent 70%)"}} />

            <div className={`relative shrink-0 ${
              exerciseResult === "wrong"
                ? "ring-2 ring-red-500/60 ring-offset-4 ring-offset-[#060d1a] rounded-sm"
                : exerciseResult === "completed"
                  ? "ring-2 ring-emerald-400/60 ring-offset-4 ring-offset-[#060d1a] rounded-sm"
                  : ""
            }`}
              style={{
                filter: exerciseResult === "wrong" ? "drop-shadow(0 0 24px rgba(239,68,68,0.3))"
                  : exerciseResult === "completed" ? "drop-shadow(0 0 24px rgba(52,211,153,0.3))"
                  : "drop-shadow(0 8px 32px rgba(0,0,0,0.6))",
              }}
            >
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
                arrows={hintArrow || activeReplayMoveArrows}
                hintSquare={hintSquare}
                themeKey={boardTheme}
              />
              {exerciseResult === "completed" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-sm px-6"
                  style={{background:"rgba(6,13,26,0.88)",backdropFilter:"blur(8px)"}}>
                  <span className="text-5xl animate-bounce">🎉</span>
                  <span className="text-2xl font-black text-emerald-400">Hoàn thành!</span>
                  <p className="text-sm text-slate-400 text-center">Bạn đã hoàn thành tất cả nước đi đúng.</p>
                  <div className="flex gap-3 mt-1">
                    <button type="button" onClick={handleExerciseReset}
                      className="flex items-center gap-2 px-5 py-2.5 text-sm rounded-xl font-semibold transition-all hover:bg-white/10"
                      style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)"}}>
                      <RotateCcw className="h-4 w-4" /> Làm lại
                    </button>
                    {nextLesson && (
                      <button type="button" onClick={() => navigateToLesson(nextLesson._id)}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm rounded-xl font-semibold text-white transition-all hover:opacity-90"
                        style={{background:"linear-gradient(135deg,#10b981,#059669)"}}>
                        Bài tiếp theo <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Bottom toolbar ── */}
          <div className="shrink-0 flex items-center gap-2 px-4 h-14"
            style={{background:headerBg, borderTop:`1px solid ${borderClr}`}}>

            {/* Left: hint + exercise */}
            <div className="flex items-center gap-1.5 shrink-0">
              {isExerciseMode && exerciseResult === "idle" && (
                <button type="button" onClick={handleHint} disabled={hintsUsed >= maxHints}
                  title={`Gợi ý (${maxHints - hintsUsed} còn)`}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold transition-all
                    disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 active:scale-95"
                  style={{background:"rgba(251,191,36,0.12)",border:"1px solid rgba(251,191,36,0.22)",color:"#fbbf24"}}>
                  <Lightbulb className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{maxHints - hintsUsed > 0 ? maxHints - hintsUsed : "–"}</span>
                </button>
              )}

              {canExercise && (!isExerciseForcedByLesson || lesson?.exercisePlayerColor === "both") && (
                <div className="relative" data-exercise-picker>
                  <button type="button"
                    onClick={() => exerciseActive ? (exitExercise(), setShowColorPicker(false)) : setShowColorPicker(v => !v)}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold transition-all hover:opacity-90"
                    style={exerciseActive
                      ? {background:"rgba(245,158,11,0.15)",border:"1px solid rgba(245,158,11,0.28)",color:"#fbbf24"}
                      : lesson?.exercisePlayerColor === "both"
                        ? {background:"rgba(99,102,241,0.15)",border:"1px solid rgba(99,102,241,0.35)",color:"#a5b4fc"}
                        : {background:"rgba(255,255,255,0.05)",border:`1px solid ${borderClr}`,color:"#64748b"}}>
                    {lesson?.exercisePlayerColor === "both" && !exerciseActive ? "🎯" : "⚔"}
                    {" "}<span className="hidden sm:inline">
                      {exerciseActive ? colorLabel : lesson?.exercisePlayerColor === "both" ? "Chọn màu & Kiểm tra" : "Bài tập"}
                    </span>
                  </button>
                  {showColorPicker && !exerciseActive && (
                    <div className="absolute bottom-full left-0 mb-2 z-50 flex flex-col gap-1.5 rounded-2xl p-3 shadow-2xl min-w-[180px]"
                      style={{background:"#0f1829",border:`1px solid ${borderClr}`}}>
                      <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Bạn muốn đi quân nào?</p>
                      <button type="button" onClick={() => handleStartExercise("w")}
                        className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-900 hover:opacity-90 transition-opacity"
                        style={{background:"#f1f5f9"}}>
                        ♔ Quân Trắng
                      </button>
                      <button type="button" onClick={() => handleStartExercise("b")}
                        className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity"
                        style={{background:"#1e293b",border:`1px solid ${borderClr}`}}>
                        ♚ Quân Đen
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Center: controls */}
            <div className="flex-1 flex justify-center">
              <TrainingControls {...trainingControlsProps} />
            </div>

            {/* Right: theme + flip */}
            <div className="flex items-center gap-0.5 shrink-0">
              <BoardThemePicker current={boardTheme} onChange={handleThemeChange} />
              <div className="w-px h-4 mx-2" style={{background:borderClr}} />
              <button type="button" title="Lật bàn" onClick={handleFlip}
                className="w-8 h-8 rounded-full inline-flex items-center justify-center text-slate-600 hover:text-white hover:bg-white/8 transition-all">
                <FlipVertical2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          {/* ── Mobile move panel (below toolbar, md:hidden) ── */}
          <div className="md:hidden shrink-0 flex flex-col overflow-hidden"
            style={{height: 220, background: panelBg, borderTop:`1px solid ${borderClr}`}}>

            {/* Coach note — compact */}
            {(invalidMoveMessage || isReplayMode || isExerciseMode) && (
              <div className="shrink-0 px-3 pt-2.5 pb-2">
                {invalidMoveMessage && (
                  <MoveFeedback message={invalidMoveMessage} variant="warning" />
                )}
                {!invalidMoveMessage && isExerciseMode && (
                  <div className={`rounded-xl px-3 py-2 text-xs font-medium leading-relaxed ${
                    exerciseResult === "completed" ? "text-emerald-300"
                    : exerciseResult === "wrong" ? "text-red-300"
                    : "text-amber-200"
                  }`} style={
                    exerciseResult === "completed"
                      ? {background:"rgba(16,185,129,0.12)",border:"1px solid rgba(16,185,129,0.25)"}
                      : exerciseResult === "wrong"
                        ? {background:"rgba(239,68,68,0.12)",border:"1px solid rgba(239,68,68,0.25)"}
                        : {background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.22)"}
                  }>{coachGoal}</div>
                )}
                {!invalidMoveMessage && isReplayMode && activeReplayMoveIndex >= 0 && (
                  <div className="rounded-xl overflow-hidden"
                    style={{background:"rgba(15,25,50,0.9)",border:`1px solid ${hasNote ? "rgba(56,189,248,0.25)" : borderClr}`}}>
                    <div className="flex items-center gap-2 px-3 py-1.5">
                      <span className="text-xs font-bold text-slate-500">Nước {activeReplayMoveIndex + 1}</span>
                      {currentMoveSan && (
                        <span className="text-xs font-black rounded-md px-1.5 py-0.5"
                          style={{background:"rgba(56,189,248,0.12)",color:"#7dd3fc",border:"1px solid rgba(56,189,248,0.2)"}}>
                          {currentMoveSan}
                        </span>
                      )}
                    </div>
                    {hasNote && (
                      <p className="px-3 pb-2 text-xs leading-relaxed text-slate-200">{activeReplayMoveNote}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Move list */}
            <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-2">
              {isExerciseMode ? (
                replayStep > 0 ? (
                  <MoveList moves={replayMoves.slice(0, replayStep)} cursor={replayStep} onJump={undefined} />
                ) : (
                  <div className="flex items-center justify-center h-full gap-2 text-slate-700 text-xs">
                    <span className="text-2xl opacity-20">⚔</span> Hãy tìm nước đi đúng!
                  </div>
                )
              ) : moveHistory.length > 0 || replayMoves.length > 0 ? (
                <MoveList
                  moves={isReplayMode ? replayMoves : moveHistory}
                  cursor={isReplayMode ? replayStep : moveHistory.length}
                  onJump={isReplayMode ? handleJumpToMove : undefined}
                />
              ) : (
                <div className="flex items-center justify-center h-full gap-2 text-slate-700 text-xs">
                  <span className="text-2xl opacity-20">♟</span> Chưa có nước đi nào
                </div>
              )}
            </div>

            {/* Prev / Next lesson */}
            <div className="shrink-0 px-3 pb-3 pt-1.5 grid grid-cols-2 gap-2 border-t" style={{borderColor:borderClr}}>
              <button type="button"
                onClick={() => prevLesson && navigateToLesson(prevLesson._id)}
                disabled={!prevLesson}
                className="flex items-center justify-center gap-1 rounded-xl py-2 text-xs font-semibold text-slate-300 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                style={{border:`1px solid ${borderClr}`,background:"rgba(255,255,255,0.03)"}}>
                <ArrowLeft className="h-3.5 w-3.5" /> Bài trước
              </button>
              <button type="button"
                onClick={() => nextLesson && navigateToLesson(nextLesson._id)}
                disabled={!nextLesson}
                className="flex items-center justify-center gap-1 rounded-xl py-2 text-xs font-bold text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                style={{background:"linear-gradient(135deg,#dc2626,#b91c1c)"}}>
                Bài tiếp <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </main>

        {/* ── RIGHT PANEL ───────────────────────────────── */}
        <aside
          className={`flex flex-col overflow-hidden shrink-0 w-[320px]
            fixed md:relative inset-y-0 right-0 z-50 top-0 md:top-auto transition-transform duration-300
            ${mobilePanelOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"}`}
          style={{background:panelBg, borderLeft:`1px solid ${borderClr}`}}
        >
          <button type="button" onClick={() => setMobilePanelOpen(false)}
            className="md:hidden absolute top-3 left-3 z-10 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>

          {/* Coach note */}
          <div className="shrink-0 p-3.5 border-b" style={{borderColor:borderClr}}>
            {invalidMoveMessage && (
              <div className="mb-3"><MoveFeedback message={invalidMoveMessage} variant="warning" /></div>
            )}

            {isExerciseMode ? (
              <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed font-medium ${
                exerciseResult === "completed" ? "text-emerald-300"
                : exerciseResult === "wrong" ? "text-red-300"
                : "text-amber-200"
              }`} style={
                exerciseResult === "completed"
                  ? {background:"linear-gradient(135deg,rgba(16,185,129,0.12),rgba(5,150,105,0.06))",border:"1px solid rgba(16,185,129,0.25)"}
                  : exerciseResult === "wrong"
                    ? {background:"linear-gradient(135deg,rgba(239,68,68,0.12),rgba(185,28,28,0.06))",border:"1px solid rgba(239,68,68,0.25)"}
                    : {background:"linear-gradient(135deg,rgba(245,158,11,0.1),rgba(180,83,9,0.05))",border:"1px solid rgba(245,158,11,0.22)"}
              }>{coachGoal}</div>
            ) : isReplayMode && activeReplayMoveIndex >= 0 ? (
              <div className="rounded-2xl overflow-hidden"
                style={{background:"linear-gradient(135deg,rgba(15,25,50,0.9),rgba(10,18,38,0.9))",border:`1px solid ${hasNote ? "rgba(56,189,248,0.25)" : borderClr}`}}>
                <div className="flex items-center gap-2 px-3.5 py-2.5 border-b" style={{borderColor:borderClr}}>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nước {activeReplayMoveIndex + 1}</span>
                  {currentMoveSan && (
                    <span className="text-sm font-black rounded-lg px-2 py-0.5"
                      style={{background:"rgba(56,189,248,0.12)",color:"#7dd3fc",border:"1px solid rgba(56,189,248,0.2)"}}>
                      {currentMoveSan}
                    </span>
                  )}
                </div>
                <p className={`px-3.5 py-3 text-sm leading-relaxed ${hasNote ? "text-slate-200" : "text-slate-600 italic"}`}>
                  {hasNote ? activeReplayMoveNote : "Chưa có ghi chú cho nước này."}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl px-4 py-3 text-center"
                style={{background:"rgba(255,255,255,0.025)",border:`1px solid ${borderClr}`}}>
                <p className="text-sm text-slate-500">
                  {isReplayMode
                    ? <>Nhấn <kbd className="rounded-lg px-1.5 py-0.5 font-mono text-white text-[10px]" style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)"}}>→</kbd> để xem ghi chú</>
                    : "Tự do di chuyển quân cờ"}
                </p>
              </div>
            )}
          </div>

          {/* Move list */}
          <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3">
            {isExerciseMode ? (
              replayStep > 0 ? (
                <MoveList moves={replayMoves.slice(0, replayStep)} cursor={replayStep} onJump={undefined} />
              ) : (
                <div className="flex flex-col items-center justify-center h-24 gap-2 text-slate-700 text-xs">
                  <span className="text-3xl opacity-20">⚔</span>
                  Hãy tìm nước đi đúng!
                </div>
              )
            ) : moveHistory.length > 0 || replayMoves.length > 0 ? (
              <MoveList
                moves={isReplayMode ? replayMoves : moveHistory}
                cursor={isReplayMode ? replayStep : moveHistory.length}
                onJump={isReplayMode ? handleJumpToMove : undefined}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-24 gap-2 text-slate-700 text-xs">
                <span className="text-3xl opacity-20">♟</span>
                Chưa có nước đi nào
              </div>
            )}
          </div>

          {/* Nav */}
          <div className="shrink-0 p-3 space-y-2 border-t" style={{borderColor:borderClr}}>
            <div className="grid grid-cols-2 gap-2">
              <button type="button"
                onClick={() => prevLesson && navigateToLesson(prevLesson._id)}
                disabled={!prevLesson}
                className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold text-slate-300 transition-all hover:bg-white/8 disabled:opacity-20 disabled:cursor-not-allowed"
                style={{border:`1px solid ${borderClr}`,background:"rgba(255,255,255,0.03)"}}>
                <ArrowLeft className="h-4 w-4 shrink-0" /> Trước
              </button>
              <button type="button"
                onClick={() => nextLesson && navigateToLesson(nextLesson._id)}
                disabled={!nextLesson}
                className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all hover:opacity-90"
                style={{background:"linear-gradient(135deg,#dc2626,#b91c1c)"}}>
                Tiếp theo <ArrowRight className="h-4 w-4 shrink-0" />
              </button>
            </div>
            <button type="button" onClick={navigateToCourse}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-slate-600 hover:text-slate-300 transition-colors rounded-xl hover:bg-white/4">
              <Home className="h-3.5 w-3.5" /> Về trang khóa học
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default LearningPage;
