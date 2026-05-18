import React, { Suspense, lazy, memo, useMemo } from "react";
import PreviewProvider from "./PreviewProvider";
import PreviewSwitcher, { VIEWPORT_WIDTH } from "./PreviewSwitcher";

// Existing public sections are reused for live preview instead of being
// re-implemented. They are lazy-loaded to keep the editor bundle slim.
const HeroSection = lazy(() => import("../../../components/sections/HeroSection"));
const CTASection = lazy(() => import("../../../components/sections/CTASection"));
const CoursesSection = lazy(() =>
  import("../../../components/sections/CoursesSection"),
);
const TeachersSection = lazy(() =>
  import("../../../components/sections/TeachersSection"),
);
const NewsSection = lazy(() => import("../../../components/sections/NewsSection"));
const TestimonialSection = lazy(() =>
  import("../../../components/sections/TestimonialSection"),
);
const ContactSection = lazy(() =>
  import("../../../components/sections/ContactSection"),
);

const PREVIEW_MAP = {
  theme: () => <HomePreview />,
  home: () => <HomePreview />,
  courseStore: () => <PageHeroPreview pageKey="courseStore" />,
  teachersPage: () => <PageHeroPreview pageKey="teachersPage" />,
  newsPage: () => <PageHeroPreview pageKey="newsPage" />,
  contactPage: () => <PageHeroPreview pageKey="contactPage" />,
};

const HomePreview = () => (
  <div className="space-y-2">
    <HeroSection />
    <CoursesSection />
    <TeachersSection />
    <NewsSection />
    <TestimonialSection />
    <ContactSection />
    <CTASection />
  </div>
);

const PageHeroPreview = ({ pageKey }) => {
  // Render a simple representative hero using current draft data so the
  // editor can preview "page" tabs even though we don't have a dedicated
  // public-component wrapper for them.
  return <PageHeroFromDraft pageKey={pageKey} />;
};

const PageHeroFromDraft = lazy(() => import("./PageHeroFromDraft"));

const Fallback = () => (
  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
    Đang dựng preview...
  </div>
);

const PreviewFrame = memo(function PreviewFrame({
  tabId = "home",
  viewport = "desktop",
  onViewportChange,
  className,
}) {
  const TabPreview = PREVIEW_MAP[tabId] || HomePreview;
  const innerWidth = VIEWPORT_WIDTH[viewport] || "100%";
  const isResponsive = viewport !== "desktop";

  const inner = useMemo(
    () => (
      <div
        className="mx-auto bg-white text-gray-900 dark:bg-zinc-950 dark:text-zinc-100 transition-[max-width] duration-300"
        style={{ maxWidth: innerWidth }}
      >
        <Suspense fallback={<Fallback />}>
          <TabPreview />
        </Suspense>
      </div>
    ),
    [TabPreview, innerWidth],
  );

  return (
    <div className={`flex flex-col gap-3 min-w-0 ${className || ""}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Live preview
        </span>
        <PreviewSwitcher value={viewport} onChange={onViewportChange} />
      </div>
      <PreviewProvider>
        <div
          className={`relative h-[70vh] overflow-auto rounded-2xl border border-border bg-muted/20 ${
            isResponsive ? "p-4" : "p-0"
          }`}
        >
          {inner}
        </div>
      </PreviewProvider>
    </div>
  );
});

export default PreviewFrame;
