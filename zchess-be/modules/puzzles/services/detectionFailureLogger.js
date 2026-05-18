const fs = require("fs");
const path = require("path");

const logFailedDetections = (failedItems = [], context = "") => {
  if (!Array.isArray(failedItems) || failedItems.length === 0) return;
  const logDir = path.join(__dirname, "../../../logs");
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  const logPath = path.join(logDir, "puzzle-detection-failures.log");
  const line = `${new Date().toISOString()} | ${context} | ${JSON.stringify(
    failedItems,
  )}\n`;
  fs.appendFileSync(logPath, line, "utf8");
};

module.exports = {
  logFailedDetections,
};
