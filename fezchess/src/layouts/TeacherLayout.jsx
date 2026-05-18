import React from "react";
import AppShell from "./navigation/shell/AppShell";

const TeacherLayout = ({ children }) => (
  <AppShell role="teacher">{children}</AppShell>
);

export default TeacherLayout;
