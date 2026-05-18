import React, { memo } from "react";
import { useParams } from "react-router-dom";
import { usePublicCms } from "../../../context/PublicCmsContext";

// Light-weight preview for non-home page tabs. It reads the draft via the
// PreviewProvider that wraps this component in `PreviewFrame`, so live edits
// are reflected without a network round-trip.
const PageHeroFromDraft = memo(function PageHeroFromDraft({ pageKey }) {
  const params = useParams();
  const resolvedKey = pageKey || params?.pageKey || "courseStore";
  const { cms } = usePublicCms();
  const data = cms?.[resolvedKey] || {};

  return (
    <div
      style={{
        background: data.pageBackgroundColor,
        color: data.titleColor,
        fontFamily: data.fontFamily || "inherit",
      }}
      className="px-6 py-12 md:px-10 md:py-16"
    >
      {data.heroBackground ? (
        <div
          className="mb-6 h-44 w-full overflow-hidden rounded-2xl bg-muted"
          style={{
            backgroundImage: `url(${data.heroBackground})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      ) : null}
      <h1
        className="mb-3 font-bold leading-tight"
        style={{
          fontSize: data.titleFontSize,
          color: data.titleColor,
        }}
      >
        {data.title || "Tiêu đề trang"}
      </h1>
      <p
        className="max-w-2xl"
        style={{
          fontSize: data.descriptionFontSize,
          color: data.descriptionColor,
        }}
      >
        {data.description || "Mô tả trang sẽ hiển thị tại đây."}
      </p>
    </div>
  );
});

export default PageHeroFromDraft;
