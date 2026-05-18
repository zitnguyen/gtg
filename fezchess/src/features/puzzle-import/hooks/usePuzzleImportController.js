import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import puzzleImportApiService from "../services/puzzleImportApiService";
import { isValidFen, normalizePreviewItem } from "../utils/fenValidation";

const POLL_INTERVAL_MS = 1000;

const defaultDeadline = () =>
  new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

const toggleId = (list, value) =>
  list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

export const usePuzzleImportController = () => {
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [detectionProgress, setDetectionProgress] = useState(0);
  const [detectionStatus, setDetectionStatus] = useState("idle");
  const [jobId, setJobId] = useState("");
  const [previewItems, setPreviewItems] = useState([]);
  const [savedPuzzles, setSavedPuzzles] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [studentIds, setStudentIds] = useState([]);
  const [classIds, setClassIds] = useState([]);
  const [deadline, setDeadline] = useState(defaultDeadline);
  const [saving, setSaving] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState("");
  const abortControllerRef = useRef(null);

  const loadMeta = useCallback(async () => {
    const [studentRows, classRows] = await Promise.all([
      puzzleImportApiService.getStudents(),
      puzzleImportApiService.getClasses(),
    ]);
    setStudents(Array.isArray(studentRows) ? studentRows : []);
    setClasses(Array.isArray(classRows) ? classRows : []);
  }, []);

  useEffect(() => {
    loadMeta().catch(() => {
      setError("Không thể tải danh sách học viên/lớp.");
    });
  }, [loadMeta]);

  const resetPreviewState = useCallback(() => {
    setPreviewItems([]);
    setSavedPuzzles([]);
    setUploadProgress(0);
    setDetectionProgress(0);
    setDetectionStatus("idle");
    setJobId("");
    setError("");
  }, []);

  const handleFileSelect = useCallback(
    (nextFile) => {
      setFile(nextFile || null);
      resetPreviewState();
    },
    [resetPreviewState],
  );

  const cancelDetection = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setDetectionStatus("cancelled");
  }, []);

  const applyDetectionResult = useCallback((result) => {
    const rows = Array.isArray(result?.detections) ? result.detections : [];
    setPreviewItems(rows.map(normalizePreviewItem));
    setDetectionProgress(100);
    setDetectionStatus("completed");
    if (!rows.length) {
      setError("Không phát hiện bàn cờ nào trong PDF.");
    }
  }, []);

  const pollJob = useCallback(
    async (nextJobId) => {
      let active = true;
      while (active) {
        await new Promise((resolve) => window.setTimeout(resolve, POLL_INTERVAL_MS));
        const data = await puzzleImportApiService.getPreviewJob(nextJobId);
        const job = data?.job;
        if (!job) throw new Error("Không tìm thấy detection job.");
        setDetectionProgress(Number(job.progress || 0));
        setDetectionStatus(job.status || "processing");
        if (job.status === "completed") {
          applyDetectionResult(job.result);
          active = false;
        } else if (job.status === "failed") {
          throw new Error(job.error || "Detection PDF thất bại.");
        }
      }
    },
    [applyDetectionResult],
  );

  const handlePreview = useCallback(async () => {
    if (!file) {
      setError("Vui lòng chọn file PDF.");
      return;
    }

    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      setError("");
      setUploadProgress(0);
      setDetectionProgress(5);
      setDetectionStatus("uploading");
      const data = await puzzleImportApiService.createPreviewJob(file, {
        signal: abortController.signal,
        onUploadProgress: (event) => {
          const total = event.total || file.size || 1;
          setUploadProgress(Math.round((event.loaded / total) * 100));
        },
      });
      const job = data?.job;
      if (!job?.id) throw new Error("Không tạo được detection job.");
      setJobId(job.id);
      setDetectionStatus(job.status || "queued");
      setDetectionProgress(Number(job.progress || 0));
      await pollJob(job.id);
    } catch (err) {
      if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
      setDetectionStatus("failed");
      setError(err?.response?.data?.message || err?.message || "Preview PDF thất bại.");
    } finally {
      abortControllerRef.current = null;
    }
  }, [file, pollJob]);

  const retryDetection = useCallback(() => {
    handlePreview();
  }, [handlePreview]);

  const toggleKeep = useCallback((index, checked) => {
    setPreviewItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, keep: checked } : item)),
    );
  }, []);

  const changeFen = useCallback((index, fen) => {
    setPreviewItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, fen, validFen: isValidFen(fen) } : item,
      ),
    );
  }, []);

  const toggleFlip = useCallback((index, checked) => {
    setPreviewItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, flip: checked } : item)),
    );
  }, []);

  const selectAllValid = useCallback(() => {
    setPreviewItems((prev) =>
      prev.map((item) => ({ ...item, keep: Boolean(item.validFen) })),
    );
  }, []);

  const clearSelection = useCallback(() => {
    setPreviewItems((prev) => prev.map((item) => ({ ...item, keep: false })));
  }, []);

  const selectedValidPuzzles = useMemo(
    () => previewItems.filter((item) => item.keep && item.validFen),
    [previewItems],
  );

  const handleConfirmSave = useCallback(async () => {
    const payload = selectedValidPuzzles.map((item) => ({
      fen: item.fen,
      imagePreview: item.imagePreview,
    }));
    if (!payload.length) {
      setError("Không có puzzle hợp lệ được chọn.");
      return null;
    }
    try {
      setSaving(true);
      setError("");
      const data = await puzzleImportApiService.confirmPuzzles(payload);
      const items = Array.isArray(data?.items) ? data.items : [];
      setSavedPuzzles(items);
      return data;
    } catch (err) {
      setError(err?.response?.data?.message || "Lưu puzzle thất bại.");
      return null;
    } finally {
      setSaving(false);
    }
  }, [selectedValidPuzzles]);

  const canAssign = useMemo(
    () => savedPuzzles.length > 0 && (studentIds.length > 0 || classIds.length > 0),
    [savedPuzzles, studentIds, classIds],
  );

  const toggleStudent = useCallback((id) => {
    setStudentIds((prev) => toggleId(prev, id));
  }, []);

  const toggleClass = useCallback((id) => {
    setClassIds((prev) => toggleId(prev, id));
  }, []);

  const handleAssign = useCallback(async () => {
    if (!canAssign) {
      setError("Cần có puzzle đã lưu và danh sách học viên/lớp.");
      return;
    }
    try {
      setAssigning(true);
      setError("");
      const data = await puzzleImportApiService.assignPuzzles({
        puzzleIds: savedPuzzles.map((item) => item._id),
        studentIds,
        classIds,
        deadline: new Date(deadline).toISOString(),
      });
      return data;
    } catch (err) {
      setError(err?.response?.data?.message || "Giao puzzle thất bại.");
      return null;
    } finally {
      setAssigning(false);
    }
  }, [canAssign, classIds, deadline, savedPuzzles, studentIds]);

  const stats = useMemo(
    () => ({
      total: previewItems.length,
      valid: previewItems.filter((item) => item.validFen).length,
      selected: selectedValidPuzzles.length,
      saved: savedPuzzles.length,
    }),
    [previewItems, savedPuzzles.length, selectedValidPuzzles.length],
  );

  const isDetecting = ["uploading", "queued", "processing"].includes(detectionStatus);

  return {
    canAssign,
    cancelDetection,
    changeFen,
    classIds,
    classes,
    clearSelection,
    deadline,
    detectionProgress,
    detectionStatus,
    error,
    file,
    handleAssign,
    handleConfirmSave,
    handleFileSelect,
    handlePreview,
    isDetecting,
    jobId,
    previewItems,
    retryDetection,
    savedPuzzles,
    saving,
    assigning,
    selectAllValid,
    setDeadline,
    stats,
    studentIds,
    students,
    toggleClass,
    toggleFlip,
    toggleKeep,
    toggleStudent,
    uploadProgress,
  };
};
