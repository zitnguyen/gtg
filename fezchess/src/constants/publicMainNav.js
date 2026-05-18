/** Menu trang công khai — dùng chung Header + top bar portal (AppShell). */
export const PUBLIC_MAIN_NAV_LINKS = [
  { name: "Trang chủ", path: "/" },
  { name: "Tin tức", path: "/news" },
  { name: "Khóa học", path: "/courses" },
  { name: "Giáo viên", path: "/teachers" },
];

export function isPublicMainNavActive(path, pathname) {
  return path === "/"
    ? pathname === "/"
    : pathname === path || pathname.startsWith(`${path}/`);
}
