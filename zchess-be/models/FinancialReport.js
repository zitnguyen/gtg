const mongoose = require("mongoose");

const breakdownItemSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    amount: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const financialReportSchema = new mongoose.Schema(
  {
    period: {
      month: { type: Number, required: true, min: 1, max: 12 },
      year: { type: Number, required: true, min: 2000 },
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalRevenue: { type: Number, default: 0 },
    totalExpense: { type: Number, default: 0 },
    netProfit: { type: Number, default: 0 },
    revenueBreakdown: { type: [breakdownItemSchema], default: [] },
    expenseBreakdown: { type: [breakdownItemSchema], default: [] },
    revenueIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Revenue" }],
    expenseIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Expense" }],
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

financialReportSchema.index(
  { "period.year": 1, "period.month": 1 },
  { unique: true },
);

const FinancialReport = mongoose.model("FinancialReport", financialReportSchema);

module.exports = FinancialReport;
