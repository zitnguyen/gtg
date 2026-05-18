import axiosClient from "../api/axiosClient";

/**
 * Task: Unwrap API envelope { success, data: settingsDoc } — fix toast toggle / merge
 * Tác giả: DucManh-BlueOC
 */
export function unwrapSettingsBody(body) {
  if (!body || typeof body !== "object") return null;
  const fromEnvelope =
    body.success === true &&
    body.data &&
    typeof body.data === "object" &&
    !Array.isArray(body.data)
      ? body.data
      : null;
  const candidates = [fromEnvelope, body.data, body].filter(
    (x) => x != null && typeof x === "object" && !Array.isArray(x),
  );
  for (const c of candidates) {
    if (
      c.singletonKey === "system" ||
      Object.prototype.hasOwnProperty.call(c, "singletonKey") ||
      Object.prototype.hasOwnProperty.call(c, "centerName") ||
      Object.prototype.hasOwnProperty.call(c, "logoUrl") ||
      Object.prototype.hasOwnProperty.call(c, "announcement_enabled") ||
      Object.prototype.hasOwnProperty.call(c, "social_proof_toast_enabled") ||
      Object.prototype.hasOwnProperty.call(c, "publicCms")
    ) {
      return c;
    }
  }
  return null;
}

const normalizeResponseData = (response) => {
  if (!response) return null;
  if (response.data && typeof response.data === "object") return response.data;
  return response;
};

const coerceSettingsBooleans = (doc) => {
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) return doc;
  return {
    ...doc,
    social_proof_toast_enabled: Boolean(doc.social_proof_toast_enabled),
  };
};

const settingsService = {
  get: async () => {
    const response = await axiosClient.get("/settings");
    const raw =
      unwrapSettingsBody(response) ?? normalizeResponseData(response);
    return coerceSettingsBooleans(raw);
  },
  update: async (payload, axiosConfig = {}) => {
    const response = await axiosClient.patch("/settings", payload, axiosConfig);
    const raw =
      unwrapSettingsBody(response) ?? normalizeResponseData(response);
    return coerceSettingsBooleans(raw);
  },
  uploadLogo: async (file) => {
    const formData = new FormData();
    formData.append("logo", file);
    const response = await axiosClient.post("/upload/logo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const payload = normalizeResponseData(response);
    return payload?.url || payload?.data?.url || "";
  },
  uploadPaymentQr: async (file) => {
    const formData = new FormData();
    formData.append("qr", file);
    const response = await axiosClient.post("/upload/payment-qr", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const payload = normalizeResponseData(response);
    return payload?.url || payload?.data?.url || "";
  },
};

export default settingsService;
