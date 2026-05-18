import { memo } from "react";
import {
  DEDUCTION_PRESET_VALUES,
  SALARY_PRESET_VALUES,
  formatMoney,
} from "../utils/payrollFormatters";

const PresetButton = ({ selected, disabled, children, onClick, tone = "primary" }) => {
  const selectedClass =
    tone === "warning"
      ? "bg-amber-100 text-amber-700 border-amber-300"
      : "bg-primary text-white border-primary";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-2.5 py-1 rounded-md border text-xs font-medium transition-colors ${
        selected
          ? selectedClass
          : "bg-background text-foreground border-border hover:bg-muted"
      } disabled:opacity-60`}
    >
      {children}
    </button>
  );
};

const PayrollSessionsTable = ({
  sessions,
  bulkEditMode,
  bulkSaving,
  savingSessionId,
  salaryDraft,
  onUpdateDraft,
  onStartBulkEdit,
  onResetSalary,
  onDeleteSession,
}) => (
  <div className="overflow-x-auto">
    <table className="min-w-full">
      <thead className="bg-muted/60 border-b border-border">
        <tr>
          {[
            "Ngày",
            "Lớp",
            "Thời gian",
            "Giờ dạy",
            "Lương",
            "Phạt/Phí",
            "Ghi chú phạt/phí",
            "Thao tác",
          ].map((label, index) => (
            <th
              key={label}
              className={`px-4 py-3 text-xs font-semibold text-muted-foreground uppercase ${
                index === 7 ? "text-right" : "text-left"
              }`}
            >
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {sessions.map((session) => (
          <tr key={session._id} className="hover:bg-muted/30">
            <td className="px-4 py-3 text-sm text-foreground">
              {new Date(session.date).toLocaleDateString("vi-VN")}
            </td>
            <td className="px-4 py-3 text-sm text-foreground">
              {session.classId?.className || "N/A"}
            </td>
            <td className="px-4 py-3 text-sm text-foreground">
              {session.startTime} - {session.endTime}
            </td>
            <td className="px-4 py-3 text-sm text-foreground">
              {session.durationHours || 0}h
            </td>
            <td className="px-4 py-3 text-sm text-foreground">
              {bulkEditMode ? (
                <div className="flex flex-wrap gap-1.5 max-w-[360px]">
                  {SALARY_PRESET_VALUES.map((value) => (
                    <PresetButton
                      key={value}
                      selected={Number(salaryDraft[session._id]?.salary) === value}
                      disabled={savingSessionId === session._id || bulkSaving}
                      onClick={() => onUpdateDraft(session._id, { salary: value })}
                    >
                      {Math.round(value / 1000)}k
                    </PresetButton>
                  ))}
                </div>
              ) : (
                <span className="font-medium">
                  {session.salary == null ? "Chưa nhập" : formatMoney(session.salary)}
                </span>
              )}
            </td>
            <td className="px-4 py-3 text-sm text-foreground">
              {bulkEditMode ? (
                <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                  {DEDUCTION_PRESET_VALUES.map((value) => (
                    <PresetButton
                      key={`d-${value}`}
                      tone="warning"
                      selected={
                        Number(salaryDraft[session._id]?.deductionAmount || 0) ===
                        value
                      }
                      disabled={savingSessionId === session._id || bulkSaving}
                      onClick={() =>
                        onUpdateDraft(session._id, { deductionAmount: value })
                      }
                    >
                      {value === 0 ? "0" : `${Math.round(value / 1000)}k`}
                    </PresetButton>
                  ))}
                </div>
              ) : (
                <span>
                  {Number(session.deductionAmount || 0) > 0
                    ? formatMoney(session.deductionAmount)
                    : "-"}
                </span>
              )}
            </td>
            <td className="px-4 py-3 text-sm text-foreground">
              {bulkEditMode ? (
                <input
                  type="text"
                  value={salaryDraft[session._id]?.deductionNote || ""}
                  onChange={(e) =>
                    onUpdateDraft(session._id, { deductionNote: e.target.value })
                  }
                  className="w-52 px-2.5 py-1.5 border border-border bg-background rounded-md text-xs"
                  placeholder="Lý do phạt/phí"
                />
              ) : (
                <span>{session.deductionNote || "-"}</span>
              )}
            </td>
            <td className="px-4 py-3 text-right text-sm text-foreground">
              <div className="flex items-center justify-end gap-2">
                {!bulkEditMode && (
                  <button
                    type="button"
                    onClick={onStartBulkEdit}
                    disabled={savingSessionId === session._id}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-60"
                  >
                    Sửa
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onResetSalary(session._id)}
                  disabled={savingSessionId === session._id}
                  className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-60"
                >
                  Đặt lại
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteSession(session._id)}
                  disabled={savingSessionId === session._id}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
                >
                  Xóa
                </button>
              </div>
            </td>
          </tr>
        ))}
        {sessions.length === 0 && (
          <tr>
            <td colSpan="8" className="px-4 py-8 text-center text-muted-foreground">
              Giáo viên này chưa có ca dạy.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

export default memo(PayrollSessionsTable);
