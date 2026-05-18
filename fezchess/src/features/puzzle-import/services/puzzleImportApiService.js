import pdfPuzzleService from "../../../services/pdfPuzzleService";
import studentService from "../../../services/studentService";
import classService from "../../../services/classService";

const puzzleImportApiService = {
  createPreviewJob: (file, options) =>
    pdfPuzzleService.createPreviewJob(file, options),
  getPreviewJob: (jobId) => pdfPuzzleService.getPreviewJob(jobId),
  previewPdf: (file, options) => pdfPuzzleService.previewPdf(file, options),
  confirmPuzzles: (puzzles) => pdfPuzzleService.confirmPuzzles(puzzles),
  assignPuzzles: (payload) => pdfPuzzleService.assignPuzzles(payload),
  getStudents: () => studentService.getAll(),
  getClasses: () => classService.getAll(),
};

export default puzzleImportApiService;
