import axiosClient from "../../../api/axiosClient";

// For public endpoints we might need a separate client if axiosClient forces auth?
// Assuming axiosClient handles it gracefully or we use a separate instance for public.
// Let's assume axiosClient is for authenticated users principally, but we can reuse for public GETs 
// if the backend doesn't reject them.
// Actually, let's create a specialized method for public fetching if needed.

const productService = {
  getAll: (isAdmin = false) => {
    return axiosClient.get(`/products?isAdmin=${isAdmin}`);
  },
  getById: (id) => {
    return axiosClient.get(`/products/${id}`);
  },
  create: (data) => {
    return axiosClient.post('/products', data);
  },
  update: (id, data) => {
    return axiosClient.put(`/products/${id}`, data);
  },
  delete: (id) => {
    return axiosClient.delete(`/products/${id}`);
  }
};

export default productService;
