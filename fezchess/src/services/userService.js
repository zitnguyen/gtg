import axiosClient from "../api/axiosClient";

/**
 * Quản trị người dùng — khớp `zchess-be/routes/userRoutes.js`.
 * (Giáo viên chi tiết public vẫn có thể dùng `teacherService.getPublicById`.)
 */
const userService = {
  getMe: () => axiosClient.get("/users/me"),
  getAll: (params) => axiosClient.get("/users", { params }),
  getById: (id) => axiosClient.get(`/users/${id}`),
  create: (data) => axiosClient.post("/users", data),
  update: (id, data) => axiosClient.put(`/users/${id}`, data),
  patch: (id, data) => axiosClient.patch(`/users/${id}`, data),
  delete: (id) => axiosClient.delete(`/users/${id}`),
  getOnlineUsers: () => axiosClient.get("/users/online"),
  getActivityStatuses: () => axiosClient.get("/users/activity-status"),
};

export default userService;
