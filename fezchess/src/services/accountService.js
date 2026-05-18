import axiosClient from "../api/axiosClient";
import authService from "./authService";
import teacherService from "./teacherService";

function persistUser(patch) {
  const prev = authService.getCurrentUser();
  if (!prev) return;
  localStorage.setItem(
    "user",
    JSON.stringify({
      ...prev,
      ...patch,
    }),
  );
}

export async function getMyAccount() {
  const role = authService.getCurrentUser()?.role;
  if (role === "Teacher") {
    return teacherService.getMyProfile();
  }
  return axiosClient.get("/users/me");
}

export async function updateMyAccount(payload) {
  const role = authService.getCurrentUser()?.role;
  let updated;
  if (role === "Teacher") {
    updated = await teacherService.updateMyProfile(payload);
  } else {
    updated = await axiosClient.patch("/users/me", payload);
  }
  persistUser({
    fullName: updated?.fullName,
    phone: updated?.phone,
    avatarUrl: updated?.avatarUrl,
    email: updated?.email,
  });
  return updated;
}

export async function changeMyPassword(payload) {
  const role = authService.getCurrentUser()?.role;
  if (role === "Teacher") {
    return teacherService.changeMyPassword(payload);
  }
  return axiosClient.post("/users/me/change-password", payload);
}
