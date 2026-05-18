import { memo } from "react";
import { buildMonthOptions } from "../utils/payrollFormatters";

const PayrollToolbar = ({
  filterMonth,
  filterYear,
  exportingType,
  importingExcel,
  downloadingTemplate,
  excelFile,
  setFilterMonth,
  setFilterYear,
  setExcelFile,
  onExport,
  onImportExcel,
  onDownloadTemplate,
}) => (
  <div className="mt-4 flex flex-wrap items-end gap-3">
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">
        Tháng
      </label>
      <select
        value={filterMonth}
        onChange={(e) => setFilterMonth(e.target.value)}
        className="px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground"
      >
        {buildMonthOptions().map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </div>
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">
        Năm
      </label>
      <input
        type="number"
        min="2000"
        max="3000"
        value={filterYear}
        onChange={(e) => setFilterYear(e.target.value)}
        className="w-28 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground"
      />
    </div>
    <button
      type="button"
      onClick={() => onExport("excel")}
      disabled={exportingType !== ""}
      className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
    >
      {exportingType === "excel" ? "Đang xuất..." : "Xuất Excel"}
    </button>
    <button
      type="button"
      onClick={() => onExport("pdf")}
      disabled={exportingType !== ""}
      className="px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-900 disabled:opacity-60"
    >
      {exportingType === "pdf" ? "Đang xuất..." : "Xuất PDF"}
    </button>
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
        className="text-sm text-foreground"
      />
      <button
        type="button"
        onClick={onImportExcel}
        disabled={importingExcel || !excelFile}
        className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {importingExcel ? "Đang import..." : "Import Excel"}
      </button>
      <button
        type="button"
        onClick={onDownloadTemplate}
        disabled={downloadingTemplate}
        className="px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60"
      >
        {downloadingTemplate ? "Đang tải..." : "Tải file mẫu"}
      </button>
    </div>
  </div>
);

export default memo(PayrollToolbar);
