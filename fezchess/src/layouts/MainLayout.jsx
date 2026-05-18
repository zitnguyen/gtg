import React from "react";
import AppShell from "./navigation/shell/AppShell";

const MainLayout = ({ children }) => (
  <AppShell role="admin">{children}</AppShell>
);

export default MainLayout;
