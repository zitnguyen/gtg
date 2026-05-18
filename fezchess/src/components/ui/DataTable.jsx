import { cn } from "../../lib/utils";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

export function DataTable({
  columns = [],
  rows = [],
  className,
  onSort,
  sortKey,
  sortDir,
  selectable = false,
  selectedIds = [],
  onSelectRow,
  onSelectAll,
  getRowId = (row) => row.id,
  emptyState,
}) {
  const allSelected =
    rows.length > 0 && rows.every((r) => selectedIds.includes(getRowId(r)));

  return (
    <div className={cn("w-full overflow-x-auto z-scrollbar", className)}>
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr>
            {selectable ? (
              <th className="w-10 pb-3 px-2">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll?.(e.target.checked)}
                  className="rounded border-white/[0.2] bg-z-bg"
                />
              </th>
            ) : null}
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "pb-3 px-3 text-left text-[10px] font-semibold uppercase tracking-widest text-z-t3",
                  col.className,
                )}
              >
                {col.sortable ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:text-z-t1 group"
                    onClick={() => onSort?.(col.key)}
                  >
                    {col.label}
                    {sortKey === col.key ? (
                      sortDir === "asc" ? (
                        <ArrowUp size={12} />
                      ) : (
                        <ArrowDown size={12} />
                      )
                    ) : (
                      <ArrowUpDown
                        size={12}
                        className="opacity-0 group-hover:opacity-60"
                      />
                    )}
                  </button>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)}>
                {emptyState || (
                  <p className="py-10 text-center text-z-t3 text-sm">
                    Không có dữ liệu
                  </p>
                )}
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const id = getRowId(row);
              return (
                <tr
                  key={id}
                  className="border-t border-border hover:bg-muted/50 transition-colors"
                >
                  {selectable ? (
                    <td className="py-[10px] px-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(id)}
                        onChange={() => onSelectRow?.(id)}
                        className="rounded border-white/[0.2] bg-z-bg"
                      />
                    </td>
                  ) : null}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "py-[10px] px-3 text-foreground align-middle",
                        col.cellClassName,
                      )}
                    >
                      {col.render
                        ? col.render(row[col.key], row)
                        : row[col.key]}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
