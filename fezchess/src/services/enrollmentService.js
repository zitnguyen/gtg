import axiosClient from "../api/axiosClient";

const enrollmentService = {
  getAll: (params) => {
    return axiosClient.get("/enrollments", { params });
  },
  getByClass: (classId) => {
    return axiosClient.get(`/enrollments/class/${classId}`);
  },
  getByStudent: (studentId) => {
    return axiosClient.get(`/enrollments/student/${studentId}`);
  },
  /** Học phí HV — cùng endpoint GET /enrollments/student/:id (role Student) */
  getMyTuition: (studentId) => {
    return axiosClient.get(`/enrollments/student/${studentId}`);
  },
  getById: (id) => {
    return axiosClient.get(`/enrollments/${id}`);
  },
  create: (data) => {
    return axiosClient.post("/enrollments", data);
  },
  withdraw: (data) => {
    return axiosClient.post("/enrollments/withdraw", data);
  },
  delete: (id) => {
    return axiosClient.delete(`/enrollments/${id}`);
  },
  update: (id, data) => {
    return axiosClient.put(`/enrollments/${id}`, data);
  },
  transfer: (id, data) => {
    return axiosClient.post(`/operations/enrollments/${id}/transfer`, data);
  },
};

export default enrollmentService;
