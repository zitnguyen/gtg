import axiosClient from "../api/axiosClient";

const unwrapData = (response) => {
  if (response && typeof response === "object" && "success" in response) {
    return response.data;
  }
  return response;
};

const studentService = {
  getAll: async (params) => {
    const response = await axiosClient.get("/students", { params });
    return unwrapData(response) || [];
  },
  getById: async (id) => {
    const response = await axiosClient.get(`/students/${id}`);
    return unwrapData(response);
  },
  create: async (data) => {
    const response = await axiosClient.post("/students", data);
    return unwrapData(response);
  },
  update: async (id, data) => {
    const response = await axiosClient.put(`/students/${id}`, data);
    return unwrapData(response);
  },
  delete: async (id) => {
    const response = await axiosClient.delete(`/students/${id}`);
    return unwrapData(response);
  },
  restore: async (id) => {
    const response = await axiosClient.post(`/students/${id}/restore`);
    return unwrapData(response);
  },
  getByParentId: async (parentId) => {
    const response = await axiosClient.get(`/students/parent/${parentId}`);
    return unwrapData(response) || [];
  },
  getLeaderboard: async (params = {}) => {
    const response = await axiosClient.get("/students/leaderboard", { params });
    return unwrapData(response) || { items: [] };
  },
};

export default studentService;
