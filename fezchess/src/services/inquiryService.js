import axiosClient from "../api/axiosClient";

/** Khớp `zchess-be/routes/inquiryRoutes.js` — POST / public, còn lại Admin. */
const inquiryService = {
  create: (data) => axiosClient.post("/inquiries", data),
  getAll: () => axiosClient.get("/inquiries"),
  update: (id, data) => axiosClient.put(`/inquiries/${id}`, data),
  delete: (id) => axiosClient.delete(`/inquiries/${id}`),
};

export default inquiryService;
