const mongoose = require("mongoose");

/**
 * AuditLog — ghi nhận mọi hành động phá huỷ hoặc thay đổi tiền/quyền.
 *
 * KHÔNG ghi log cho mọi GET. Chỉ ghi cho:
 *   - mutation tài chính (order, refund, payment, payroll)
 *   - mutation lifecycle (transfer, cancel, makeup, substitute)
 *   - thay đổi quyền (role change, course access)
 *   - thao tác xoá / soft-delete
 */
const auditLogSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    actorRole: { type: String },
    action: { type: String, required: true, index: true },
    entity: { type: String, required: true },
    entityId: { type: String },
    before: { type: mongoose.Schema.Types.Mixed },
    after: { type: mongoose.Schema.Types.Mixed },
    metadata: { type: mongoose.Schema.Types.Mixed },
    ip: { type: String },
    userAgent: { type: String },
    requestId: { type: String, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

auditLogSchema.index({ entity: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ actorId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
