const parseMonthYear = (month, year) => {
  const m = Number(month);
  const y = Number(year);
  if (!Number.isInteger(m) || m < 1 || m > 12) return null;
  if (!Number.isInteger(y) || y < 2000 || y > 3000) return null;
  return { m, y };
};

const assertNonNegativeNumber = (value, message) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) {
    const err = new Error(message);
    err.statusCode = 400;
    throw err;
  }
  return num;
};

const validateCompensation = (payload = {}) => {
  if (
    payload.salary !== null &&
    payload.salary !== undefined &&
    (!Number.isFinite(Number(payload.salary)) || Number(payload.salary) < 0)
  ) {
    const err = new Error("Salary không hợp lệ");
    err.statusCode = 400;
    throw err;
  }
  assertNonNegativeNumber(payload.deductionAmount || 0, "Phạt/phí không hợp lệ");
  assertNonNegativeNumber(payload.bonusAmount || 0, "Thưởng không hợp lệ");
  assertNonNegativeNumber(payload.otherCostAmount || 0, "Chi phí khác không hợp lệ");
};

const requireFields = (payload = {}, fields = [], message) => {
  const missing = fields.some((field) => !payload[field]);
  if (missing) {
    const err = new Error(message);
    err.statusCode = 400;
    throw err;
  }
};

module.exports = {
  assertNonNegativeNumber,
  parseMonthYear,
  requireFields,
  validateCompensation,
};
