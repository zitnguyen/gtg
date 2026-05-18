import React, { useEffect, useMemo, useState } from 'react';
import courseService from '../../../../services/courseService';
import { Plus, Video, FileText, Trash2, Swords, RotateCcw, ChevronLeft, ChevronRight, Pencil, ImagePlus, Loader2 } from 'lucide-react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import chessExerciseService from '../../../../services/chessExerciseService';

const LessonManager = ({ chapterId, courseId, lessons, onUpdate }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingLessonId, setEditingLessonId] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        type: 'video',
        content: '', // URL or text
        chessMode: 'internal',
        chessPlatform: 'internal-board',
        initialFen: '',
        initialPgn: '',
        initialMoves: [],
        initialMoveNotes: [],
        chessBackgroundUrl: '',
        exerciseMode: false,
        duration: 0,
        isFree: false
    });
    const [adminChessGame, setAdminChessGame] = useState(new Chess());
    const [baseFen, setBaseFen] = useState(new Chess().fen());
    const [fenInput, setFenInput] = useState("");
    const [selectedAdminSquare, setSelectedAdminSquare] = useState(null);
    const [replayStep, setReplayStep] = useState(0);
    const [configuredMoves, setConfiguredMoves] = useState([]);
    const [configuredMoveNotes, setConfiguredMoveNotes] = useState([]);
    const [uploadingBg, setUploadingBg] = useState(false);
    const [exerciseSourceType, setExerciseSourceType] = useState("pgn");
    const [exerciseContent, setExerciseContent] = useState("");
    const [exerciseFile, setExerciseFile] = useState(null);
    const [exerciseDrafts, setExerciseDrafts] = useState([]);
    const [importingExercises, setImportingExercises] = useState(false);
    const swapTurnInFen = (fen) => {
        const parts = String(fen || "").split(" ");
        if (parts.length < 2) return fen;
        parts[1] = parts[1] === "w" ? "b" : "w";
        return parts.join(" ");
    };

    const cloneGameWithHistory = (sourceGame) => {
        const pgn = sourceGame?.pgn?.() || "";
        if (pgn) {
            const clone = new Chess();
            try {
                clone.loadPgn(pgn);
                return clone;
            } catch {
                // Fallback to FEN clone below.
            }
        }
        return new Chess(sourceGame?.fen?.() || undefined);
    };

    const rebuildGameFromMoves = (moves, startFen = baseFen) => {
        let rebuilt;
        try {
            rebuilt = startFen ? new Chess(startFen) : new Chess();
        } catch {
            rebuilt = new Chess();
        }
        (Array.isArray(moves) ? moves : []).forEach((san) => {
            try {
                rebuilt.move(san);
            } catch {
                // Skip invalid SAN when rebuilding.
            }
        });
        return rebuilt;
    };

    const syncBoardFromMoves = (nextMoves, nextNotes = configuredMoveNotes) => {
        const normalizedMoves = Array.isArray(nextMoves) ? nextMoves.filter(Boolean) : [];
        const normalizedNotes = normalizedMoves.map(
            (_, index) => String((Array.isArray(nextNotes) ? nextNotes[index] : "") || ""),
        );
        const rebuiltGame = rebuildGameFromMoves(normalizedMoves, baseFen);
        setConfiguredMoves(normalizedMoves);
        setConfiguredMoveNotes(normalizedNotes);
        setAdminChessGame(rebuiltGame);
        setFenInput(rebuiltGame.fen());
        setFormData((prev) => ({
            ...prev,
            initialFen: baseFen,
            initialPgn: rebuiltGame.pgn(),
            initialMoves: normalizedMoves,
            initialMoveNotes: normalizedNotes,
        }));
        setReplayStep(normalizedMoves.length);
        setSelectedAdminSquare(null);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        try {
            const boardHistoryMoves = Array.isArray(adminChessGame?.history?.())
                ? adminChessGame.history()
                : [];
            const canonicalMoves =
                Array.isArray(configuredMoves) && configuredMoves.length > 0
                    ? configuredMoves
                    : boardHistoryMoves;
            const canonicalMoveNotes = canonicalMoves.map(
                (_, index) => String(configuredMoveNotes[index] || ""),
            );
            const canonicalGame = rebuildGameFromMoves(canonicalMoves, baseFen);
            const canonicalFen = String(formData.initialFen || canonicalGame.fen() || "").trim();
            const canonicalPgn = String(formData.initialPgn || canonicalGame.pgn() || "").trim();
            const payload =
                formData.type === "chess"
                    ? {
                          ...formData,
                          content: "",
                          chessMode: "internal",
                          chessPlatform: "internal-board",
                          initialFen: canonicalFen,
                          initialPgn: canonicalPgn,
                          initialMoves: canonicalMoves,
                          initialMoveNotes: canonicalMoveNotes,
                          chessBackgroundUrl: String(formData.chessBackgroundUrl || "").trim(),
                      }
                    : { ...formData };
            if (editingLessonId) {
                await courseService.updateLesson(editingLessonId, payload);
            } else {
                await courseService.addLesson({
                    ...payload,
                    chapterId,
                    courseId,
                    order: lessons.length + 1
                });
            }
            if (formData.type === "chess") {
                alert(`Đã lưu bài cờ với ${canonicalMoves.length} nước đi.`);
            }
            setIsAdding(false);
            setEditingLessonId(null);
            setFormData({
                title: '',
                type: 'video',
                content: '',
                chessMode: 'internal',
                chessPlatform: 'internal-board',
                initialFen: '',
                initialPgn: '',
                initialMoves: [],
                initialMoveNotes: [],
                chessBackgroundUrl: '',
                exerciseMode: false,
                duration: 0,
                isFree: false,
            });
            setAdminChessGame(new Chess());
            setBaseFen(new Chess().fen());
            setFenInput("");
            setReplayStep(0);
            setConfiguredMoves([]);
            setConfiguredMoveNotes([]);
            onUpdate();
        } catch (error) {
            console.error("Error adding lesson:", error);
            const detail =
                error?.apiMessage ||
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                "Lỗi thêm bài học";
            alert(detail);
        }
    };

    const handleEditLesson = (lesson) => {
        setIsAdding(true);
        setEditingLessonId(lesson?._id || null);
        const nextFormData = {
            title: lesson?.title || "",
            type: lesson?.type || "video",
            content: lesson?.content || "",
            chessMode: lesson?.chessMode || "internal",
            chessPlatform: lesson?.chessPlatform || "internal-board",
            initialFen: lesson?.initialFen || "",
            initialPgn: lesson?.initialPgn || "",
            initialMoves: Array.isArray(lesson?.initialMoves) ? lesson.initialMoves : [],
            initialMoveNotes: Array.isArray(lesson?.initialMoveNotes) ? lesson.initialMoveNotes : [],
            chessBackgroundUrl: lesson?.chessBackgroundUrl || "",
            exerciseMode: Boolean(lesson?.exerciseMode),
            duration: Number(lesson?.duration || 0),
            isFree: Boolean(lesson?.isFree),
        };
        setFormData(nextFormData);

        if (nextFormData.type === "chess") {
            let detectedBaseFen = nextFormData.initialFen || "";
            let nextGame = new Chess();
            if (nextFormData.initialPgn) {
                try {
                    nextGame.loadPgn(nextFormData.initialPgn);
                } catch {
                    // fallback to FEN below
                }
            } else if (nextFormData.initialFen) {
                try {
                    nextGame = new Chess(nextFormData.initialFen);
                } catch {
                    nextGame = new Chess();
                }
            }
            if (nextGame.history().length === 0 && nextFormData.initialMoves.length > 0) {
                let replayGame;
                try {
                    replayGame = detectedBaseFen ? new Chess(detectedBaseFen) : new Chess();
                } catch {
                    replayGame = new Chess();
                    detectedBaseFen = replayGame.fen();
                }
                nextFormData.initialMoves.forEach((san) => {
                    try {
                        replayGame.move(san);
                    } catch {
                        // ignore invalid move during hydration
                    }
                });
                nextGame = replayGame;
            }
            setAdminChessGame(nextGame);
            setBaseFen(detectedBaseFen || nextGame.fen());
            setFenInput(nextGame.fen());
            const loadedMoves =
                Array.isArray(nextFormData.initialMoves) && nextFormData.initialMoves.length > 0
                    ? nextFormData.initialMoves
                    : nextGame.history();
            const loadedNotes = loadedMoves.map(
                (_, index) => String(nextFormData.initialMoveNotes?.[index] || ""),
            );
            setConfiguredMoves(loadedMoves);
            setConfiguredMoveNotes(loadedNotes);
            setReplayStep(loadedMoves.length || 0);
            setSelectedAdminSquare(null);
        } else {
            setAdminChessGame(new Chess());
            setBaseFen(new Chess().fen());
            setFenInput("");
            setReplayStep(0);
            setConfiguredMoves([]);
            setConfiguredMoveNotes([]);
            setSelectedAdminSquare(null);
        }
    };

    const handleDelete = async (lessonId) => {
        if (!window.confirm("Xóa bài học này?")) return;
        try {
            await courseService.deleteLesson(lessonId);
            onUpdate();
        } catch (error) {
            console.error(error);
        }
    };

    const handleUploadBackground = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
            setUploadingBg(true);
            const uploadedUrl = await courseService.uploadImage(file);
            setFormData((prev) => ({ ...prev, chessBackgroundUrl: uploadedUrl }));
        } catch (error) {
            const detail =
                error?.apiMessage || error?.response?.data?.message || error?.message || "Upload ảnh nền thất bại";
            alert(detail);
        } finally {
            setUploadingBg(false);
            event.target.value = "";
        }
    };

    const handleImportExercises = async () => {
        if (!editingLessonId) {
            alert("Vui lòng lưu bài học trước khi import bài tập.");
            return;
        }
        try {
            setImportingExercises(true);
            const data = await chessExerciseService.importExercises({
                lessonId: editingLessonId,
                sourceType: exerciseSourceType,
                content: exerciseContent,
                file: exerciseFile,
            });
            setExerciseDrafts(Array.isArray(data?.items) ? data.items : []);
            if (Array.isArray(data?.warnings) && data.warnings.length > 0) {
                alert(`Import xong với cảnh báo:\\n- ${data.warnings.join("\\n- ")}`);
            } else {
                alert("Import bài tập thành công.");
            }
        } catch (error) {
            alert(error?.response?.data?.message || "Import bài tập thất bại.");
        } finally {
            setImportingExercises(false);
        }
    };

    const handleDraftChange = (exerciseId, key, value) => {
        setExerciseDrafts((prev) =>
            prev.map((item) => (item._id === exerciseId ? { ...item, [key]: value } : item)),
        );
    };

    const saveDraftExercise = async (exercise) => {
        try {
            const payload = {
                title: exercise.title,
                startFen: exercise.startFen,
                solutionSan: exercise.solutionSan,
                solutionUci: exercise.solutionUci,
                hintText: exercise.hintText,
                explanation: exercise.explanation,
                difficulty: exercise.difficulty || "easy",
            };
            const updated = await chessExerciseService.updateExercise(exercise._id, payload);
            setExerciseDrafts((prev) =>
                prev.map((item) => (item._id === exercise._id ? { ...item, ...updated } : item)),
            );
            alert("Đã lưu draft bài tập.");
        } catch (error) {
            alert(error?.response?.data?.message || "Lưu draft thất bại.");
        }
    };

    const publishDraftExercise = async (exercise) => {
        try {
            const updated = await chessExerciseService.publishExercise(exercise._id, {
                solutionSan: exercise.solutionSan,
                solutionUci: exercise.solutionUci,
                hintText: exercise.hintText,
                explanation: exercise.explanation,
            });
            setExerciseDrafts((prev) =>
                prev.map((item) => (item._id === exercise._id ? { ...item, ...updated } : item)),
            );
            alert("Đã publish bài tập.");
        } catch (error) {
            alert(error?.response?.data?.message || "Publish bài tập thất bại.");
        }
    };

    const handleAdminBoardDrop = ({ sourceSquare, targetSquare }) => {
        if (!sourceSquare || !targetSquare) return false;
        const tryMove = (gameSource, useFenSwap = false) => {
            const copy = useFenSwap
                ? new Chess(swapTurnInFen(gameSource.fen()))
                : cloneGameWithHistory(gameSource);
            const move = copy.move({ from: sourceSquare, to: targetSquare, promotion: "q" });
            if (!move) return null;
            return { move, copy };
        };
        let result = tryMove(adminChessGame, false);
        if (!result) {
            result = tryMove(adminChessGame, true);
        }
        if (!result) return false;

        const nextSan = result?.move?.san;
        if (!nextSan) return false;
        const baseMoves = configuredMoves.slice(0, replayStep);
        syncBoardFromMoves([...baseMoves, nextSan]);
        return true;
    };

    const handleAdminSquareClick = ({ square }) => {
        if (!square) return;
        if (!selectedAdminSquare) {
            const pickedPiece = adminChessGame.get(square);
            if (!pickedPiece) return;
            setSelectedAdminSquare(square);
            return;
        }

        if (selectedAdminSquare === square) {
            setSelectedAdminSquare(null);
            return;
        }

        const tryMove = (fenSource) => {
            const copy = cloneGameWithHistory(fenSource);
            const move = copy.move({ from: selectedAdminSquare, to: square, promotion: "q" });
            if (!move) return null;
            return { move, copy };
        };
        let result = tryMove(adminChessGame);
        if (!result) {
            const swapped = new Chess(swapTurnInFen(adminChessGame.fen()));
            const move = swapped.move({ from: selectedAdminSquare, to: square, promotion: "q" });
            result = move ? { move, copy: swapped } : null;
        }
        if (!result) {
            const repick = adminChessGame.get(square);
            if (repick) {
                setSelectedAdminSquare(square);
            }
            return;
        }
        const nextSan = result?.move?.san;
        if (!nextSan) return;
        const baseMoves = configuredMoves.slice(0, replayStep);
        syncBoardFromMoves([...baseMoves, nextSan]);
    };

    const handleApplyFen = () => {
        try {
            const next = new Chess(fenInput || undefined);
            setBaseFen(next.fen());
            setAdminChessGame(next);
            setConfiguredMoves(next.history());
            setConfiguredMoveNotes(next.history().map(() => ""));
            setFormData((prev) => ({
                ...prev,
                initialFen: next.fen(),
                initialPgn: next.pgn(),
                initialMoves: next.history(),
                initialMoveNotes: next.history().map(() => ""),
            }));
            setReplayStep(next.history().length);
        } catch {
            alert("FEN không hợp lệ.");
        }
    };

    const handleResetAdminBoard = () => {
        const next = new Chess();
        setBaseFen(next.fen());
        setAdminChessGame(next);
        setFenInput(next.fen());
        setConfiguredMoves([]);
        setConfiguredMoveNotes([]);
        setFormData((prev) => ({
            ...prev,
            initialFen: next.fen(),
            initialPgn: next.pgn(),
            initialMoves: next.history(),
            initialMoveNotes: [],
        }));
        setReplayStep(0);
        setSelectedAdminSquare(null);
    };

    const adminBoardOptions = useMemo(
        () => ({
            id: `admin-lesson-board-${chapterId}`,
            position: adminChessGame.fen(),
            onPieceDrop: handleAdminBoardDrop,
            onSquareClick: handleAdminSquareClick,
            allowDragging: true,
            boardStyle: { width: "340px", maxWidth: "100%" },
            squareStyles: selectedAdminSquare
                ? {
                      [selectedAdminSquare]: {
                          boxShadow: "inset 0 0 0 3px rgba(250, 204, 21, 0.9)",
                      },
                  }
                : {},
        }),
        [adminChessGame, selectedAdminSquare, chapterId],
    );

    const savedMoveHistory = configuredMoves;
    const adminMoveHistory = savedMoveHistory;

    const buildReplayGameByStep = (targetStep) => {
        const safeStep = Math.max(0, Math.min(targetStep, savedMoveHistory.length));
        const replayGame = rebuildGameFromMoves(savedMoveHistory.slice(0, safeStep));
        setReplayStep(safeStep);
        setAdminChessGame(replayGame);
        setFenInput(replayGame.fen());
        setSelectedAdminSquare(null);
    };

    const handleReplayPrev = () => buildReplayGameByStep(replayStep - 1);
    const handleReplayNext = () => buildReplayGameByStep(replayStep + 1);
    const selectedMoveIndex = replayStep > 0 ? replayStep - 1 : -1;
    const selectedMoveNote =
        selectedMoveIndex >= 0 ? String(configuredMoveNotes[selectedMoveIndex] || "") : "";
    const handleMoveNoteChange = (event) => {
        if (selectedMoveIndex < 0) return;
        const value = event.target.value;
        setConfiguredMoveNotes((prev) => {
            const next = [...prev];
            next[selectedMoveIndex] = value;
            return next;
        });
        setFormData((prev) => {
            const nextNotes = [...(prev.initialMoveNotes || [])];
            nextNotes[selectedMoveIndex] = value;
            return { ...prev, initialMoveNotes: nextNotes };
        });
    };

    useEffect(() => {
        if (!isAdding || formData.type !== "chess") return undefined;
        const onKeyDown = (event) => {
            const tag = String(event.target?.tagName || "").toLowerCase();
            const isTypingTarget =
                tag === "input" || tag === "textarea" || tag === "select" || event.target?.isContentEditable;
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
    }, [isAdding, formData.type, replayStep, savedMoveHistory.length]);

    return (
        <div className="space-y-3 pl-4 border-l-2 border-gray-100 ml-2">
            {lessons.map((lesson) => (
                <div key={lesson._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 group transition-colors">
                    <div className="flex items-center gap-3">
                        {lesson.type === 'video' ? <Video className="w-4 h-4 text-blue-500" /> : lesson.type === 'chess' ? <Swords className="w-4 h-4 text-amber-500" /> : <FileText className="w-4 h-4 text-green-500" />}
                        <span className="text-sm font-medium text-gray-700">{lesson.title}</span>
                        {lesson.isFree && <span className="text-[10px] uppercase font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Học thử</span>}
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <span className="text-xs text-gray-400 mr-2">{lesson.duration}p</span>
                         <button onClick={() => handleEditLesson(lesson)} className="text-gray-400 hover:text-blue-600">
                             <Pencil className="w-4 h-4" />
                         </button>
                         <button onClick={() => handleDelete(lesson._id)} className="text-gray-400 hover:text-red-600">
                             <Trash2 className="w-4 h-4" />
                         </button>
                    </div>
                </div>
            ))}

            {isAdding ? (
                <div className="bg-gray-50 p-4 rounded-lg border border-blue-100 mt-2">
                    <div className="space-y-3">
                        <input 
                            type="text" 
                            className="w-full p-2 text-sm border rounded focus:border-primary focus:outline-none"
                            placeholder="Tên bài học..."
                            value={formData.title}
                            onChange={e => setFormData({...formData, title: e.target.value})}
                        />
                        <div className="flex gap-2">
                             <select 
                                className="p-2 text-sm border rounded"
                                value={formData.type}
                                onChange={e => {
                                    const nextType = e.target.value;
                                    setFormData({...formData, type: nextType});
                                    if (nextType === "chess") {
                                        const next = new Chess();
                                        setBaseFen(next.fen());
                                        setAdminChessGame(next);
                                        setFenInput(next.fen());
                                        setConfiguredMoves([]);
                                        setConfiguredMoveNotes([]);
                                        setFormData((prev) => ({
                                            ...prev,
                                            initialFen: next.fen(),
                                            initialPgn: next.pgn(),
                                            initialMoves: next.history(),
                                            initialMoveNotes: [],
                                            chessBackgroundUrl: prev.chessBackgroundUrl || "",
                                        }));
                                        setReplayStep(0);
                                    }
                                }}
                             >
                                 <option value="video">Video</option>
                                 <option value="text">Bài đọc</option>
                                 <option value="chess">Bàn cờ</option>
                             </select>
                             {formData.type !== "chess" ? (
                                <input 
                                    type="text" 
                                    className="flex-1 p-2 text-sm border rounded"
                                    placeholder={
                                      formData.type === 'video'
                                        ? "URL Video (Youtube/Vimeo)..."
                                        : "Nội dung bài học..."
                                    }
                                    value={formData.content}
                                    onChange={e => setFormData({...formData, content: e.target.value})}
                                />
                             ) : (
                                <div className="flex-1 p-2 text-sm border rounded bg-gray-100 text-gray-600">
                                    Bài cờ nội bộ: thao tác trực tiếp trên bàn cờ bên dưới.
                                </div>
                             )}
                        </div>
                        {formData.type === "chess" && (
                          <div className="space-y-2 border border-amber-200 bg-amber-50 rounded-lg p-3">
                            {/* Task: Hướng dẫn tạo bài cờ / bài tập kiểu khoá học chuyên sâu — DucManh-BlueOC */}
                            <div className="text-[11px] text-amber-950 leading-relaxed rounded border border-amber-300/50 bg-white/90 px-2.5 py-2">
                                <strong>Mô hình Chessable-style:</strong> chuỗi nước trên bàn = ván mẫu hoặc
                                vòng luyện. Bật <strong>chế độ bài tập</strong> để học viên chỉ được đi đúng
                                đáp án; kết hợp <strong>import FEN/PGN</strong> ở khối bên dưới để thêm nhiều
                                tình huống vào cùng bài.
                            </div>
                            <div className="text-xs text-amber-700">
                                Bàn cờ nội bộ: admin đi quân hoặc nhập FEN, trạng thái sẽ lưu vào bài học.
                            </div>
                            <div className="text-xs text-slate-600">
                                Đã thiết lập: <span className="font-semibold">{adminMoveHistory.length}</span> nước đi
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleReplayPrev}
                                    disabled={replayStep === 0}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-slate-700 text-white disabled:opacity-50"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                    Lùi
                                </button>
                                <div className="text-xs text-slate-700 font-medium">
                                    {replayStep}/{savedMoveHistory.length}
                                </div>
                                <button
                                    type="button"
                                    onClick={handleReplayNext}
                                    disabled={replayStep >= savedMoveHistory.length}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-slate-700 text-white disabled:opacity-50"
                                >
                                    Tiến
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <div className="max-w-[360px]">
                                <Chessboard
                                    options={adminBoardOptions}
                                />
                            </div>
                            <div className="flex flex-col md:flex-row gap-2">
                                <input
                                    type="text"
                                    className="flex-1 p-2 text-xs border rounded"
                                    placeholder="Nhập FEN (tuỳ chọn)"
                                    value={fenInput}
                                    onChange={(e) => setFenInput(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={handleApplyFen}
                                    className="px-3 py-1.5 text-xs bg-slate-700 text-white rounded"
                                >
                                    Áp dụng FEN
                                </button>
                                <button
                                    type="button"
                                    onClick={handleResetAdminBoard}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    Reset
                                </button>
                            </div>
                            <div className="rounded border border-amber-200 bg-white p-2">
                                <div className="mb-1 text-[11px] font-semibold text-amber-700">
                                    Ảnh nền phía sau bàn cờ (tùy chọn)
                                </div>
                                <div className="flex flex-col md:flex-row gap-2">
                                    <label className="inline-flex items-center gap-2 rounded border border-gray-200 px-2 py-1 text-xs cursor-pointer hover:bg-gray-50">
                                        {uploadingBg ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <ImagePlus className="w-3.5 h-3.5" />
                                        )}
                                        {uploadingBg ? "Đang upload..." : "Tải ảnh nền"}
                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg"
                                            className="hidden"
                                            onChange={handleUploadBackground}
                                        />
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.chessBackgroundUrl || ""}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                chessBackgroundUrl: e.target.value,
                                            }))
                                        }
                                        placeholder="https://... (URL ảnh nền)"
                                        className="flex-1 rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-primary"
                                    />
                                </div>
                                {formData.chessBackgroundUrl ? (
                                    <img
                                        src={formData.chessBackgroundUrl}
                                        alt="Preview ảnh nền bàn cờ"
                                        className="mt-2 h-20 w-full rounded object-cover border border-gray-100"
                                    />
                                ) : null}
                            </div>
                            {adminMoveHistory.length > 0 && (
                                <div className="space-y-2">
                                    <div className="max-h-28 overflow-y-auto rounded border border-amber-100 bg-white px-2 py-1 text-xs text-slate-700">
                                        {adminMoveHistory.map((move, idx) => (
                                            <button
                                                type="button"
                                                key={`${move}-${idx}`}
                                                onClick={() => buildReplayGameByStep(idx + 1)}
                                                className={`mr-2 mb-1 inline-block rounded px-1.5 py-0.5 ${
                                                    idx === selectedMoveIndex
                                                        ? "bg-blue-600 text-white"
                                                        : "bg-slate-100 text-slate-700"
                                                }`}
                                            >
                                                {idx + 1}.{move}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="rounded border border-amber-200 bg-white p-2">
                                        <div className="mb-1 text-[11px] font-semibold text-amber-700">
                                            Ghi chú ý nghĩa nước đi
                                        </div>
                                        <textarea
                                            value={selectedMoveNote}
                                            onChange={handleMoveNoteChange}
                                            disabled={selectedMoveIndex < 0}
                                            rows={2}
                                            placeholder={
                                                selectedMoveIndex < 0
                                                    ? "Chọn một nước đi để ghi chú"
                                                    : `Giải thích cho nước đi ${selectedMoveIndex + 1}`
                                            }
                                            className="w-full rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-primary"
                                        />
                                    </div>
                                </div>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-4">
                            <input 
                                type="number" 
                                className="w-24 p-2 text-sm border rounded"
                                placeholder="Phút"
                                value={formData.duration}
                                onChange={e => setFormData({...formData, duration: Number(e.target.value)})}
                            />
                            <label className="flex items-center gap-2 text-sm text-gray-600">
                                <input 
                                    type="checkbox" 
                                    checked={formData.isFree}
                                    onChange={e => setFormData({...formData, isFree: e.target.checked})}
                                />
                                Cho phép học thử
                            </label>
                            {formData.type === "chess" && (
                                <label className="flex items-center gap-2 text-sm text-gray-600">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(formData.exerciseMode)}
                                        onChange={(e) =>
                                            setFormData({ ...formData, exerciseMode: e.target.checked })
                                        }
                                    />
                                    Bật chế độ bài tập (chấm đúng/sai)
                                </label>
                            )}
                            <div className="flex-1 flex justify-end gap-2">
                                <button
                                    onClick={() => {
                                        setIsAdding(false);
                                        setEditingLessonId(null);
                                    }}
                                    className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-200 rounded"
                                >
                                    Hủy
                                </button>
                                <button type="button" onClick={handleSubmit} className="px-3 py-1.5 text-xs bg-primary text-white rounded hover:bg-primary/90">
                                    {editingLessonId ? "Cập Nhật Bài Học" : "Lưu Bài Học"}
                                </button>
                            </div>
                        </div>
                        {formData.type === "chess" && (
                            <div className="rounded border border-sky-200 bg-sky-50 p-3 space-y-3">
                                <div className="text-sm font-semibold text-sky-800">
                                    Import bài tập cờ từ file
                                </div>
                                <div className="flex flex-col md:flex-row gap-2">
                                    <select
                                        value={exerciseSourceType}
                                        onChange={(e) => setExerciseSourceType(e.target.value)}
                                        className="rounded border border-gray-200 px-2 py-1 text-sm"
                                    >
                                        <option value="pgn">PGN</option>
                                        <option value="fen">FEN</option>
                                        <option value="image">Ảnh bàn cờ (OCR draft)</option>
                                    </select>
                                    <input
                                        type="file"
                                        onChange={(e) => setExerciseFile(e.target.files?.[0] || null)}
                                        className="text-xs"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleImportExercises}
                                        disabled={importingExercises}
                                        className="rounded bg-primary px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
                                    >
                                        {importingExercises ? "Đang import..." : "Import bài tập"}
                                    </button>
                                </div>
                                {exerciseSourceType !== "image" && (
                                    <textarea
                                        rows={3}
                                        value={exerciseContent}
                                        onChange={(e) => setExerciseContent(e.target.value)}
                                        placeholder="Dán PGN/FEN tại đây nếu không upload file..."
                                        className="w-full rounded border border-gray-200 px-2 py-1 text-xs"
                                    />
                                )}
                                {exerciseDrafts.length > 0 && (
                                    <div className="space-y-2">
                                        {exerciseDrafts.map((exercise, idx) => (
                                            <div key={exercise._id} className="rounded border border-sky-100 bg-white p-2 space-y-2">
                                                <div className="text-xs font-semibold text-slate-700">
                                                    Draft #{idx + 1} - {exercise.status}
                                                </div>
                                                <input
                                                    value={exercise.title || ""}
                                                    onChange={(e) => handleDraftChange(exercise._id, "title", e.target.value)}
                                                    placeholder="Tiêu đề bài tập"
                                                    className="w-full rounded border border-gray-200 px-2 py-1 text-xs"
                                                />
                                                <input
                                                    value={exercise.startFen || ""}
                                                    onChange={(e) => handleDraftChange(exercise._id, "startFen", e.target.value)}
                                                    placeholder="FEN bắt đầu"
                                                    className="w-full rounded border border-gray-200 px-2 py-1 text-xs"
                                                />
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    <input
                                                        value={exercise.solutionSan || ""}
                                                        onChange={(e) => handleDraftChange(exercise._id, "solutionSan", e.target.value)}
                                                        placeholder="Đáp án SAN (vd: Nf3)"
                                                        className="rounded border border-gray-200 px-2 py-1 text-xs"
                                                    />
                                                    <input
                                                        value={exercise.solutionUci || ""}
                                                        onChange={(e) => handleDraftChange(exercise._id, "solutionUci", e.target.value)}
                                                        placeholder="Đáp án UCI (vd: g1f3)"
                                                        className="rounded border border-gray-200 px-2 py-1 text-xs"
                                                    />
                                                </div>
                                                <input
                                                    value={exercise.hintText || ""}
                                                    onChange={(e) => handleDraftChange(exercise._id, "hintText", e.target.value)}
                                                    placeholder="Gợi ý cho học viên"
                                                    className="w-full rounded border border-gray-200 px-2 py-1 text-xs"
                                                />
                                                <textarea
                                                    rows={2}
                                                    value={exercise.explanation || ""}
                                                    onChange={(e) => handleDraftChange(exercise._id, "explanation", e.target.value)}
                                                    placeholder="Giải thích ý nghĩa đáp án"
                                                    className="w-full rounded border border-gray-200 px-2 py-1 text-xs"
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => saveDraftExercise(exercise)}
                                                        className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700"
                                                    >
                                                        Lưu draft
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => publishDraftExercise(exercise)}
                                                        className="rounded bg-emerald-600 px-2 py-1 text-xs text-white"
                                                    >
                                                        Publish
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <button 
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 text-sm text-primary font-medium hover:underline mt-2 px-2"
                >
                    <Plus className="w-4 h-4" />
                    Thêm bài học
                </button>
            )}
        </div>
    );
};

export default LessonManager;
