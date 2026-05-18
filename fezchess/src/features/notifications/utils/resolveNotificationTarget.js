const resolveExplicitPath = (item) =>
  item?.targetPath ||
  item?.redirectPath ||
  item?.path ||
  item?.href ||
  item?.url ||
  item?.targetUrl ||
  item?.link ||
  item?.actionUrl ||
  item?.metadata?.path ||
  item?.meta?.path ||
  null;

export const resolveNotificationTarget = (item, { role, basePath, courseSlugByTitle = {} } = {}) => {
  const explicit = resolveExplicitPath(item);
  if (explicit && typeof explicit === "string") return explicit;

  const title = String(item?.title || "").toLowerCase();
  const content = String(item?.content || item?.message || "").toLowerCase();
  const originalContent = String(item?.content || item?.message || "");
  const lowerRole = String(role || "").toLowerCase();

  if (title.includes("đơn hàng khóa học")) {
    if (lowerRole === "admin") return "/finance";
    if (lowerRole === "parent") return "/courses";
  }

  if (
    lowerRole === "parent" &&
    (content.includes("đã được admin duyệt") ||
      content.includes("vào học ngay") ||
      title.includes("đã được duyệt"))
  ) {
    const coursePart = originalContent.includes(":")
      ? originalContent.split(":").slice(1).join(":")
      : "";
    const firstCourseTitle = String(coursePart || "")
      .split(",")[0]
      .replace(/\.$/, "")
      .trim()
      .toLowerCase();
    const matchedSlug = firstCourseTitle
      ? courseSlugByTitle?.[firstCourseTitle]
      : "";
    if (matchedSlug) return `/courses/${matchedSlug}`;
    return "/courses";
  }

  if (title.includes("tin tức") || content.includes("tin tức")) return "/news";
  if (title.includes("liên hệ") || content.includes("liên hệ")) {
    if (lowerRole === "admin") return "/crm/inquiries";
    return "/contact";
  }

  const defaultBase = basePath || `/${lowerRole}/notifications` || "/notifications";
  return `${defaultBase}/${item?.id || item?._id || ""}`;
};

export const getRoleNotificationPath = (role) => {
  const lowerRole = String(role || "").toLowerCase();
  if (lowerRole === "admin") return "/admin/notifications";
  if (lowerRole === "teacher") return "/teacher/notifications";
  if (lowerRole === "parent") return "/parent/notifications";
  if (lowerRole === "student") return "/student/notifications";
  return "/";
};
