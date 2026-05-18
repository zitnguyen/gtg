const { callExtractFen } = require("../../../services/pythonVisionService");

const extractFenFromFile = ({ fileBuffer, fileName, flip = false }) =>
  callExtractFen({
    fileBuffer,
    fileName: fileName || "input.pdf",
    flip,
  });

module.exports = {
  extractFenFromFile,
};
