import axiosClient from "../api/axiosClient";

/** Khớp `GET /api/lichess/account` (Admin). */
const lichessService = {
  getAccount: () => axiosClient.get("/lichess/account"),
};

export default lichessService;
