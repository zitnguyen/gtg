import { toast } from "sonner";
import PuzzleAssignmentPanel from "../components/PuzzleAssignmentPanel";
import PuzzlePreviewGrid from "../components/PuzzlePreviewGrid";
import PuzzleUploadPanel from "../components/PuzzleUploadPanel";
import { usePuzzleImportController } from "../hooks/usePuzzleImportController";

const PuzzleImportPage = () => {
  const puzzleImport = usePuzzleImportController();

  const handleAssign = async () => {
    const data = await puzzleImport.handleAssign();
    if (data) {
      toast.success(`Đã giao ${data?.total || 0} assignment.`);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="rounded-2xl border border-border bg-background p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">Import bài tập từ PDF</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Upload PDF, theo dõi detection progress, chỉnh FEN, xác nhận lưu
              và giao cho học viên.
            </p>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <Metric label="Boards" value={puzzleImport.stats.total} />
            <Metric label="Valid" value={puzzleImport.stats.valid} />
            <Metric label="Selected" value={puzzleImport.stats.selected} />
            <Metric label="Saved" value={puzzleImport.stats.saved} />
          </div>
        </div>
      </div>

      {puzzleImport.error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {puzzleImport.error}
        </div>
      ) : null}

      <PuzzleUploadPanel
        file={puzzleImport.file}
        uploadProgress={puzzleImport.uploadProgress}
        detectionProgress={puzzleImport.detectionProgress}
        detectionStatus={puzzleImport.detectionStatus}
        isDetecting={puzzleImport.isDetecting}
        onFileSelect={puzzleImport.handleFileSelect}
        onPreview={puzzleImport.handlePreview}
        onCancel={puzzleImport.cancelDetection}
        onRetry={puzzleImport.retryDetection}
      />

      <PuzzlePreviewGrid
        items={puzzleImport.previewItems}
        stats={puzzleImport.stats}
        saving={puzzleImport.saving}
        onToggleKeep={puzzleImport.toggleKeep}
        onFenChange={puzzleImport.changeFen}
        onFlipToggle={puzzleImport.toggleFlip}
        onSelectAllValid={puzzleImport.selectAllValid}
        onClearSelection={puzzleImport.clearSelection}
        onConfirmSave={async () => {
          const data = await puzzleImport.handleConfirmSave();
          if (data) {
            toast.success(`Đã lưu ${data?.items?.length || 0} puzzle.`);
          }
        }}
      />

      <PuzzleAssignmentPanel
        savedCount={puzzleImport.savedPuzzles.length}
        students={puzzleImport.students}
        classes={puzzleImport.classes}
        studentIds={puzzleImport.studentIds}
        classIds={puzzleImport.classIds}
        deadline={puzzleImport.deadline}
        assigning={puzzleImport.assigning}
        canAssign={puzzleImport.canAssign}
        onToggleStudent={puzzleImport.toggleStudent}
        onToggleClass={puzzleImport.toggleClass}
        onDeadlineChange={puzzleImport.setDeadline}
        onAssign={handleAssign}
      />
    </div>
  );
};

const Metric = ({ label, value }) => (
  <div className="rounded-xl border border-border bg-muted/30 px-3 py-2">
    <div className="text-muted-foreground">{label}</div>
    <div className="text-lg font-bold text-foreground">{value}</div>
  </div>
);

export default PuzzleImportPage;
