import { getDashboardPathByRole } from "../constants/roleRoutes";

function normalizePath(pathname) {
  const path = String(pathname || "/").split("?")[0].split("#")[0];
  if (path === "/") return "/";
  return path.replace(/\/+$/, "") || "/";
}

/**
 * Nút Home: đang ở dashboard → "/"; đang ở "/" → dashboard; trang khác → dashboard.
 */
export function getHomeTogglePath(pathname, role) {
  const dashboardPath = getDashboardPathByRole(role) || "/dashboard";
  const current = normalizePath(pathname);
  const dashboard = normalizePath(dashboardPath);

  if (current === "/") return dashboardPath;
  if (current === dashboard) return "/";
  return dashboardPath;
}

export function getHomeToggleLabel(pathname, role) {
  const target = getHomeTogglePath(pathname, role);
  return normalizePath(target) === "/" ? "Về trang chủ" : "Về dashboard";
}
