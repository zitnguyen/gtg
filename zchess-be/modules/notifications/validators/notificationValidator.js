const { TARGETABLE_ROLES } = require("../repositories/userTargetRepository");

const buildHttpError = (status, message) => {
  const error = new Error(message);
  error.statusCode = status;
  return error;
};

const normalizeRoles = (targetRoles) => {
  if (!Array.isArray(targetRoles) || targetRoles.length === 0) {
    return [...TARGETABLE_ROLES];
  }
  const normalized = targetRoles
    .map((role) => String(role || "").trim())
    .filter(Boolean)
    .map((role) => {
      if (role.toLowerCase() === "all") return "ALL";
      return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
    });
  if (normalized.includes("ALL")) return [...TARGETABLE_ROLES];
  return [...new Set(normalized)].filter((role) =>
    TARGETABLE_ROLES.includes(role),
  );
};

const validateCreatePayload = (payload = {}) => {
  const title = String(payload.title || "").trim();
  const content = String(payload.content || "").trim();
  if (!title || !content) {
    throw buildHttpError(400, "Thiếu title hoặc content");
  }

  const roles = normalizeRoles(payload.targetRoles);
  if (roles.length === 0) {
    throw buildHttpError(400, "Không có role nhận hợp lệ");
  }

  const userIds = Array.isArray(payload.userIds)
    ? payload.userIds.map((id) => String(id || "").trim()).filter(Boolean)
    : [];

  return {
    title,
    content,
    targetPath: String(payload.targetPath || "").trim(),
    roles,
    userIds,
  };
};

module.exports = {
  buildHttpError,
  normalizeRoles,
  validateCreatePayload,
};
