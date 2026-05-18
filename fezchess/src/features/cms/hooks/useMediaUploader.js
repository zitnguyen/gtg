import { useCallback, useState } from "react";
import cmsApiService from "../services/cmsApiService";

const ACCEPT_DEFAULT = "image/png,image/jpeg";

// Reusable uploader with progress + error state. Keeps the underlying
// publicCmsService.uploadMedia API contract intact while exposing a
// component-friendly ergonomics layer.
export default function useMediaUploader({
  accept = ACCEPT_DEFAULT,
  maxSize = 10 * 1024 * 1024,
} = {}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const upload = useCallback(
    async (file) => {
      if (!file) return null;
      if (maxSize && file.size > maxSize) {
        const err = new Error(
          `Tệp vượt giới hạn (${Math.round(maxSize / 1024 / 1024)}MB)`,
        );
        setError(err);
        throw err;
      }
      setError(null);
      setUploading(true);
      try {
        const url = await cmsApiService.uploadMedia(file);
        return url;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setUploading(false);
      }
    },
    [maxSize],
  );

  return { upload, uploading, error, accept };
}
