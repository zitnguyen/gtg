/**
 * Task: Responsive public shell — spacer matches fixed Header + AnnouncementBar height on mobile/desktop.
 * Author: DucManh-BlueOC
 */
import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import { Outlet, useLocation } from "react-router-dom";
import PageTransition from "./PageTransition";
import { useSystemSettings } from "../../context/SystemSettingsContext";
import SocialProofPurchaseToast from "../common/SocialProofPurchaseToast";

const PublicLayout = () => {
  const location = useLocation();
  const { settings } = useSystemSettings();
  const isLearningPage = location.pathname.startsWith("/learning/");
  const hasAnnouncement = Boolean(
    settings?.announcement_enabled &&
      String(settings?.announcement_text || "").trim(),
  );

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location.pathname]);

  const headerSpacerClass = hasAnnouncement
    ? "shrink-0 h-[calc(3.5rem+2.75rem)]"
    : "shrink-0 h-14";

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col w-full max-w-full min-w-0">
      {isLearningPage ? (
        <main className="flex-grow min-w-0">
          <Outlet />
        </main>
      ) : (
        <>
          <Header />
          <div className={headerSpacerClass} aria-hidden />
          <main className="flex-grow min-w-0">
            <PageTransition>
              <Outlet />
            </PageTransition>
          </main>
          <Footer />
          {/* Task: Social-proof purchase toast (tkcursor-style) — Author: DucManh-BlueOC */}
          <SocialProofPurchaseToast />
        </>
      )}
    </div>
  );
};

export default PublicLayout;
