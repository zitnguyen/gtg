const Revenue = require("../models/Revenue");
const Expense = require("../models/Expense");
const Enrollment = require("../models/Enrollment");
const Student = require("../models/Student");
const Order = require("../models/Order");
const FinancialReport = require("../models/FinancialReport");
const {
  buildFinanceReport,
  buildExcelWorkbook,
} = require("../services/financeReportService");
const asyncHandler = require("../middleware/asyncHandler");

const persistFinancialReport = async (report, userId) => {
  const payload = {
    period: report.period,
    startDate: report.startDate,
    endDate: report.endDate,
    totalRevenue: report.totalRevenue,
    totalExpense: report.totalExpense,
    netProfit: report.netProfit,
    revenueBreakdown: report.revenueBreakdown,
    expenseBreakdown: report.expenseBreakdown,
    revenueIds: report.revenueIds,
    expenseIds: report.expenseIds,
    generatedBy: userId || null,
  };

  return FinancialReport.findOneAndUpdate(
    { "period.year": report.period.year, "period.month": report.period.month },
    payload,
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
};

const getMonthRange = (date = new Date()) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const getStatsByRange = async (start, end) => {
  const revenueDocs = await Revenue.find({
    date: { $gte: start, $lte: end },
  });
  const totalRevenueAmount = revenueDocs.reduce((acc, curr) => acc + curr.amount, 0);

  const paidEnrollments = await Enrollment.find({
    paymentStatus: "paid",
    enrollmentDate: { $gte: start, $lte: end },
  });
  const totalTuition = paidEnrollments.reduce(
    (acc, curr) => acc + (curr.feeAmount || 0),
    0,
  );

  const completedOrders = await Order.find({
    status: "completed",
    $or: [
      { paidAt: { $gte: start, $lte: end } },
      { paidAt: null, createdAt: { $gte: start, $lte: end } },
    ],
  });
  const totalCourseRevenue = completedOrders.reduce(
    (acc, curr) => acc + (curr.totalAmount || 0),
    0,
  );

  const totalIncome = totalRevenueAmount + totalTuition + totalCourseRevenue;

  const expenseDocs = await Expense.find({
    date: { $gte: start, $lte: end },
  });
  const totalExpense = expenseDocs.reduce((acc, curr) => acc + curr.amount, 0);

  const netProfit = totalIncome - totalExpense;

  return { totalIncome, totalExpense, netProfit, totalCourseRevenue };
};

const calculateGrowth = (current, previous) => {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 100);
};

exports.getFinanceStats = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  let targetDate = new Date();

  if (month && year) {
    targetDate = new Date(Number(year), Number(month) - 1, 1);
  }

  const { start, end } = getMonthRange(targetDate);

  const prevDate = new Date(targetDate);
  prevDate.setMonth(prevDate.getMonth() - 1);
  const { start: prevStart, end: prevEnd } = getMonthRange(prevDate);

  const [currentStats, prevStats] = await Promise.all([
    getStatsByRange(start, end),
    getStatsByRange(prevStart, prevEnd),
  ]);

  const incomeGrowth = calculateGrowth(
    currentStats.totalIncome,
    prevStats.totalIncome,
  );
  const expenseGrowth = calculateGrowth(
    currentStats.totalExpense,
    prevStats.totalExpense,
  );
  const profitGrowth = calculateGrowth(
    currentStats.netProfit,
    prevStats.netProfit,
  );
  const courseRevenueGrowth = calculateGrowth(
    currentStats.totalCourseRevenue,
    prevStats.totalCourseRevenue,
  );

  res.json({
    success: true,
    data: [
      {
        label: "Doanh Thu Tháng",
        value: currentStats.totalIncome,
        change: `${incomeGrowth > 0 ? "+" : ""}${incomeGrowth}%`,
        sub: "so với tháng trước",
        trend: incomeGrowth >= 0 ? "up" : "down",
      },
      {
        label: "Chi Phí Vận Hành",
        value: currentStats.totalExpense,
        change: `${expenseGrowth > 0 ? "+" : ""}${expenseGrowth}%`,
        sub: "trong tháng này",
        trend: expenseGrowth >= 0 ? "up" : "down",
      },
      {
        label: "Lợi Nhuận Ròng",
        value: currentStats.netProfit,
        change: `${profitGrowth > 0 ? "+" : ""}${profitGrowth}%`,
        sub: "mục tiêu đạt",
        trend: profitGrowth >= 0 ? "up" : "down",
      },
      {
        label: "Doanh thu khóa học",
        value: currentStats.totalCourseRevenue,
        change: `${courseRevenueGrowth > 0 ? "+" : ""}${courseRevenueGrowth}%`,
        sub: "đơn đã duyệt",
        trend: courseRevenueGrowth >= 0 ? "up" : "down",
      },
    ],
  });
});

exports.getFinanceChartData = asyncHandler(async (req, res) => {
  const { month, year } = req.query;

  let anchorDate = new Date();
  if (month && year) {
    anchorDate = new Date(Number(year), Number(month), 0);
  }

  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(anchorDate.getFullYear(), anchorDate.getMonth() - i, 1);
    months.push({
      name: `T${d.getMonth() + 1}`,
      month: d.getMonth(),
      year: d.getFullYear(),
    });
  }

  const data = await Promise.all(
    months.map(async (m) => {
      const start = new Date(m.year, m.month, 1);
      const end = new Date(m.year, m.month + 1, 0);
      end.setHours(23, 59, 59, 999);

      const revs = await Revenue.find({ date: { $gte: start, $lte: end } });
      const exps = await Expense.find({ date: { $gte: start, $lte: end } });
      const enrs = await Enrollment.find({
        paymentStatus: "paid",
        enrollmentDate: { $gte: start, $lte: end },
      });
      const orders = await Order.find({
        status: "completed",
        $or: [
          { paidAt: { $gte: start, $lte: end } },
          { paidAt: null, createdAt: { $gte: start, $lte: end } },
        ],
      });

      const income =
        revs.reduce((a, b) => a + b.amount, 0) +
        enrs.reduce((a, b) => a + (b.feeAmount || 0), 0) +
        orders.reduce((a, b) => a + (b.totalAmount || 0), 0);
      const expense = exps.reduce((a, b) => a + b.amount, 0);

      return {
        name: m.name,
        income: income / 1000000,
        expense: expense / 1000000,
      };
    }),
  );

  res.json({ success: true, data });
});

exports.getCostStructure = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  let targetDate = new Date();
  if (month && year) {
    targetDate = new Date(Number(year), Number(month) - 1, 1);
  }
  const { start, end } = getMonthRange(targetDate);

  const expenses = await Expense.find({ date: { $gte: start, $lte: end } });

  const categoryMap = {};
  let total = 0;

  expenses.forEach((e) => {
    const cat = e.category || "Khác";
    categoryMap[cat] = (categoryMap[cat] || 0) + e.amount;
    total += e.amount;
  });

  const data = Object.keys(categoryMap).map((key) => ({
    label: key,
    value: categoryMap[key],
    percent: total ? Math.round((categoryMap[key] / total) * 100) : 0,
    color: "#64748B",
  }));

  res.json({ success: true, data });
});

exports.getTransactions = asyncHandler(async (req, res) => {
  const { month, year } = req.query;

  let revenues;
  let expenses;
  let enrollments;
  let completedOrders;

  if (month && year) {
    const targetDate = new Date(Number(year), Number(month) - 1, 1);
    const { start, end } = getMonthRange(targetDate);

    revenues = await Revenue.find({ date: { $gte: start, $lte: end } }).sort({
      date: -1,
    });
    expenses = await Expense.find({ date: { $gte: start, $lte: end } }).sort({
      date: -1,
    });
    enrollments = await Enrollment.find({
      paymentStatus: "paid",
      enrollmentDate: { $gte: start, $lte: end },
    })
      .populate("studentId", "fullName")
      .sort({ enrollmentDate: -1 });
    completedOrders = await Order.find({
      status: "completed",
      $or: [
        { paidAt: { $gte: start, $lte: end } },
        { paidAt: null, createdAt: { $gte: start, $lte: end } },
      ],
    })
      .populate("userId", "fullName")
      .populate("items.courseId", "title")
      .sort({ paidAt: -1, createdAt: -1 });
  } else {
    revenues = await Revenue.find().sort({ date: -1 }).limit(20);
    expenses = await Expense.find().sort({ date: -1 }).limit(20);
    enrollments = await Enrollment.find({ paymentStatus: "paid" })
      .populate("studentId", "fullName")
      .sort({ enrollmentDate: -1 })
      .limit(20);
    completedOrders = await Order.find({ status: "completed" })
      .populate("userId", "fullName")
      .populate("items.courseId", "title")
      .sort({ paidAt: -1, createdAt: -1 })
      .limit(20);
  }

  const normalizedRevenues = revenues.map((r) => ({
    id: `REV-${r.revenueId}`,
    content: r.source || "Thu nhập khác",
    sub: r.description,
    type: "income",
    date: r.date,
    amount: r.amount,
    status: "completed",
  }));

  const normalizedExpenses = expenses.map((e) => ({
    id: `EXP-${e.expenseId}`,
    content: e.category,
    sub: e.description,
    type: "expense",
    date: e.date,
    amount: e.amount,
    status: "completed",
  }));

  const normalizedEnrollments = enrollments.map((e) => ({
    id: `ENR-${e.enrollmentId}`,
    content: `Thu học phí - ${e.studentId?.fullName || "Học viên"}`,
    sub: "Học phí",
    type: "income",
    date: e.enrollmentDate,
    amount: e.feeAmount,
    status: "completed",
  }));

  const normalizedCourseOrders = completedOrders.map((o) => ({
    id: `ORD-${String(o._id).slice(-6).toUpperCase()}`,
    content: `Thu khóa học - ${o.userId?.fullName || "Học viên"}`,
    sub:
      o.items?.map((item) => item?.courseId?.title).filter(Boolean).join(", ") ||
      "Khóa học",
    type: "income",
    date: o.paidAt || o.createdAt,
    amount: o.totalAmount || 0,
    status: "completed",
  }));

  let all = [
    ...normalizedRevenues,
    ...normalizedExpenses,
    ...normalizedEnrollments,
    ...normalizedCourseOrders,
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (!month && !year) {
    all = all.slice(0, 20);
  }

  res.json({ success: true, data: all });
});

exports.getFinanceReport = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const report = await buildFinanceReport(month, year);
  const saved = await persistFinancialReport(report, req.user?._id);

  res.json({
    success: true,
    data: {
      ...report,
      _id: saved?._id,
      createdAt: saved?.createdAt,
      updatedAt: saved?.updatedAt,
    },
  });
});

exports.exportFinanceReport = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const report = await buildFinanceReport(month, year);
  await persistFinancialReport(report, req.user?._id);

  const workbook = await buildExcelWorkbook(report);
  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `BaoCaoTaiChinh_${report.period.year}_${String(report.period.month).padStart(2, "0")}.xlsx`;

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}"`,
  );
  return res.send(Buffer.from(buffer));
});

exports.createTransaction = asyncHandler(async (req, res) => {
  const { type, amount, description, category, date, source } = req.body;

  if (!amount || !type) {
    return res
      .status(400)
      .json({ success: false, message: "Loại và số tiền là bắt buộc" });
  }

  if (type === "income") {
    const lastRevenue = await Revenue.findOne().sort({ revenueId: -1 });
    const newId = lastRevenue ? lastRevenue.revenueId + 1 : 1;

    const newRevenue = new Revenue({
      revenueId: newId,
      source: source || "Thu nhập khác",
      amount: Number(amount),
      description,
      date: date || new Date(),
    });
    await newRevenue.save();
    return res.json({
      success: true,
      data: newRevenue,
      message: "Đã thêm doanh thu",
    });
  }

  if (type === "expense") {
    const lastExpense = await Expense.findOne().sort({ expenseId: -1 });
    const newId = lastExpense ? lastExpense.expenseId + 1 : 1;

    const newExpense = new Expense({
      expenseId: newId,
      category: category || "Chi phí khác",
      amount: Number(amount),
      description,
      date: date || new Date(),
    });
    await newExpense.save();
    return res.json({
      success: true,
      data: newExpense,
      message: "Đã thêm chi phí",
    });
  }

  return res
    .status(400)
    .json({ success: false, message: "Loại giao dịch không hợp lệ" });
});

exports.updateTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount, description, category, date, source } = req.body;

  const [typePrefix, numericId] = id.split("-");

  if (!typePrefix || !numericId) {
    return res
      .status(400)
      .json({ success: false, message: "Định dạng ID không hợp lệ" });
  }

  let updatedDoc;

  if (typePrefix === "REV") {
    updatedDoc = await Revenue.findOneAndUpdate(
      { revenueId: Number(numericId) },
      {
        amount: Number(amount),
        description,
        source,
        date: date,
      },
      { new: true },
    );
  } else if (typePrefix === "EXP") {
    updatedDoc = await Expense.findOneAndUpdate(
      { expenseId: Number(numericId) },
      {
        amount: Number(amount),
        description,
        category,
        date: date,
      },
      { new: true },
    );
  } else if (typePrefix === "ENR") {
    return res.status(400).json({
      success: false,
      message:
        "Không thể chỉnh sửa học phí tại đây. Vui lòng vào quản lý học viên.",
    });
  } else {
    return res
      .status(400)
      .json({ success: false, message: "Loại giao dịch không xác định" });
  }

  if (!updatedDoc) {
    return res
      .status(404)
      .json({ success: false, message: "Không tìm thấy giao dịch" });
  }

  res.json({
    success: true,
    message: "Cập nhật thành công",
    data: updatedDoc,
  });
});

exports.deleteTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [typePrefix, numericId] = id.split("-");

  if (!typePrefix || !numericId) {
    return res
      .status(400)
      .json({ success: false, message: "Định dạng ID không hợp lệ" });
  }

  let deletedDoc;

  if (typePrefix === "REV") {
    deletedDoc = await Revenue.findOneAndDelete({
      revenueId: Number(numericId),
    });
  } else if (typePrefix === "EXP") {
    deletedDoc = await Expense.findOneAndDelete({
      expenseId: Number(numericId),
    });
  } else if (typePrefix === "ENR") {
    return res.status(400).json({
      success: false,
      message: "Không thể xóa học phí tại đây.",
    });
  } else if (typePrefix === "ORD") {
    const suffix = String(numericId || "").toUpperCase();
    const completedOrders = await Order.find({ status: "completed" }).select("_id");
    const order = completedOrders.find(
      (item) => String(item._id).slice(-6).toUpperCase() === suffix,
    );
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy giao dịch đơn hàng khóa học",
      });
    }
    await Order.findByIdAndDelete(order._id);
    return res.json({ success: true, message: "Xóa giao dịch khóa học thành công" });
  } else {
    return res.status(400).json({
      success: false,
      message: "Loại giao dịch không hợp lệ.",
    });
  }

  if (!deletedDoc) {
    return res
      .status(404)
      .json({ success: false, message: "Không tìm thấy giao dịch" });
  }

  res.json({ success: true, message: "Xóa thành công" });
});

/**
 * payTuition — chấp nhận partial.
 * body: { enrollmentId, amount?, method?, transactionId?, note? }
 *   - amount missing → đóng đủ phần còn nợ
 *   - amount > 0     → đóng đúng số đó (không vượt quá nợ)
 */
exports.payTuition = asyncHandler(async (req, res) => {
  const { enrollmentId, amount, method, transactionId, note } = req.body;

  const enrollment = await Enrollment.findOne({
    $or: [{ enrollmentId }, { _id: enrollmentId }],
  });

  if (!enrollment) {
    return res
      .status(404)
      .json({ success: false, message: "Không tìm thấy ghi danh" });
  }

  if (enrollment.paymentStatus === "paid") {
    return res
      .status(400)
      .json({ success: false, message: "Học phí đã được thanh toán" });
  }

  const fee = Number(enrollment.feeAmount || 0);
  const alreadyPaid = Number(enrollment.paidAmount || 0);
  const remainingDebt = Math.max(fee - alreadyPaid, 0);
  if (remainingDebt <= 0) {
    enrollment.paymentStatus = "paid";
    await enrollment.save();
    return res.status(400).json({
      success: false,
      message: "Học phí đã đủ.",
    });
  }

  const requested = Number(amount);
  const payAmount =
    Number.isFinite(requested) && requested > 0
      ? Math.min(requested, remainingDebt)
      : remainingDebt;

  enrollment.paidAmount = alreadyPaid + payAmount;
  enrollment.lastPaidAt = new Date();
  enrollment.paymentHistory.push({
    amount: payAmount,
    paidAt: new Date(),
    method: method || "cash",
    transactionId: transactionId || "",
    recordedBy: req.user?._id,
    note: note || "",
  });
  enrollment.recomputePaymentStatus();
  await enrollment.save();

  // Ghi Revenue tương ứng
  const lastRevenue = await Revenue.findOne().sort({ revenueId: -1 });
  const newRevenueId = lastRevenue ? lastRevenue.revenueId + 1 : 1;
  const student = await Student.findById(enrollment.studentId);
  const studentName = student ? student.fullName : "Học viên";

  const newRevenue = new Revenue({
    revenueId: newRevenueId,
    source: "Học phí",
    amount: payAmount,
    description: `Thu học phí ${enrollment.paymentStatus === "paid" ? "(đủ)" : "(một phần)"} - ${studentName} - Mã GH: ${enrollment.enrollmentId || enrollment._id}`,
    date: new Date(),
  });
  await newRevenue.save();

  res.json({
    success: true,
    message: "Thanh toán thành công",
    data: {
      enrollment,
      revenue: newRevenue,
      payAmount,
      remainingDebt: Math.max(fee - enrollment.paidAmount, 0),
    },
  });
});

/**
 * getTuitionDebts — báo cáo công nợ học phí theo enrollment.
 * query: ?ageing=30,60,90&status=overdue|partial|unpaid|all&parentId=...
 */
exports.getTuitionDebts = asyncHandler(async (req, res) => {
  const ageingBuckets = String(req.query.ageing || "30,60,90")
    .split(",")
    .map((s) => parseInt(s, 10))
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b);

  const status = String(req.query.status || "all").toLowerCase();
  const filter = {
    status: { $in: ["Active", "Reserved"] },
    paymentStatus: { $in: ["unpaid", "partial"] },
  };
  if (status === "partial") filter.paymentStatus = "partial";
  if (status === "unpaid") filter.paymentStatus = "unpaid";

  const enrollments = await Enrollment.find(filter)
    .populate({
      path: "studentId",
      select: "fullName studentId parentId",
      populate: { path: "parentId", select: "fullName phone email" },
    })
    .populate("classId", "className fee")
    .lean();

  const now = Date.now();
  const items = enrollments
    .map((e) => {
      const fee = Number(e.feeAmount || 0);
      const paid = Number(e.paidAmount || 0);
      const debt = Math.max(fee - paid, 0);
      if (debt <= 0) return null;
      const dueDate = e.paymentDueDate
        ? new Date(e.paymentDueDate)
        : new Date(new Date(e.enrollmentDate).getTime() + 7 * 24 * 60 * 60 * 1000);
      const overdueDays = Math.max(
        0,
        Math.floor((now - dueDate.getTime()) / (24 * 60 * 60 * 1000)),
      );
      return {
        enrollmentId: e._id,
        enrollmentCode: e.enrollmentId,
        studentId: e.studentId?._id,
        studentName: e.studentId?.fullName,
        parentName: e.studentId?.parentId?.fullName,
        parentPhone: e.studentId?.parentId?.phone,
        classId: e.classId?._id,
        className: e.classId?.className,
        feeAmount: fee,
        paidAmount: paid,
        debt,
        paymentStatus: e.paymentStatus,
        paymentDueDate: dueDate,
        overdueDays,
      };
    })
    .filter(Boolean);

  // Filter overdue
  const filtered = status === "overdue" ? items.filter((i) => i.overdueDays > 0) : items;

  // Buckets
  const buckets = {};
  let totalDebt = 0;
  ageingBuckets.forEach((days) => {
    buckets[`<=${days}d`] = { count: 0, debt: 0 };
  });
  buckets[`>${ageingBuckets[ageingBuckets.length - 1] || 90}d`] = {
    count: 0,
    debt: 0,
  };

  filtered.forEach((item) => {
    totalDebt += item.debt;
    let placed = false;
    for (const days of ageingBuckets) {
      if (item.overdueDays <= days) {
        buckets[`<=${days}d`].count += 1;
        buckets[`<=${days}d`].debt += item.debt;
        placed = true;
        break;
      }
    }
    if (!placed) {
      const lastKey = `>${ageingBuckets[ageingBuckets.length - 1] || 90}d`;
      buckets[lastKey].count += 1;
      buckets[lastKey].debt += item.debt;
    }
  });

  res.json({
    success: true,
    summary: {
      totalEnrollmentsWithDebt: filtered.length,
      totalDebt,
      buckets,
    },
    items: filtered.sort((a, b) => b.overdueDays - a.overdueDays),
  });
});
