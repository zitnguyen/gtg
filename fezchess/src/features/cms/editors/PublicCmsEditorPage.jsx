import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import EditorSidebar from "./EditorSidebar";
import EditorToolbar from "./EditorToolbar";
import EditorCanvas from "./EditorCanvas";
import PreviewFrame from "../preview/PreviewFrame";
import useEditorStatus from "../hooks/useEditorStatus";
import useAutosave from "../hooks/useAutosave";
import useCmsHotkeys from "../hooks/useCmsHotkeys";
import { editorStore } from "../hooks/useEditorStore";
import cmsApiService from "../services/cmsApiService";
import { publicCmsTabs, getTab } from "../schema/publicCmsSchema";

const PublicCmsEditorPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home");
  const [showPreview, setShowPreview] = useState(true);
  const [viewport, setViewport] = useState("desktop");
  const [bootstrapping, setBootstrapping] = useState(true);
  const { hydrated, status, lastError } = useEditorStatus();

  // Hydrate the editor store once on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await cmsApiService.fetchAdminCms();
        if (cancelled) return;
        editorStore.init(data || {});
      } catch (error) {
        toast.error(
          error?.response?.data?.message || "Không tải được Public CMS",
        );
        editorStore.init({});
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const { flush } = useAutosave({
    enabled: hydrated && !bootstrapping,
    onError: (error) =>
      toast.error(error?.response?.data?.message || "Tự động lưu thất bại"),
  });

  useCmsHotkeys({ flush });

  // Surface successful save toast (debounced via status edge transition).
  useEffect(() => {
    if (status === "saved") {
      toast.success("Đã lưu Public CMS", { id: "cms-saved", duration: 1500 });
    } else if (status === "error" && lastError) {
      toast.error(
        lastError?.response?.data?.message || "Lưu thất bại — sẽ thử lại",
        { id: "cms-error" },
      );
    }
  }, [status, lastError]);

  const tab = useMemo(() => getTab(activeTab) || publicCmsTabs[0], [activeTab]);

  if (bootstrapping) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="animate-spin" size={18} />
        Đang tải Public CMS...
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <EditorToolbar
        onBack={() => navigate("/dashboard")}
        onFlush={flush}
        showPreview={showPreview}
        onTogglePreview={() => setShowPreview((v) => !v)}
      />

      <div className="grid grid-cols-1 gap-5 px-4 py-5 md:px-6 lg:grid-cols-[220px_1fr] xl:grid-cols-[220px_minmax(0,1fr)_minmax(0,1.1fr)]">
        <aside className="lg:sticky lg:top-[68px] lg:max-h-[calc(100vh-90px)] lg:overflow-y-auto">
          <EditorSidebar
            tabs={publicCmsTabs}
            activeTab={activeTab}
            onSelect={setActiveTab}
          />
        </aside>

        <section className="min-w-0">
          <div className="mb-3">
            <h2 className="text-lg font-bold text-foreground">{tab.label}</h2>
            <p className="text-sm text-muted-foreground">{tab.description}</p>
          </div>
          <EditorCanvas tab={tab} />
        </section>

        {showPreview ? (
          <aside className="hidden xl:block min-w-0 sticky top-[68px] max-h-[calc(100vh-90px)]">
            <PreviewFrame
              tabId={activeTab}
              viewport={viewport}
              onViewportChange={setViewport}
            />
          </aside>
        ) : null}
      </div>
    </div>
  );
};

export default PublicCmsEditorPage;
