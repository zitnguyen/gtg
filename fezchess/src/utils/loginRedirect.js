import { getDashboardPathByRole } from "../constants/roleRoutes";

const BLOCKED_PREFIXES = ["/login", "/signup"];

/** Đường dẫn nội bộ an toàn để quay lại sau đăng nhập */
export function isSafeReturnPath(path) {
  if (!path || typeof path !== "string") return false;
  const normalized = path.trim();
  if (!normalized.startsWith("/") || normalized.startsWith("//")) return false;
  return !BLOCKED_PREFIXES.some((prefix) =>
    normalized === prefix || normalized.startsWith(`${prefix}/`),
  );
}

/** pathname + search + hash từ react-router location */
export function pathFromLocation(location) {
  if (!location?.pathname) return null;
  return `${location.pathname}${location.search || ""}${location.hash || ""}`;
}

/** Đọc `from` trong location.state (Location object hoặc chuỗi path) */
export function getReturnPath(navigationState) {
  if (!navigationState) return null;
  const from = navigationState.from ?? navigationState;
  if (typeof from === "string") {
    return isSafeReturnPath(from) ? from : null;
  }
  if (from && typeof from === "object") {
    const built = pathFromLocation(from);
    return isSafeReturnPath(built) ? built : null;
  }
  return null;
}

/** State truyền khi đi tới /login — giữ trang hiện tại */
export function loginNavigationState(location) {
  return { from: location };
}

/** Đích sau đăng nhập thành công */
export function resolvePostLoginPath(navigationState, role) {
  return getReturnPath(navigationState) || getDashboardPathByRole(role) || "/";
}
