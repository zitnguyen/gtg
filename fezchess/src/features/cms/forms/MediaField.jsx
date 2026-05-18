import React, { memo } from "react";
import FieldShell from "./FieldShell";
import MediaUploader from "../media/MediaUploader";
import useFieldValue from "../hooks/useFieldValue";

const MediaField = memo(function MediaField({ path, label, hint, accept }) {
  const [value, setValue] = useFieldValue(path);
  return (
    <FieldShell label={label} hint={hint}>
      <MediaUploader value={value} onChange={setValue} accept={accept} />
    </FieldShell>
  );
});

export default MediaField;
