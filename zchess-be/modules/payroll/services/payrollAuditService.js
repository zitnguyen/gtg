const auditPayrollAction = ({ action, actorId, targetId, metadata = {} }) => {
  if (process.env.PAYROLL_AUDIT_LOGS !== "true") return;
  const payload = {
    scope: "payroll",
    action,
    actorId: actorId ? String(actorId) : null,
    targetId: targetId ? String(targetId) : null,
    metadata,
    at: new Date().toISOString(),
  };
  // Kept as structured stdout for now to avoid introducing a schema migration.
  console.info(JSON.stringify(payload));
};

module.exports = {
  auditPayrollAction,
};
