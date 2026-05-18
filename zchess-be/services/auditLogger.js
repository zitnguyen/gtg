const AuditLog = require("../models/AuditLog");

/**
 * logAction — ghi nhật ký vận hành. Không bao giờ throw; nếu fail chỉ console.error.
 *
 * Sử dụng:
 *   await logAction({
 *     req,
 *     action: "enrollment.transfer",
 *     entity: "Enrollment",
 *     entityId: enrollment._id,
 *     before: {...},
 *     after: {...},
 *     metadata: { fromClassId, toClassId },
 *   });
 */
const logAction = async ({
  req,
  actor,
  action,
  entity,
  entityId,
  before,
  after,
  metadata,
}) => {
  try {
    const user = actor || req?.user || null;
    const payload = {
      actorId: user?._id || null,
      actorRole: user?.role || null,
      action,
      entity,
      entityId: entityId ? String(entityId) : undefined,
      before: before ?? undefined,
      after: after ?? undefined,
      metadata: metadata ?? undefined,
      ip: req?.ip,
      userAgent: req?.headers?.["user-agent"],
      requestId: req?.id,
    };
    await AuditLog.create(payload);
  } catch (err) {
    console.error(
      JSON.stringify({
        level: "error",
        msg: "audit_log_failed",
        action,
        entity,
        error: err?.message,
      }),
    );
  }
};

module.exports = { logAction };
