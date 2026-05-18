import axiosClient from "../api/axiosClient";

const chessExerciseService = {
  importExercises: async ({ lessonId, sourceType, content, file }) => {
    const formData = new FormData();
    formData.append("lessonId", lessonId);
    formData.append("sourceType", sourceType);
    if (content) formData.append("content", content);
    if (file) formData.append("file", file);
    return axiosClient.post("/chess-exercises/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  updateExercise: async (id, payload) => {
    return axiosClient.patch(`/chess-exercises/${id}`, payload);
  },
  publishExercise: async (id, payload) => {
    return axiosClient.post(`/chess-exercises/${id}/publish`, payload);
  },
  getLessonExercises: async (lessonId) => {
    return axiosClient.get("/chess-exercises/public", { params: { lessonId } });
  },
  getExerciseLibrary: async (params = {}) => {
    return axiosClient.get("/chess-exercises/library", { params });
  },
  submitAnswer: async (exerciseId, payload) => {
    return axiosClient.post(`/chess-exercises/${exerciseId}/submit`, payload);
  },
  getHint: async (exerciseId, level = 1) => {
    return axiosClient.post(`/chess-exercises/${exerciseId}/hint`, { level });
  },
};

export default chessExerciseService;
