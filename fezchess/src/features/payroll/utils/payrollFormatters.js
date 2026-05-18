export const formatMoney = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(value) || 0);

export const SALARY_PRESET_VALUES = [
  60000, 80000, 100000, 120000, 140000, 160000, 180000, 200000,
];

export const DEDUCTION_PRESET_VALUES = [
  0, 10000, 20000, 30000, 50000, 80000, 100000,
];

export const buildMonthOptions = () =>
  Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: `Tháng ${i + 1}`,
  }));

export const getTeacherDisplayName = (teacher) =>
  teacher?.fullName || teacher?.username || "Giáo viên";
