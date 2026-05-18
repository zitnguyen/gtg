import React, { memo } from "react";
import TextField from "./TextField";
import TextAreaField from "./TextAreaField";
import ColorField from "./ColorField";
import MediaField from "./MediaField";

// Maps a field config entry (from publicCmsSchema.js) to the right component.
// New field types can be registered here without touching block code.
const FIELD_REGISTRY = {
  text: TextField,
  textarea: TextAreaField,
  color: ColorField,
  media: MediaField,
};

export const registerFieldType = (type, Component) => {
  FIELD_REGISTRY[type] = Component;
};

const FieldRenderer = memo(function FieldRenderer({ field, basePath }) {
  const Component = FIELD_REGISTRY[field.type] || TextField;
  const path = `${basePath}.${field.key}`;
  return (
    <Component
      path={path}
      label={field.label}
      placeholder={field.placeholder}
      hint={field.hint}
      accept={field.accept}
    />
  );
});

export default FieldRenderer;
