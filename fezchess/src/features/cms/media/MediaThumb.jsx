import React, { memo, useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import { cn } from "../utils/classNames";

const isVideo = (url) =>
  typeof url === "string" && /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);

const MediaThumb = memo(function MediaThumb({ src, alt, className, size = "md" }) {
  const [errored, setErrored] = useState(false);

  const sizeClass =
    size === "lg"
      ? "h-24 w-32"
      : size === "sm"
        ? "h-10 w-10"
        : "h-16 w-20";

  if (!src || errored) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 text-muted-foreground",
          sizeClass,
          className,
        )}
      >
        <ImageIcon size={16} />
      </div>
    );
  }

  if (isVideo(src)) {
    return (
      <video
        src={src}
        className={cn("rounded-lg border border-border object-cover", sizeClass, className)}
        muted
        playsInline
        loop
        onError={() => setErrored(true)}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt || "media"}
      loading="lazy"
      decoding="async"
      onError={() => setErrored(true)}
      className={cn(
        "rounded-lg border border-border object-cover",
        sizeClass,
        className,
      )}
    />
  );
});

export default MediaThumb;
