import CreateSessionForm from "../components/CreateSessionForm";
import PayrollSessionsTable from "../components/PayrollSessionsTable";
import PayrollSummaryCards from "../components/PayrollSummaryCards";
import PayrollToolbar from "../components/PayrollToolbar";
import TeacherPayrollList from "../components/TeacherPayrollList";
import { useAdminPayrollController } from "../hooks/useAdminPayrollController";
import { formatMoney } from "../utils/payrollFormatters";

const AdminPayrollPage = () => {
  const payroll = useAdminPayrollController();

  if (payroll.loading) {
    return <div className="p-6 text-muted-foreground">Đang tải bảng lương...</div>;
  }

  const sessions = payroll.teacherDetail?.sessions || [];

  return (
    <div className="space-y-5">
      <div className="bg-background rounded-xl border border-border shadow-sm p-5">
        <h1 className="text-2xl font-bold text-foreground">
          Bảng lương quản lý giáo viên
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Admin quản lý lương theo từng ca dạy. Lương chỉ được thiết lập tại
          trang này.
        </p>
        <PayrollToolbar
          filterMonth={payroll.filterMonth}
          filterYear={payroll.filterYear}
          exportingType={payroll.exportingType}
          importingExcel={payroll.importingExcel}
          downloadingTemplate={payroll.downloadingTemplate}
          excelFile={payroll.excelFile}
          setFilterMonth={payroll.setFilterMonth}
          setFilterYear={payroll.setFilterYear}
          setExcelFile={payroll.setExcelFile}
          onExport={payroll.handleExport}
          onImportExcel={payroll.handleImportExcel}
          onDownloadTemplate={payroll.handleDownloadTemplate}
        />
        <CreateSessionForm
          teachers={payroll.teachers}
          availableClasses={payroll.availableClasses}
          sessionForm={payroll.sessionForm}
          selectedTeacherId={payroll.selectedTeacherId}
          creatingSession={payroll.creatingSession}
          setSessionForm={payroll.setSessionForm}
          onSubmit={payroll.handleCreateSession}
        />
      </div>

      <PayrollSummaryCards summary={payroll.summary} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <TeacherPayrollList
          teachers={payroll.teachers}
          selectedTeacherId={payroll.selectedTeacherId}
          onSelectTeacher={payroll.setSelectedTeacherId}
        />

        <div className="lg:col-span-2 bg-background rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <div className="font-semibold text-foreground">
              Chi tiết lương: {payroll.selectedTeacherName}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Tổng lương giáo viên:{" "}
              {formatMoney(payroll.teacherDetail?.totalSalary || 0)}
            </div>
            <div className="mt-3 flex items-center gap-2">
              {!payroll.bulkEditMode ? (
                <button
                  type="button"
                  onClick={payroll.startBulkEditSalary}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-sm"
                >
                  Sửa hàng loạt
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={payroll.saveBulkSalary}
                    disabled={payroll.bulkSaving}
                    className="px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-60 text-sm"
                  >
                    {payroll.bulkSaving ? "Đang lưu..." : "Lưu tất cả"}
                  </button>
                  <button
                    type="button"
                    onClick={payroll.cancelBulkEditSalary}
                    disabled={payroll.bulkSaving}
                    className="px-3 py-1.5 rounded-lg bg-muted text-foreground hover:bg-muted/80 disabled:opacity-60 text-sm"
                  >
                    Hủy
                  </button>
                </>
              )}
            </div>
          </div>
          <PayrollSessionsTable
            sessions={sessions}
            bulkEditMode={payroll.bulkEditMode}
            bulkSaving={payroll.bulkSaving}
            savingSessionId={payroll.savingSessionId}
            salaryDraft={payroll.salaryDraft}
            onUpdateDraft={payroll.updateSalaryDraft}
            onStartBulkEdit={payroll.startBulkEditSalary}
            onResetSalary={payroll.resetSalary}
            onDeleteSession={payroll.handleDeleteSession}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminPayrollPage;
