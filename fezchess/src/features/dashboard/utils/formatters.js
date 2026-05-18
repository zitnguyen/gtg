const numberFormatter = new Intl.NumberFormat("vi-VN");
const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

export const formatNumber = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "0";
  return numberFormatter.format(num);
};

export const formatCompactCurrency = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num === 0) return "0";
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return numberFormatter.format(num);
};

export const formatCurrency = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return currencyFormatter.format(0);
  return currencyFormatter.format(num);
};

export const formatPercent = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "0%";
  return `${num.toFixed(0)}%`;
};

export const formatDateShort = (input) => {
  if (!input) return "--";
  try {
    return new Date(input).toLocaleDateString("vi-VN");
  } catch {
    return "--";
  }
};

export const formatTrend = (change) => {
  if (change == null) return { label: "0%", tone: "neutral" };
  if (typeof change === "string") {
    if (change.includes("-"))
      return { label: change, tone: "decrease" };
    if (change === "0%" || change === "+0%")
      return { label: change, tone: "neutral" };
    return { label: change, tone: "increase" };
  }
  const num = Number(change);
  if (!Number.isFinite(num)) return { label: "0%", tone: "neutral" };
  if (num > 0) return { label: `+${num.toFixed(0)}%`, tone: "increase" };
  if (num < 0) return { label: `${num.toFixed(0)}%`, tone: "decrease" };
  return { label: "0%", tone: "neutral" };
};

export const safeArray = (value) => (Array.isArray(value) ? value : []);
