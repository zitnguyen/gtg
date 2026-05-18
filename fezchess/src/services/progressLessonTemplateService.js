import axiosClient from "../api/axiosClient";

const progressLessonTemplateService = {
  getAll: () => axiosClient.get("/progress-lesson-templates"),
  getById: (id) => axiosClient.get(`/progress-lesson-templates/${id}`),
  create: (payload) =>
    axiosClient.post("/progress-lesson-templates", payload),
  update: (id, payload) =>
    axiosClient.put(`/progress-lesson-templates/${id}`, payload),
  remove: (id) => axiosClient.delete(`/progress-lesson-templates/${id}`),
};

export default progressLessonTemplateService;
