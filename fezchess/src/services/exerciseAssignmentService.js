import axiosClient from "../api/axiosClient";

const exerciseAssignmentService = {
  createAssignment: async (payload) => {
    return axiosClient.post("/exercise-assignments", payload);
  },
  autoAssignFromPdf: async ({
    file,
    title,
    description,
    difficulty,
    studentIds,
    classIds,
    assignedDate,
    dueDate,
  }) => {
    const formData = new FormData();
    if (file) formData.append("file", file);
    formData.append("title", title || "");
    formData.append("description", description || "");
    formData.append("difficulty", difficulty || "mixed");
    formData.append("assignedDate", assignedDate || "");
    formData.append("dueDate", dueDate || "");
    (Array.isArray(studentIds) ? studentIds : []).forEach((id) =>
      formData.append("studentIds", id),
    );
    (Array.isArray(classIds) ? classIds : []).forEach((id) =>
      formData.append("classIds", id),
    );
    return axiosClient.post("/exercise-assignments/auto-from-pdf", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  getManagementAssignments: async (params = {}) => {
    return axiosClient.get("/exercise-assignments/management", { params });
  },
  getMyTodayAssignments: async (params = {}) => {
    return axiosClient.get("/exercise-assignments/my-today", { params });
  },
  submitBoard: async (assignmentId, payload) => {
    return axiosClient.post(`/exercise-assignments/${assignmentId}/submit-board`, payload);
  },
  getAssignmentProgress: async (assignmentId) => {
    return axiosClient.get(`/exercise-assignments/${assignmentId}/progress`);
  },
};

export default exerciseAssignmentService;
