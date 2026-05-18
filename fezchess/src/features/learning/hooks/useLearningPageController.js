import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Chess } from "chess.js";
import learningService from "../services/learningService";
import {
  buildVideoEmbedUrl,
  createChessGame,
  isLichessLink,
  swapTurnInFen,
} from "../utils/chessLessonUtils";

const toLessonNavItem = (lesson, fallbackTitle) =>
  lesson
    ? {
        _id: lesson._id,
        title: lesson.title || fallbackTitle,
      }
    : null;

export const useLearningPageController = () => {
  const { courseSlug, lessonId } = useParams();
  const navigate = useNavigate();
  const chessViewportRef = useRef(null);

  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [moveHistory, setMoveHistory] = useState([]);
  const [savingProgress, setSavingProgress] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [game, setGame] = useState(new Chess());
  const [invalidMoveMessage, setInvalidMoveMessage] = useState("");
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [replayStep, setReplayStep] = useState(0);
  const [nextLesson, setNextLesson] = useState(null);
  const [prevLesson, setPrevLesson] = useState(null);
  const [lessonExercises, setLessonExercises] = useState([]);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [submittingExercise, setSubmittingExercise] = useState(false);
  const [exerciseMessage, setExerciseMessage] = useState("");
  const [exerciseHint, setExerciseHint] = useState("");
  const [hintLevel, setHintLevel] = useState(1);
  const [exerciseSolvedMap, setExerciseSolvedMap] = useState({});

  const isInternalChessLesson =
    lesson?.type === "chess" && lesson?.chessMode === "internal";
  const isChessLesson = lesson?.type === "chess";
  const isExerciseMode =
    Boolean(lesson?.exerciseMode) && lessonExercises.length > 0;
  const currentExercise = isExerciseMode
    ? lessonExercises[exerciseIndex]
    : null;
  const solvedCount = Object.keys(exerciseSolvedMap).length;
  const isAllExercisesSolved =
    !isExerciseMode || solvedCount >= lessonExercises.length;
  const replayMoves = Array.isArray(lesson?.initialMoves)
    ? lesson.initialMoves
    : [];
  const replayMoveNotes = Array.isArray(lesson?.initialMoveNotes)
    ? lesson.initialMoveNotes
    : [];
  const isReplayMode =
    !isExerciseMode && isInternalChessLesson && replayMoves.length > 0;
  const activeReplayMoveIndex = replayStep > 0 ? replayStep - 1 : -1;
  const activeReplayMoveNote =
    activeReplayMoveIndex >= 0
      ? String(replayMoveNotes[activeReplayMoveIndex] || "").trim()
      : "";

  useEffect(() => {
    const fetchLesson = async () => {
      if (!lessonId) return;
      setLoading(true);
      try {
        const res = await learningService.getLesson(lessonId);
        setLesson(res);
      } catch (error) {
        console.error("Failed to fetch lesson", error);
        if (error?.response?.status === 403) {
          alert(
            error?.response?.data?.message ||
              "Bạn không có quyền xem bài học này.",
          );
          navigate(`/courses/${courseSlug}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [courseSlug, lessonId, navigate]);

  useEffect(() => {
    if (!lessonId) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [lessonId]);

  useEffect(() => {
    const resolveLessonNavigation = async () => {
      if (!lessonId) {
        setNextLesson(null);
        setPrevLesson(null);
        return;
      }

      const [nextResult, prevResult] = await Promise.allSettled([
        learningService.getNextLesson(lessonId),
        learningService.getPrevLesson(lessonId),
      ]);

      setNextLesson(
        nextResult.status === "fulfilled"
          ? toLessonNavItem(nextResult.value?.nextLesson, "Bài học tiếp theo")
          : null,
      );
      setPrevLesson(
        prevResult.status === "fulfilled"
          ? toLessonNavItem(prevResult.value?.prevLesson, "Bài học trước")
          : null,
      );
    };

    resolveLessonNavigation();
  }, [lessonId]);

  useEffect(() => {
    const loadExercises = async () => {
      if (!lesson?._id || !lesson?.exerciseMode) {
        setLessonExercises([]);
        setExerciseIndex(0);
        setExerciseSolvedMap({});
        return;
      }

      try {
        const data = await learningService.getLessonExercises(lesson._id);
        const items = Array.isArray(data?.items) ? data.items : [];
        setLessonExercises(items);
        setExerciseIndex(0);
        setExerciseSolvedMap({});
        setExerciseMessage("");
        setExerciseHint("");
        setHintLevel(1);

        if (items[0]?.startFen) {
          const startGame = createChessGame(items[0].startFen);
          setGame(startGame);
          setMoveHistory(startGame.history());
          setSelectedSquare(null);
        }
      } catch {
        setLessonExercises([]);
      }
    };

    loadExercises();
  }, [lesson?._id, lesson?.exerciseMode]);

  useEffect(() => {
    const loadChessProgress = async () => {
      if (!lesson || lesson.type !== "chess" || lesson.chessMode !== "internal")
        return;
      if (lesson.exerciseMode && lessonExercises.length > 0) return;

      setLoadingProgress(true);
      try {
        const baseGame = createChessGame(lesson.initialFen);
        const configuredMoves = Array.isArray(lesson?.initialMoves)
          ? lesson.initialMoves
          : [];

        if (configuredMoves.length > 0) {
          setGame(baseGame);
          setMoveHistory(configuredMoves);
          setReplayStep(0);
          setSelectedSquare(null);
          setInvalidMoveMessage("");
          return;
        }

        setGame(baseGame);
        setMoveHistory(baseGame.history());
        setSelectedSquare(null);

        const progress = await learningService.getChessProgress(lesson._id);
        if (progress?.fen) {
          try {
            const resumed = new Chess(progress.fen);
            setGame(resumed);
            setMoveHistory(
              Array.isArray(progress?.moves)
                ? progress.moves
                : resumed.history(),
            );
            setSelectedSquare(null);
          } catch {
            // Keep fallback board.
          }
        }
      } catch {
        // Skip progress loading errors silently.
      } finally {
        setLoadingProgress(false);
      }
    };

    loadChessProgress();
  }, [lesson, lessonExercises]);

  useEffect(() => {
    if (!isChessLesson) return;
    const id = window.setTimeout(() => {
      chessViewportRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
    return () => window.clearTimeout(id);
  }, [lesson?._id, isChessLesson]);

  const makeMove = useCallback(
    (moveInput) => {
      const tryMove = (fenSource) => {
        const gameCopy = new Chess(fenSource);
        const move = gameCopy.move(moveInput);
        if (!move) return null;
        return { move, gameCopy };
      };

      let result = tryMove(game.fen());
      if (!result) {
        result = tryMove(swapTurnInFen(game.fen()));
      }
      if (!result) return null;

      setGame(result.gameCopy);
      setMoveHistory(result.gameCopy.history());
      return result.move;
    },
    [game],
  );

  const onDropPiece = useCallback(
    ({ sourceSquare, targetSquare }) => {
      setInvalidMoveMessage("");
      if (!sourceSquare || !targetSquare) return false;
      const move = makeMove({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });
      if (!move) {
        setInvalidMoveMessage(
          "Nước đi không hợp lệ hoặc chưa đến lượt quân này.",
        );
        return false;
      }
      setSelectedSquare(null);
      return true;
    },
    [makeMove],
  );

  const onSquareClick = useCallback(
    ({ square }) => {
      if (!square) return;
      if (isReplayMode) return;
      setInvalidMoveMessage("");
      if (!selectedSquare) {
        const pickedPiece = game.get(square);
        if (!pickedPiece) return;
        setSelectedSquare(square);
        return;
      }

      if (selectedSquare === square) {
        setSelectedSquare(null);
        return;
      }

      const move = makeMove({
        from: selectedSquare,
        to: square,
        promotion: "q",
      });
      if (!move) {
        const repickPiece = game.get(square);
        if (repickPiece && repickPiece.color === game.turn()) {
          setSelectedSquare(square);
          return;
        }
        setInvalidMoveMessage(
          "Nước đi không hợp lệ hoặc chưa đến lượt quân này.",
        );
        return;
      }
      setSelectedSquare(null);
    },
    [game, isReplayMode, makeMove, selectedSquare],
  );

  const handleResetBoard = useCallback(() => {
    const resetGame = createChessGame(lesson?.initialFen);
    setGame(resetGame);
    if (isReplayMode) {
      setReplayStep(0);
    } else {
      setMoveHistory(resetGame.history());
    }
    setSelectedSquare(null);
  }, [isReplayMode, lesson?.initialFen]);

  const handleSaveChessProgress = useCallback(async () => {
    if (!lesson?._id) return;
    try {
      setSavingProgress(true);
      await learningService.saveChessProgress(lesson._id, {
        fen: game.fen(),
        pgn: game.pgn(),
        moves: game.history(),
      });
      alert("Đã lưu nước đi thành công.");
    } catch (error) {
      alert(error?.response?.data?.message || "Không thể lưu nước đi.");
    } finally {
      setSavingProgress(false);
    }
  }, [game, lesson?._id]);

  const buildReplayGame = useCallback(
    (targetStep) => {
      const baseGame = createChessGame(lesson?.initialFen);
      const safeStep = Math.max(0, Math.min(targetStep, replayMoves.length));
      for (let i = 0; i < safeStep; i += 1) {
        const san = replayMoves[i];
        if (!san) continue;
        const moved = baseGame.move(san);
        if (!moved) break;
      }
      return { baseGame, safeStep };
    },
    [lesson?.initialFen, replayMoves],
  );

  const handleReplayNext = useCallback(() => {
    const { baseGame, safeStep } = buildReplayGame(replayStep + 1);
    setReplayStep(safeStep);
    setGame(baseGame);
  }, [buildReplayGame, replayStep]);

  const handleReplayPrev = useCallback(() => {
    const { baseGame, safeStep } = buildReplayGame(replayStep - 1);
    setReplayStep(safeStep);
    setGame(baseGame);
  }, [buildReplayGame, replayStep]);

  const resetExerciseBoard = useCallback(() => {
    if (!currentExercise?.startFen) return;
    const startGame = createChessGame(currentExercise.startFen);
    setGame(startGame);
    setMoveHistory(startGame.history());
    setSelectedSquare(null);
  }, [currentExercise?.startFen]);

  const handleSubmitExercise = useCallback(async () => {
    if (!currentExercise?._id) return;
    const answerSan = game.history().slice(-1)[0] || "";
    if (!answerSan) {
      setExerciseMessage("Bạn cần thực hiện một nước đi trước khi nộp.");
      return;
    }

    try {
      setSubmittingExercise(true);
      const result = await learningService.submitExerciseAnswer(
        currentExercise._id,
        { answerSan },
      );

      if (result?.isCorrect) {
        setExerciseSolvedMap((prev) => ({
          ...prev,
          [currentExercise._id]: true,
        }));
        setExerciseMessage("Chính xác! Bạn đã giải đúng bài tập.");

        if (exerciseIndex < lessonExercises.length - 1) {
          const nextIndex = exerciseIndex + 1;
          const nextExercise = lessonExercises[nextIndex];
          setExerciseIndex(nextIndex);
          setExerciseHint("");
          setHintLevel(1);

          if (nextExercise?.startFen) {
            const nextGame = createChessGame(nextExercise.startFen);
            setGame(nextGame);
            setMoveHistory(nextGame.history());
            setSelectedSquare(null);
          }
        }
      } else {
        setExerciseMessage("Sai rồi, vui lòng làm lại từ vị trí ban đầu.");
        setExerciseHint("");
        setHintLevel(1);
        resetExerciseBoard();
      }
    } catch (error) {
      setExerciseMessage(
        error?.response?.data?.message || "Không thể nộp đáp án.",
      );
    } finally {
      setSubmittingExercise(false);
    }
  }, [
    currentExercise?._id,
    exerciseIndex,
    game,
    lessonExercises,
    resetExerciseBoard,
  ]);

  const handleHintExercise = useCallback(async () => {
    if (!currentExercise?._id) return;
    try {
      const data = await learningService.getExerciseHint(
        currentExercise._id,
        hintLevel,
      );
      setExerciseHint(data?.hint || "Không có gợi ý.");
      setHintLevel((prev) => prev + 1);
    } catch (error) {
      setExerciseHint(
        error?.response?.data?.message || "Không lấy được gợi ý.",
      );
    }
  }, [currentExercise?._id, hintLevel]);

  useEffect(() => {
    if (!isReplayMode) return undefined;
    const onKeyDown = (event) => {
      const tag = String(event.target?.tagName || "").toLowerCase();
      const isTypingTarget =
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        event.target?.isContentEditable;
      if (isTypingTarget) return;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        handleReplayPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        handleReplayNext();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleReplayNext, handleReplayPrev, isReplayMode]);

  const chessboardOptions = useMemo(
    () => ({
      id: "lesson-internal-board",
      position: game.fen(),
      onPieceDrop: onDropPiece,
      onSquareClick,
      allowDragging: !isReplayMode || replayMoves.length === 0,
      boardOrientation: "white",
      animationDurationInMs: 180,
      boardStyle: { width: "100%", maxWidth: "520px" },
      squareStyles: selectedSquare
        ? {
            [selectedSquare]: {
              boxShadow: "inset 0 0 0 3px rgba(250, 204, 21, 0.9)",
            },
          }
        : {},
    }),
    [game, isReplayMode, onDropPiece, onSquareClick, replayMoves.length, selectedSquare],
  );

  const chessFen = useMemo(() => game.fen(), [game]);

  const chessLastMove = useMemo(() => {
    const verbose = game.history({ verbose: true });
    const last = verbose[verbose.length - 1];
    return last ? { from: last.from, to: last.to } : null;
  }, [game]);

  const chessLegalMoves = useMemo(() => {
    if (!selectedSquare) return [];
    try {
      return game.moves({ square: selectedSquare, verbose: true });
    } catch {
      return [];
    }
  }, [game, selectedSquare]);

  const chessAllowDragging = !isReplayMode || replayMoves.length === 0;

  const videoEmbedUrl = useMemo(
    () => buildVideoEmbedUrl(lesson?.content),
    [lesson?.content],
  );

  const pageBackgroundStyle =
    isChessLesson && lesson?.chessBackgroundUrl
      ? {
          backgroundImage: `linear-gradient(rgba(2, 6, 23, 0.58), rgba(2, 6, 23, 0.58)), url(${lesson.chessBackgroundUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }
      : {};

  const navigateToCourse = useCallback(() => {
    navigate(`/courses/${courseSlug}`);
  }, [courseSlug, navigate]);

  const navigateToLesson = useCallback(
    (targetLessonId) => {
      navigate(`/learning/${courseSlug}/${targetLessonId}`);
    },
    [courseSlug, navigate],
  );

  return {
    activeReplayMoveIndex,
    activeReplayMoveNote,
    chessAllowDragging,
    chessFen,
    chessLastMove,
    chessLegalMoves,
    chessViewportRef,
    chessboardOptions,
    currentExercise,
    exerciseHint,
    exerciseIndex,
    exerciseMessage,
    game,
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
    pageBackgroundStyle,
    prevLesson,
    onDropPiece,
    onSquareClick,
    replayMoves,
    replayStep,
    savingProgress,
    selectedSquare,
    submittingExercise,
    videoEmbedUrl,
  };
};
