import { memo } from "react";

const PuzzleAssignmentPanel = ({
  savedCount,
  students,
  classes,
  studentIds,
  classIds,
  deadline,
  assigning,
  canAssign,
  onToggleStudent,
  onToggleClass,
  onDeadlineChange,
  onAssign,
}) => (
  <div className="rounded-2xl border border-border bg-background p-5 space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h3 className="text-lg font-bold">Giao puzzle cho học viên</h3>
        <p className="text-sm text-muted-foreground">
          Puzzle đã lưu: <span className="font-semibold">{savedCount}</span>
        </p>
      </div>
      <label className="text-sm">
        Deadline
        <input
          type="date"
          className="ml-2 rounded border border-border bg-background px-2 py-1"
          value={deadline}
          onChange={(e) => onDeadlineChange(e.target.value)}
        />
      </label>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <SelectionList
        title="Học viên"
        items={students}
        selectedIds={studentIds}
        getLabel={(item) => item.fullName || item.username || "Học viên"}
        onToggle={onToggleStudent}
      />
      <SelectionList
        title="Lớp"
        items={classes}
        selectedIds={classIds}
        getLabel={(item) => item.className}
        onToggle={onToggleClass}
      />
    </div>

    <button
      type="button"
      onClick={onAssign}
      disabled={assigning || !canAssign}
      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
    >
      {assigning ? "Đang giao..." : "Assign cho học viên"}
    </button>
  </div>
);

const SelectionList = ({ title, items, selectedIds, getLabel, onToggle }) => (
  <div className="rounded-xl border border-border p-3">
    <div className="mb-2 flex items-center justify-between">
      <div className="text-sm font-semibold">{title}</div>
      <div className="text-xs text-muted-foreground">
        {selectedIds.length}/{items.length}
      </div>
    </div>
    <div className="max-h-64 overflow-auto pr-1">
      {items.map((item) => (
        <label
          key={item._id}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted"
        >
          <input
            type="checkbox"
            checked={selectedIds.includes(item._id)}
            onChange={() => onToggle(item._id)}
          />
          <span className="truncate">{getLabel(item)}</span>
        </label>
      ))}
      {items.length === 0 ? (
        <div className="py-6 text-center text-sm text-muted-foreground">
          Chưa có dữ liệu.
        </div>
      ) : null}
    </div>
  </div>
);

export default memo(PuzzleAssignmentPanel);
