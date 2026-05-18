const crypto = require("crypto");
const { previewPuzzleFromFile } = require("./puzzleDetectionService");

const jobs = new Map();
const MAX_JOBS = 100;

const cleanupOldJobs = () => {
  if (jobs.size <= MAX_JOBS) return;
  const sorted = [...jobs.entries()].sort(
    (a, b) => new Date(a[1].createdAt) - new Date(b[1].createdAt),
  );
  sorted.slice(0, jobs.size - MAX_JOBS).forEach(([id]) => jobs.delete(id));
};

const createPreviewJob = ({ file, flip = false, userId }) => {
  if (!file?.buffer) {
    const error = new Error("Vui lòng tải file PDF.");
    error.statusCode = 400;
    throw error;
  }

  const jobId = crypto.randomUUID();
  const job = {
    id: jobId,
    status: "queued",
    progress: 0,
    fileName: file.originalname || "",
    result: null,
    error: "",
    createdBy: userId ? String(userId) : "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  jobs.set(jobId, job);
  cleanupOldJobs();

  setImmediate(async () => {
    jobs.set(jobId, { ...job, status: "processing", progress: 20 });
    try {
      const result = await previewPuzzleFromFile({
        file,
        flip,
        context: `preview-job:${jobId}`,
      });
      jobs.set(jobId, {
        ...jobs.get(jobId),
        status: "completed",
        progress: 100,
        result,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      jobs.set(jobId, {
        ...jobs.get(jobId),
        status: "failed",
        progress: 100,
        error: error.message || "Detection failed",
        updatedAt: new Date().toISOString(),
      });
    }
  });

  return job;
};

const getPreviewJob = (jobId) => jobs.get(String(jobId || "")) || null;

module.exports = {
  createPreviewJob,
  getPreviewJob,
};
