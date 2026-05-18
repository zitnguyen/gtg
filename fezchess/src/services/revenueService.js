import axiosClient from "../api/axiosClient";

/**
 * Khớp `GET|POST|PUT|DELETE /api/revenue`.
 * Lưu ý BE dùng `revenueId` (số) trong DB — tham số `id` ở URL là giá trị đó (không phải _id Mongo).
 */
const revenueService = {
  getAll: () => axiosClient.get("/revenue"),
  getById: (revenueId) => axiosClient.get(`/revenue/${revenueId}`),
  create: (data) => axiosClient.post("/revenue", data),
  update: (revenueId, data) => axiosClient.put(`/revenue/${revenueId}`, data),
  delete: (revenueId) => axiosClient.delete(`/revenue/${revenueId}`),
};

export default revenueService;
