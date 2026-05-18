import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import settingsService, {
  unwrapSettingsBody,
} from "../services/settingsService";

const defaultSettings = {
  logoUrl: "",
  centerName: "Z Chess",
  address: "",
  hotline: "",
  email: "",
  workingHours: "",
  bankName: "Techcombank",
  bankAccountNumber: "",
  bankAccountName: "",
  paymentQrUrl: "",
  paymentTransferPrefix: "KHOAHOC",
  announcement_enabled: false,
  announcement_text: "",
  announcement_bg_color: "#ff0000",
  announcement_text_color: "#ffffff",
  social_proof_toast_enabled: false,
};

const SystemSettingsContext = createContext({
  settings: defaultSettings,
  loading: true,
  refreshSettings: async () => {},
  setSettingsOptimistic: () => {},
});

export const SystemSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  /** Task: Bỏ qua GET settings cũ — tránh ghi đè social_proof sau PATCH (race khi vào /admin/settings) — Author: DucManh-BlueOC */
  const refreshSeq = useRef(0);

  const refreshSettings = useCallback(async () => {
    const mySeq = ++refreshSeq.current;
    try {
      const raw = await settingsService.get();
      if (mySeq !== refreshSeq.current) return;
      let data = unwrapSettingsBody(raw) ?? raw;
      if (data?.success && data?.data && typeof data.data === "object") {
        data = unwrapSettingsBody(data) ?? data.data;
      }
      if (
        data &&
        typeof data === "object" &&
        !Array.isArray(data) &&
        !(
          "success" in data &&
          "data" in data &&
          !("centerName" in data) &&
          !("logoUrl" in data)
        )
      ) {
        setSettings((prev) => ({
          ...prev,
          ...data,
          social_proof_toast_enabled: Boolean(data.social_proof_toast_enabled),
        }));
      }
    } catch (_error) {
      // Silent fallback to defaults for public surfaces.
    } finally {
      if (mySeq === refreshSeq.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const setSettingsOptimistic = useCallback((next) => {
    setSettings((prev) => ({ ...prev, ...next }));
  }, []);

  const value = useMemo(
    () => ({ settings, loading, refreshSettings, setSettingsOptimistic }),
    [settings, loading, refreshSettings, setSettingsOptimistic],
  );

  return (
    <SystemSettingsContext.Provider value={value}>
      {children}
    </SystemSettingsContext.Provider>
  );
};

export const useSystemSettings = () => useContext(SystemSettingsContext);
