import axiosClient from "../api/axiosClient";

/**
 * Khớp `GET|POST|PUT|DELETE /api/expenses`.
 * BE tra cứu theo `expenseId` (số) — tham số URL là expenseId.
 */
const expenseService = {
  getAll: () => axiosClient.get("/expenses"),
  getById: (expenseId) => axiosClient.get(`/expenses/${expenseId}`),
  create: (data) => axiosClient.post("/expenses", data),
  update: (expenseId, data) => axiosClient.put(`/expenses/${expenseId}`, data),
  delete: (expenseId) => axiosClient.delete(`/expenses/${expenseId}`),
};

export default expenseService;
