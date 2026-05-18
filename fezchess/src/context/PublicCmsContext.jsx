/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import publicCmsService from "../services/publicCmsService";

const defaultCms = {
  theme: {
    fontFamily: "inherit",
    primaryColor: "#2563EB",
    secondaryColor: "#0F172A",
    accentColor: "#CA8A04",
    textColor: "#0F172A",
    mutedTextColor: "#64748B",
    buttonRadius: "12px",
  },
  home: {
    hero: {},
    courses: {},
    teachers: {},
    news: {},
    testimonials: {},
    contact: {},
    cta: {},
  },
  courseStore: {},
  courseDetail: {},
  teachersPage: {},
  newsPage: {},
  contactPage: {},
};

export const PublicCmsContext = createContext({
  cms: defaultCms,
  loading: true,
  refreshCms: async () => {},
  setCmsOptimistic: () => {},
});

export const PublicCmsProvider = ({ children }) => {
  const [cms, setCms] = useState(defaultCms);
  const [loading, setLoading] = useState(true);
  const setCmsOptimistic = useCallback((updater) => {
    setCms((prev) =>
      typeof updater === "function" ? updater(prev) : { ...prev, ...updater },
    );
  }, []);

  const refreshCms = useCallback(async () => {
    try {
      const data = await publicCmsService.getPublic();
      if (data) setCms((prev) => ({ ...prev, ...data }));
    } catch {
      // keep defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCms();
  }, [refreshCms]);

  const value = useMemo(
    () => ({ cms, loading, refreshCms, setCmsOptimistic }),
    [cms, loading, refreshCms, setCmsOptimistic],
  );
  return (
    <PublicCmsContext.Provider value={value}>
      {children}
    </PublicCmsContext.Provider>
  );
};

export const usePublicCms = () => useContext(PublicCmsContext);
