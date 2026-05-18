import axiosClient from "../api/axiosClient";

const orderService = {
  create: (data) => {
    return axiosClient.post("/orders", data);
  },
  getById: (id) => {
    return axiosClient.get(`/orders/${id}`);
  },
  getMyOrders: () => {
    return axiosClient.get("/orders/my-orders");
  },
  getAll: () => {
    return axiosClient.get("/orders/admin/all");
  },
  updateStatus: (id, status) => {
    return axiosClient.put(`/orders/${id}/pay`, { status });
  },
  refund: (id, payload = {}) => {
    return axiosClient.post(`/orders/${id}/refund`, payload);
  },
};

export default orderService;
