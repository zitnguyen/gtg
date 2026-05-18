const MONEY_FIELDS = [
  "salary",
  "deductionAmount",
  "bonusAmount",
  "otherCostAmount",
];

const toMinutes = (value) => {
  const [h, m] = String(value || "")
    .split(":")
    .map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

const computeDurationHours = (startTime, endTime) => {
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  if (start == null || end == null || end <= start) return null;
  return Number(((end - start) / 60).toFixed(2));
};

const toNumber = (value, fallback = 0) => {
  const num = Number(value ?? fallback);
  return Number.isFinite(num) ? num : fallback;
};

const normalizeOptionalSalary = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : NaN;
};

const computeNetSalary = ({
  salary = 0,
  bonusAmount = 0,
  deductionAmount = 0,
  otherCostAmount = 0,
} = {}) =>
  toNumber(salary) +
  toNumber(bonusAmount) -
  toNumber(deductionAmount) -
  toNumber(otherCostAmount);

const computePayrollTotals = (sessions = []) => {
  const totals = sessions.reduce(
    (acc, item) => {
      const hasSalary = item.salary !== null && item.salary !== undefined;
      acc.totalSessions += 1;
      acc.totalHours += toNumber(item.durationHours);
      acc.totalSalary += hasSalary ? toNumber(item.salary) : 0;
      acc.totalDeductions += toNumber(item.deductionAmount);
      acc.totalBonuses += toNumber(item.bonusAmount);
      acc.totalOtherCosts += toNumber(item.otherCostAmount);
      if (!hasSalary) acc.sessionsWithoutSalary += 1;
      return acc;
    },
    {
      totalSessions: 0,
      totalHours: 0,
      totalSalary: 0,
      totalDeductions: 0,
      totalBonuses: 0,
      totalOtherCosts: 0,
      sessionsWithoutSalary: 0,
    },
  );

  totals.totalHours = Number(totals.totalHours.toFixed(2));
  totals.totalNetSalary = computeNetSalary(totals);
  return totals;
};

const normalizeCompensationPayload = (payload = {}, fallback = {}) => {
  const salaryRaw = Object.prototype.hasOwnProperty.call(payload, "salary")
    ? payload.salary
    : fallback.salary;
  const normalized = {
    salary: normalizeOptionalSalary(salaryRaw),
    deductionAmount: toNumber(
      Object.prototype.hasOwnProperty.call(payload, "deductionAmount")
        ? payload.deductionAmount
        : fallback.deductionAmount,
    ),
    deductionNote: Object.prototype.hasOwnProperty.call(payload, "deductionNote")
      ? String(payload.deductionNote || "").trim()
      : String(fallback.deductionNote || "").trim(),
    bonusAmount: toNumber(
      Object.prototype.hasOwnProperty.call(payload, "bonusAmount")
        ? payload.bonusAmount
        : fallback.bonusAmount,
    ),
    bonusNote: Object.prototype.hasOwnProperty.call(payload, "bonusNote")
      ? String(payload.bonusNote || "").trim()
      : String(fallback.bonusNote || "").trim(),
    otherCostAmount: toNumber(
      Object.prototype.hasOwnProperty.call(payload, "otherCostAmount")
        ? payload.otherCostAmount
        : fallback.otherCostAmount,
    ),
    otherCostNote: Object.prototype.hasOwnProperty.call(
      payload,
      "otherCostNote",
    )
      ? String(payload.otherCostNote || "").trim()
      : String(fallback.otherCostNote || "").trim(),
  };

  return normalized;
};

const sanitizeMoneyFields = (payload = {}) => {
  const next = { ...payload };
  MONEY_FIELDS.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(next, field)) {
      next[field] =
        field === "salary"
          ? normalizeOptionalSalary(next[field])
          : toNumber(next[field]);
    }
  });
  return next;
};

module.exports = {
  computeDurationHours,
  computeNetSalary,
  computePayrollTotals,
  normalizeCompensationPayload,
  normalizeOptionalSalary,
  sanitizeMoneyFields,
  toNumber,
};
