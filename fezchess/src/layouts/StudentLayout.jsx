import React from "react";
import AppShell from "./navigation/shell/AppShell";

const StudentLayout = ({ children }) => (
  <AppShell role="student">{children}</AppShell>
);

export default StudentLayout;
