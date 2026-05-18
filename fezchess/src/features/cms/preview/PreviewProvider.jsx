import React, { useMemo } from "react";
import { PublicCmsContext } from "../../../context/PublicCmsContext";
import useDraft from "../hooks/useDraft";

// Re-uses the public-site PublicCmsContext provider so existing public
// sections (HeroSection, CTASection, ...) can be rendered inside the editor
// preview pane against the live editor draft.
const PreviewProvider = ({ children }) => {
  const draft = useDraft();
  const value = useMemo(
    () => ({
      cms: draft,
      loading: false,
      refreshCms: async () => {},
      setCmsOptimistic: () => {},
    }),
    [draft],
  );
  return (
    <PublicCmsContext.Provider value={value}>
      {children}
    </PublicCmsContext.Provider>
  );
};

export default PreviewProvider;
