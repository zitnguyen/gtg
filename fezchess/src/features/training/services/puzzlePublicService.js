/**
 * Task: Câu đố daily từ API công khai Lichess (proxy backend)
 * Tác giả: DucManh-BlueOC
 */
import axiosClient from "../../../api/axiosClient";

export const fetchLichessDailyPuzzle = () =>
  axiosClient.get("/public/puzzles/daily");
