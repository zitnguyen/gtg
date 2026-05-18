import React from "react";
import AppShell from "./navigation/shell/AppShell";

const ParentLayout = ({ children }) => (
  <AppShell role="parent">{children}</AppShell>
);

export default ParentLayout;
