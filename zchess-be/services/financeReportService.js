const ExcelJS = require("exceljs");
const Revenue = require("../models/Revenue");
const Expense = require("../models/Expense");
const Enrollment = require("../models/Enrollment");
const Order = require("../models/Order");

const getMonthRange = (month, year) => {
  const m = Number(month);
  const y = Number(year);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0, 23, 59, 59, 999);
  return { start, end, month: m, year: y };
};

const resolvePeriod = (month, year) => {
  if (month && year) {
    return getMonthRange(month, year);
  }
  const today = new Date();
  return getMonthRange(today.getMonth() + 1, today.getFullYear());
};

const normalizeExpenseBucket = (category = "") => {
  const raw = String(category || "").toLowerCase();
  if (
    raw.includes("lương") ||
    raw.includes("luong") ||
    raw.includes("salary") ||
    raw.includes("nhân sự") ||
    raw.includes("nhan su")
  ) {
    return "salary";
  }
  if (
    raw.includes("cơ sở") ||
    raw.includes("co so") ||
    raw.includes("facility") ||
    raw.includes("mặt bằng") ||
    raw.includes("mat bang") ||
    raw.includes("điện") ||
    raw.includes("dien") ||
    raw.includes("nước") ||
    raw.includes("nuoc")
  ) {
    return "facility";
  }
  return "other";
};

const EXPENSE_BUCKET_LABEL = {
  salary: "Lương & nhân sự",
  facility: "Cơ sở vật chất",
  other: "Chi phí khác",
};

const REVENUE_BUCKET_LABEL = {
  tuition: "Học phí lớp",
  course_sales: "Bán khóa học",
  other: "Thu nhập khác",
};

const fetchPeriodTransactions = async ({ start, end }) => {
  const [revenues, expenses, enrollments, completedOrders] = await Promise.all([
    Revenue.find({ date: { $gte: start, $lte: end } }).sort({ date: -1 }),
    Expense.find({ date: { $gte: start, $lte: end } }).sort({ date: -1 }),
    Enrollment.find({
      paymentStatus: "paid",
      enrollmentDate: { $gte: start, $lte: end },
    })
      .populate("studentId", "fullName")
      .sort({ enrollmentDate: -1 }),
    Order.find({
      status: "completed",
      $or: [
        { paidAt: { $gte: start, $lte: end } },
        { paidAt: null, createdAt: { $gte: start, $lte: end } },
      ],
    })
      .populate("userId", "fullName")
      .populate("items.courseId", "title")
      .sort({ paidAt: -1, createdAt: -1 }),
  ]);

  return { revenues, expenses, enrollments, completedOrders };
};

const buildDetailRows = ({
  revenues,
  expenses,
  enrollments,
  completedOrders,
}) => {
  const rows = [];

  revenues.forEach((r) => {
    rows.push({
      id: `REV-${r.revenueId}`,
      content: r.source || "Thu nhập",
      description: r.description || "",
      type: "Thu nhập",
      category: REVENUE_BUCKET_LABEL.other,
      date: r.date,
      amount: Number(r.amount) || 0,
      status: "Hoàn thành",
    });
  });

  enrollments.forEach((e) => {
    rows.push({
      id: `ENR-${e.enrollmentId}`,
      content: `Thu học phí - ${e.studentId?.fullName || "Học viên"}`,
      description: "Học phí lớp offline",
      type: "Thu nhập",
      category: REVENUE_BUCKET_LABEL.tuition,
      date: e.enrollmentDate,
      amount: Number(e.feeAmount) || 0,
      status: "Hoàn thành",
    });
  });

  completedOrders.forEach((o) => {
    rows.push({
      id: `ORD-${String(o._id).slice(-6).toUpperCase()}`,
      content: `Thu khóa học - ${o.userId?.fullName || "Học viên"}`,
      description:
        o.items?.map((item) => item?.courseId?.title).filter(Boolean).join(", ") ||
        "Khóa học online",
      type: "Thu nhập",
      category: REVENUE_BUCKET_LABEL.course_sales,
      date: o.paidAt || o.createdAt,
      amount: Number(o.totalAmount) || 0,
      status: "Hoàn thành",
    });
  });

  expenses.forEach((e) => {
    const bucket = normalizeExpenseBucket(e.category);
    rows.push({
      id: `EXP-${e.expenseId}`,
      content: e.category || "Chi phí",
      description: e.description || "",
      type: "Chi phí",
      category: EXPENSE_BUCKET_LABEL[bucket],
      date: e.date,
      amount: Number(e.amount) || 0,
      status: "Hoàn thành",
    });
  });

  return rows.sort((a, b) => new Date(b.date) - new Date(a.date));
};

const sumBreakdown = (buckets, labels) =>
  Object.keys(labels).map((key) => ({
    key,
    label: labels[key],
    amount: Number(buckets[key] || 0),
  }));

const buildFinanceReport = async (month, year) => {
  const period = resolvePeriod(month, year);
  const { revenues, expenses, enrollments, completedOrders } =
    await fetchPeriodTransactions(period);

  const revenueBuckets = { tuition: 0, course_sales: 0, other: 0 };
  const expenseBuckets = { salary: 0, facility: 0, other: 0 };

  revenues.forEach((r) => {
    revenueBuckets.other += Number(r.amount) || 0;
  });

  enrollments.forEach((e) => {
    revenueBuckets.tuition += Number(e.feeAmount) || 0;
  });

  completedOrders.forEach((o) => {
    revenueBuckets.course_sales += Number(o.totalAmount) || 0;
  });

  expenses.forEach((e) => {
    const bucket = normalizeExpenseBucket(e.category);
    expenseBuckets[bucket] += Number(e.amount) || 0;
  });

  const revenueBreakdown = sumBreakdown(revenueBuckets, REVENUE_BUCKET_LABEL);
  const expenseBreakdown = sumBreakdown(expenseBuckets, EXPENSE_BUCKET_LABEL);

  const totalRevenue = revenueBreakdown.reduce((s, i) => s + i.amount, 0);
  const totalExpense = expenseBreakdown.reduce((s, i) => s + i.amount, 0);
  const netProfit = totalRevenue - totalExpense;

  const details = buildDetailRows({
    revenues,
    expenses,
    enrollments,
    completedOrders,
  });

  return {
    period: { month: period.month, year: period.year },
    startDate: period.start,
    endDate: period.end,
    totalRevenue,
    totalExpense,
    netProfit,
    revenueBreakdown,
    expenseBreakdown,
    details,
    revenueIds: revenues.map((r) => r._id),
    expenseIds: expenses.map((e) => e._id),
  };
};

const formatVnd = (value) => Number(value) || 0;

const buildExcelWorkbook = async (report) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Z Chess Finance";
  workbook.created = new Date();

  const summary = workbook.addWorksheet("Tổng hợp");
  summary.columns = [
    { width: 28 },
    { width: 22 },
  ];

  summary.mergeCells("A1:B1");
  summary.getCell("A1").value = `Báo cáo tài chính — Tháng ${report.period.month}/${report.period.year}`;
  summary.getCell("A1").font = { bold: true, size: 14 };

  const summaryRows = [
    ["Kỳ báo cáo", `Tháng ${report.period.month}/${report.period.year}`],
    ["Từ ngày", report.startDate],
    ["Đến ngày", report.endDate],
    [],
    ["Tổng thu", formatVnd(report.totalRevenue)],
    ["Tổng chi", formatVnd(report.totalExpense)],
    ["Lợi nhuận ròng", formatVnd(report.netProfit)],
    [],
    ["— Phân loại thu —", ""],
    ...report.revenueBreakdown.map((item) => [item.label, item.amount]),
    [],
    ["— Phân loại chi —", ""],
    ...report.expenseBreakdown.map((item) => [item.label, item.amount]),
  ];

  summaryRows.forEach((row, index) => {
    const r = summary.getRow(index + 2);
    r.getCell(1).value = row[0] ?? "";
    r.getCell(2).value = row[1] ?? "";
    if (typeof row[1] === "number" && row[1] > 0) {
      r.getCell(2).numFmt = "#,##0";
    }
    if (row[0] === "— Phân loại thu —" || row[0] === "— Phân loại chi —") {
      r.font = { bold: true };
    }
  });

  const detail = workbook.addWorksheet("Chi tiết");
  detail.columns = [
    { header: "Mã GD", key: "id", width: 14 },
    { header: "Nội dung", key: "content", width: 32 },
    { header: "Mô tả", key: "description", width: 36 },
    { header: "Loại", key: "type", width: 12 },
    { header: "Danh mục", key: "category", width: 18 },
    { header: "Ngày", key: "date", width: 14 },
    { header: "Số tiền", key: "amount", width: 16 },
    { header: "Trạng thái", key: "status", width: 14 },
  ];

  const headerRow = detail.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE2E8F0" },
  };

  report.details.forEach((row) => {
    const added = detail.addRow({
      ...row,
      date: row.date ? new Date(row.date) : null,
    });
    added.getCell("amount").numFmt = "#,##0";
    added.getCell("date").numFmt = "dd/mm/yyyy";
  });

  detail.autoFilter = {
    from: "A1",
    to: `H${Math.max(report.details.length + 1, 1)}`,
  };

  return workbook;
};

module.exports = {
  resolvePeriod,
  buildFinanceReport,
  buildExcelWorkbook,
};
