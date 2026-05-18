import axiosClient from "../../../api/axiosClient";

const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

const safeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const requestFeed = async (params = {}) => {
  const search = new URLSearchParams();
  if (Number.isFinite(params.limit) && params.limit > 0) {
    search.set("limit", String(params.limit));
  }
  if (params.before) {
    search.set("before", String(params.before));
  }
  const suffix = search.toString();
  const url = suffix ? `/notifications?${suffix}` : "/notifications";
  return axiosClient.get(url);
};

const getFeed = async (params = {}, { allowRetry = true } = {}) => {
  try {
    return await requestFeed(params);
  } catch (error) {
    const status = error?.response?.status;
    if (allowRetry && status === 429) {
      await wait(1200);
      return requestFeed(params);
    }
    throw error;
  }
};

const getById = (id) => axiosClient.get(`/notifications/${id}`);

const markRead = (id, isRead = true) =>
  axiosClient.patch(`/notifications/${id}/read`, { isRead });

const markAllRead = () => axiosClient.patch("/notifications/read-all");

const create = (payload) => axiosClient.post("/notifications", payload);

export default {
  getFeed,
  getById,
  markRead,
  markAllRead,
  create,
  safeNumber,
};
