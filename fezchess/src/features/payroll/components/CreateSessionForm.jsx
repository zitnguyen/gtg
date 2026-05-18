import { memo } from "react";

const CreateSessionForm = ({
  teachers,
  availableClasses,
  sessionForm,
  selectedTeacherId,
  creatingSession,
  setSessionForm,
  onSubmit,
}) => (
  <form className="mt-4 grid grid-cols-1 md:grid-cols-6 gap-2" onSubmit={onSubmit}>
    <select
      value={sessionForm.teacherId || selectedTeacherId}
      onChange={(e) =>
        setSessionForm((prev) => ({
          ...prev,
          teacherId: e.target.value,
          classId: "",
        }))
      }
      className="px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground"
      required
    >
      <option value="">Chọn giáo viên</option>
      {teachers.map((item) => (
        <option key={item.teacher?._id} value={item.teacher?._id}>
          {item.teacher?.fullName || item.teacher?.username}
        </option>
      ))}
    </select>
    <select
      value={sessionForm.classId}
      onChange={(e) =>
        setSessionForm((prev) => ({ ...prev, classId: e.target.value }))
      }
      className="px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground"
      required
    >
      <option value="">Chọn lớp</option>
      {availableClasses.map((item) => (
        <option key={item._id} value={item._id}>
          {item.className}
        </option>
      ))}
    </select>
    <input
      type="date"
      value={sessionForm.date}
      onChange={(e) =>
        setSessionForm((prev) => ({ ...prev, date: e.target.value }))
      }
      className="px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground"
      required
    />
    <input
      type="time"
      value={sessionForm.startTime}
      onChange={(e) =>
        setSessionForm((prev) => ({ ...prev, startTime: e.target.value }))
      }
      className="px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground"
      required
    />
    <input
      type="time"
      value={sessionForm.endTime}
      onChange={(e) =>
        setSessionForm((prev) => ({ ...prev, endTime: e.target.value }))
      }
      className="px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground"
      required
    />
    <button
      type="submit"
      disabled={creatingSession}
      className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-60 text-sm"
    >
      {creatingSession ? "Đang thêm..." : "Thêm ca lương"}
    </button>
  </form>
);

export default memo(CreateSessionForm);
