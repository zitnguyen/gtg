import { memo } from "react";
import { formatMoney } from "../utils/payrollFormatters";

const TeacherPayrollList = ({ teachers, selectedTeacherId, onSelectTeacher }) => (
  <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
    <div className="px-4 py-3 border-b border-border font-semibold text-foreground">
      Danh sách giáo viên
    </div>
    <div className="divide-y divide-border">
      {teachers.map((item) => {
        const teacher = item.teacher || {};
        const active = String(teacher._id) === String(selectedTeacherId);
        return (
          <button
            type="button"
            key={teacher._id}
            onClick={() => onSelectTeacher(teacher._id)}
            className={`w-full text-left px-4 py-3 transition-colors ${
              active ? "bg-primary/10" : "hover:bg-muted"
            }`}
          >
            <div className="font-medium text-foreground">
              {teacher.fullName || teacher.username}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {item.totalSessions} ca - {formatMoney(item.totalSalary)}
            </div>
          </button>
        );
      })}
      {teachers.length === 0 && (
        <div className="px-4 py-8 text-center text-muted-foreground">
          Chưa có giáo viên.
        </div>
      )}
    </div>
  </div>
);

export default memo(TeacherPayrollList);
