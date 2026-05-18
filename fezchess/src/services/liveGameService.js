/**
 * Task: API ván cờ live giữa thành viên
 * Tác giả: DucManh-BlueOC
 */
import axiosClient from "../api/axiosClient";

const liveGameService = {
  create: () => axiosClient.post("/live-games", {}),
  getByCode: (code) => axiosClient.get(`/live-games/${String(code).toUpperCase()}`),
  join: (code) =>
    axiosClient.post(`/live-games/${String(code).toUpperCase()}/join`, {}),
  resign: (code) =>
    axiosClient.post(`/live-games/${String(code).toUpperCase()}/resign`, {}),
};

export default liveGameService;
