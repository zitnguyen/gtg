import axiosClient from "../api/axiosClient";

const pdfPuzzleService = {
  uploadPdf: async (file, options = {}) => {
    const formData = new FormData();
    formData.append("file", file);
    if (options.flip !== undefined) formData.append("flip", String(options.flip));
    return axiosClient.post("/admin/upload-pdf", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  previewPdf: async (file, options = {}) => {
    const formData = new FormData();
    formData.append("file", file);
    if (options.flip !== undefined) formData.append("flip", String(options.flip));
    return axiosClient.post("/admin/puzzle/preview", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      signal: options.signal,
      onUploadProgress: options.onUploadProgress,
    });
  },
  createPreviewJob: async (file, options = {}) => {
    const formData = new FormData();
    formData.append("file", file);
    if (options.flip !== undefined) formData.append("flip", String(options.flip));
    return axiosClient.post("/admin/puzzle/preview-jobs", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      signal: options.signal,
      onUploadProgress: options.onUploadProgress,
    });
  },
  getPreviewJob: async (jobId) => {
    return axiosClient.get(`/admin/puzzle/preview-jobs/${jobId}`);
  },
  confirmPuzzles: async (puzzles) => {
    return axiosClient.post("/admin/puzzle/confirm", { puzzles });
  },
  getPuzzles: async () => {
    return axiosClient.get("/admin/puzzles");
  },
  assignPuzzles: async (payload) => {
    return axiosClient.post("/admin/assign", payload);
  },
  getTodayAssignments: async (params = {}) => {
    return axiosClient.get("/student/assignments/today", { params });
  },
  submitMove: async (puzzleId, payload) => {
    return axiosClient.post(`/student/attempt/${puzzleId}/move`, payload);
  },
};

export default pdfPuzzleService;
