import { useEffect, useMemo, useState } from "react";
import useDashboardQuery from "./useDashboardQuery";
import parentDashboardFacade from "../services/parentDashboardFacade";

const EMPTY_STATS = {
  attendancePresent: 0,
  attendanceTotal: 0,
  pendingAssignments: 0,
  achievements: 0,
};

const NORMALIZED_LEVEL = (level) => String(level || "").toLowerCase();

export default function useParentDashboard(parentId) {
  const childrenQuery = useDashboardQuery(
    ["dashboard:parent:children", parentId],
    () => parentDashboardFacade.loadChildren(parentId),
    { enabled: Boolean(parentId), ttl: 120_000 },
  );

  const children = childrenQuery.data || [];
  const [selectedChildId, setSelectedChildId] = useState("");

  useEffect(() => {
    if (!selectedChildId && children.length > 0) {
      setSelectedChildId(children[0]._id);
    }
    if (
      selectedChildId &&
      !children.some((c) => String(c._id) === String(selectedChildId))
    ) {
      setSelectedChildId(children[0]?._id || "");
    }
  }, [children, selectedChildId]);

  const selectedChild = useMemo(
    () =>
      children.find(
        (child) => String(child._id) === String(selectedChildId),
      ) || null,
    [children, selectedChildId],
  );

  const completedLessons = Number(
    selectedChild?.completedLessons ??
      selectedChild?.completedSessions ??
      selectedChild?.doneLessons ??
      0,
  );
  const totalLessons = Number(
    selectedChild?.totalLessons ??
      selectedChild?.totalSessions ??
      selectedChild?.lessonCount ??
      0,
  );
  const progressPercent =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const statsQuery = useDashboardQuery(
    ["dashboard:parent:stats", selectedChildId, completedLessons, totalLessons],
    () => parentDashboardFacade.loadChildStats(selectedChild),
    { enabled: Boolean(selectedChild), ttl: 30_000 },
  );

  const stats = statsQuery.data || EMPTY_STATS;
  const displayAttendancePresent =
    stats.attendanceTotal > 0
      ? stats.attendancePresent
      : completedLessons;
  const displayAttendanceTotal =
    stats.attendanceTotal > 0 ? stats.attendanceTotal : totalLessons;

  const [leaderboardLevel, setLeaderboardLevel] = useState("kid1");
  useEffect(() => {
    if (selectedChild?.skillLevel) {
      setLeaderboardLevel(NORMALIZED_LEVEL(selectedChild.skillLevel));
    }
  }, [selectedChild?.skillLevel]);

  const leaderboardQuery = useDashboardQuery(
    [
      "dashboard:parent:leaderboard",
      leaderboardLevel,
      selectedChildId || "",
    ],
    () =>
      parentDashboardFacade.loadLeaderboard({
        level: leaderboardLevel,
        childId: selectedChildId,
      }),
    { enabled: Boolean(leaderboardLevel), ttl: 30_000 },
  );

  return {
    children,
    selectedChild,
    selectedChildId,
    setSelectedChildId,
    isLoading: childrenQuery.isLoading,
    error: childrenQuery.error,
    statsError: statsQuery.error,
    statsLoading: statsQuery.isLoading,
    stats: {
      ...stats,
      displayAttendancePresent,
      displayAttendanceTotal,
      completedLessons,
      totalLessons,
      progressPercent,
    },
    leaderboardLevel,
    setLeaderboardLevel,
    leaderboard: leaderboardQuery.data || {
      items: [],
      myChildRank: null,
      totalInLevel: 0,
    },
    leaderboardLoading: leaderboardQuery.isLoading,
  };
}
