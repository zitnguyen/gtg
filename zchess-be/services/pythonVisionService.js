const normalize = (value) => String(value || "").trim();

const callExtractFen = async ({ fileBuffer, fileName = "input.pdf", flip = false }) => {
  const serviceUrl = normalize(process.env.PYTHON_VISION_URL) || "http://localhost:8001";
  const endpoint = `${serviceUrl.replace(/\/$/, "")}/extract-fen`;

  const form = new FormData();
  form.append(
    "file",
    new Blob([fileBuffer], { type: "application/pdf" }),
    fileName || "input.pdf",
  );
  form.append("flip", String(Boolean(flip)));

  const response = await fetch(endpoint, { method: "POST", body: form });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = normalize(data?.message || data?.error) || "Python OCR service failed.";
    throw new Error(message);
  }
  return data;
};

module.exports = { callExtractFen };
