import React, { memo } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  BookOpen,
  CalendarCheck2,
  ClipboardList,
  Trophy,
} from "lucide-react";
import WidgetGrid from "../../layout/WidgetGrid";
import SectionCard from "../../cards/SectionCard";

const StatBox = ({ title, value, sub, link, linkLabel, icon: Icon }) => (
  <div className="rounded-2xl border border-border bg-background p-5 shadow-sm transition-shadow hover:shadow-md">
    <div className="flex items-center gap-2 text-base font-semibold text-foreground">
      {Icon ? <Icon size={18} className="text-muted-foreground" /> : null}
      {title}
    </div>
    <div className="mt-3 text-3xl font-extrabold text-foreground leading-none tabular-nums">
      {value}
      {sub ? (
        <span className="ml-1 text-sm font-semibold text-muted-foreground">
          {sub}
        </span>
      ) : null}
    </div>
    {link ? (
      <Link
        to={link}
        className="mt-4 inline-block text-sm text-primary hover:underline"
      >
        {linkLabel}
      </Link>
    ) : null}
  </div>
);

const ParentStatsWidget = memo(function ParentStatsWidget({ stats, childId }) {
  return (
    <WidgetGrid columns={4} gap="md">
      <StatBox
        title="Điểm danh"
        value={stats.displayAttendancePresent}
        sub={`/ ${stats.displayAttendanceTotal} buổi`}
        link={`/parent/schedule?studentId=${childId}`}
        linkLabel="Xem chi tiết"
        icon={CalendarCheck2}
      />
      <StatBox
        title="Bài tập"
        value={stats.pendingAssignments}
        sub="bài chưa làm"
        link={`/parent/daily-exercises?studentId=${childId}`}
        linkLabel="Làm bài ngay"
        icon={ClipboardList}
      />
      <StatBox
        title="Thành tích"
        value={stats.achievements}
        sub="huy hiệu"
        link={`/parent/progress?studentId=${childId}`}
        linkLabel="Xem chi tiết"
        icon={Trophy}
      />

      <SectionCard className="rounded-2xl border border-border bg-background p-5 shadow-sm">
        <div className="text-base font-semibold text-foreground mb-3">
          Tổng quan
        </div>
        <div className="space-y-2.5 text-sm text-foreground">
          <div className="flex items-center gap-2">
            <CalendarCheck2 size={14} className="text-blue-600" />
            <span>{stats.displayAttendancePresent} buổi có mặt</span>
          </div>
          <div className="flex items-center gap-2">
            <ClipboardList size={14} className="text-violet-600" />
            <span>{stats.pendingAssignments} bài còn lại</span>
          </div>
          <div className="flex items-center gap-2">
            <Award size={14} className="text-amber-600" />
            <span>{stats.achievements} đánh giá đã ghi nhận</span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen size={14} className="text-emerald-600" />
            <span>
              Tiến độ {stats.completedLessons}/{stats.totalLessons} buổi
            </span>
          </div>
        </div>
      </SectionCard>
    </WidgetGrid>
  );
});

export default ParentStatsWidget;
