import axiosClient from "../api/axiosClient";

const scheduleService = {
  // Trả về [] khi backend trả null/object, nhưng GIỮ NGUYÊN lỗi mạng/quyền/server
  // để UI có thể hiển thị state lỗi thay vì hiện "không có lịch".
  async getAll() {
    const data = await axiosClient.get("/schedules");
    return Array.isArray(data) ? data : [];
  },
};

export default scheduleService;
