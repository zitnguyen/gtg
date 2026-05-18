import { memo } from "react";
import { formatMoney } from "../utils/payrollFormatters";

const PayrollSummaryCards = ({ summary }) => {
  if (!summary) return null;
  const cards = [
    { label: "Tổng giáo viên", value: summary.totalTeachers || 0 },
    { label: "Tổng ca dạy", value: summary.totalSessions || 0 },
    { label: "Tổng giờ dạy", value: `${summary.totalHours || 0}h` },
    { label: "Tổng lương", value: formatMoney(summary.totalSalary) },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-background rounded-xl border border-border p-4 shadow-sm"
        >
          <div className="text-xs text-muted-foreground">{card.label}</div>
          <div className="text-2xl font-bold text-foreground mt-1">
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
};

export default memo(PayrollSummaryCards);
