import {
  LayoutDashboard,
  Users,
  Calendar,
  CalendarRange,
  BookOpen,
  ClipboardCheck,
  Wallet,
  Bell,
  Settings,
  MessageCircle,
  Swords,
  GraduationCap,
  Newspaper,
  Globe,
  Inbox,
  Home,
  PlayCircle,
  BookOpenCheck,
  UserCircle,
  Cpu,
  Flame,
  Trophy,
  CalendarCheck,
  Layers,
  LineChart,
} from "lucide-react";

const ADMIN_MENU = {
  role: "admin",
  sections: [
    {
      key: "overview",
      label: null,
      items: [
        {
          key: "admin-dashboard",
          to: "/dashboard",
          label: "Tổng quan",
          icon: LayoutDashboard,
          end: true,
        },
      ],
    },
    {
      key: "academy",
      label: "Đào tạo",
      items: [
        { key: "students", to: "/students", label: "Học viên", icon: Users },
        { key: "parents", to: "/parents", label: "Phụ huynh", icon: Users },
        { key: "classes", to: "/classes", label: "Lớp học", icon: BookOpen },
        {
          key: "enrollments",
          to: "/enrollments",
          label: "Ghi danh",
          icon: BookOpen,
        },
        {
          key: "teachers",
          to: "/admin/teachers",
          label: "Giáo viên",
          icon: GraduationCap,
        },
      ],
    },
    {
      key: "operations",
      label: "Vận hành",
      items: [
        {
          key: "attendance",
          to: "/attendance",
          label: "Điểm danh",
          icon: Calendar,
        },
        {
          key: "schedule",
          to: "/schedule",
          label: "Lịch học",
          icon: CalendarRange,
        },
        {
          key: "progress",
          to: "/progress",
          label: "Phiếu học tập",
          icon: ClipboardCheck,
        },
        {
          key: "progress-lesson-templates",
          to: "/admin/progress-lesson-templates",
          label: "Mẫu nội dung học",
          icon: Layers,
        },
      ],
    },
    {
      key: "library",
      label: "Học liệu",
      items: [
        {
          key: "courses",
          to: "/admin/courses",
          label: "Khóa học",
          icon: BookOpen,
        },
        {
          key: "exercises",
          to: "/admin/exercises",
          label: "Bài tập cờ",
          icon: Swords,
        },
      ],
    },
    {
      key: "finance",
      label: "Tài chính",
      items: [
        { key: "finance", to: "/finance", label: "Tài chính", icon: Wallet },
        {
          key: "payroll",
          to: "/admin/payroll",
          label: "Bảng lương",
          icon: Wallet,
        },
      ],
    },
    {
      key: "content",
      label: "Nội dung & CRM",
      items: [
        {
          key: "cms-posts",
          to: "/cms/posts",
          label: "Tin tức (CMS)",
          icon: Newspaper,
        },
        { key: "cms-hero", to: "/cms/hero", label: "Public CMS", icon: Globe },
        {
          key: "crm-inquiries",
          to: "/crm/inquiries",
          label: "Liên hệ",
          icon: Inbox,
        },
      ],
    },
    {
      key: "system",
      label: "Hệ thống",
      items: [
        {
          key: "admin-notifications",
          to: "/admin/notifications",
          label: "Thông báo",
          icon: Bell,
          indicator: "notification-unread",
        },
        {
          key: "admin-chat",
          to: "/admin/chat",
          label: "Trò chuyện",
          icon: MessageCircle,
          indicator: "chat-unread",
        },
        {
          key: "admin-settings",
          to: "/admin/settings",
          label: "Cài đặt hệ thống",
          icon: Settings,
        },
      ],
    },
  ],
};

const TEACHER_MENU = {
  role: "teacher",
  sections: [
    {
      key: "overview",
      label: null,
      items: [
        {
          key: "teacher-dashboard",
          to: "/teacher/dashboard",
          label: "Tổng quan",
          icon: LayoutDashboard,
          end: true,
        },
      ],
    },
    {
      key: "teaching",
      label: "Giảng dạy",
      items: [
        {
          key: "teacher-classes",
          to: "/teacher/classes",
          label: "Lớp học của tôi",
          icon: BookOpen,
        },
        {
          key: "teacher-attendance",
          to: "/teacher/attendance",
          label: "Điểm danh",
          icon: ClipboardCheck,
        },
        {
          key: "teacher-schedule",
          to: "/teacher/schedule",
          label: "Lịch dạy",
          icon: BookOpen,
        },
        {
          key: "teacher-payroll",
          to: "/teacher/payroll",
          label: "Ca dạy",
          icon: Calendar,
        },
      ],
    },
    {
      key: "students",
      label: "Học viên",
      items: [
        {
          key: "teacher-assessments",
          to: "/teacher/assessments",
          label: "Đánh giá học viên",
          icon: ClipboardCheck,
        },
        {
          key: "teacher-exercises",
          to: "/teacher/exercises",
          label: "Bài tập cờ",
          icon: Swords,
        },
      ],
    },
    {
      key: "training",
      label: "Luyện tập cờ",
      items: [
        {
          key: "teacher-analysis",
          to: "/teacher/analysis",
          label: "Phân tích thế cờ",
          icon: Cpu,
        },
        {
          key: "teacher-puzzle-rush",
          to: "/teacher/training/puzzle-rush",
          label: "Puzzle Rush",
          icon: Flame,
        },
        {
          key: "teacher-puzzle-survival",
          to: "/teacher/training/puzzle-survival",
          label: "Puzzle Survival",
          icon: Trophy,
        },
        {
          key: "teacher-daily-puzzle",
          to: "/teacher/training/daily",
          label: "Daily Puzzle",
          icon: CalendarCheck,
        },
      ],
    },
    {
      key: "system",
      label: "Hệ thống",
      items: [
        {
          key: "teacher-notifications",
          to: "/teacher/notifications",
          label: "Thông báo",
          icon: Bell,
          indicator: "notification-unread",
        },
        {
          key: "teacher-chat",
          to: "/teacher/chat",
          label: "Tư vấn trực tuyến",
          icon: MessageCircle,
          indicator: "chat-unread",
        },
        {
          key: "teacher-settings",
          to: "/teacher/settings",
          label: "Cài đặt",
          icon: Settings,
        },
      ],
    },
  ],
};

const PARENT_MENU = {
  role: "parent",
  sections: [
    {
      key: "overview",
      label: null,
      items: [
        {
          key: "parent-dashboard",
          to: "/parent/dashboard",
          label: "Tổng quan",
          icon: Home,
          end: true,
        },
      ],
    },
    {
      key: "study",
      label: "Học tập của con",
      items: [
        {
          key: "parent-schedule",
          to: "/parent/schedule",
          label: "Lịch học con",
          icon: Calendar,
        },
        {
          key: "parent-progress",
          to: "/parent/progress",
          label: "Tiến độ học tập",
          icon: LineChart,
        },
        {
          key: "parent-courses",
          to: "/parent/courses",
          label: "Khóa học của tôi",
          icon: PlayCircle,
        },
        {
          key: "parent-daily",
          to: "/parent/daily-exercises",
          label: "Bài tập hôm nay",
          icon: BookOpenCheck,
        },
      ],
    },
    {
      key: "system",
      label: "Hệ thống",
      items: [
        {
          key: "parent-notifications",
          to: "/parent/notifications",
          label: "Thông báo",
          icon: Bell,
          indicator: "notification-unread",
        },
        {
          key: "parent-chat",
          to: "/parent/chat",
          label: "Tư vấn trực tuyến",
          icon: MessageCircle,
          indicator: "chat-unread",
        },
      ],
    },
  ],
};

const STUDENT_MENU = {
  role: "student",
  sections: [
    {
      key: "overview",
      label: null,
      items: [
        {
          key: "student-dashboard",
          to: "/student/dashboard",
          label: "Tổng quan",
          icon: LayoutDashboard,
          end: true,
        },
      ],
    },
    {
      key: "study",
      label: "Học tập",
      items: [
        {
          key: "student-schedule",
          to: "/student/schedule",
          label: "Lịch học",
          icon: Calendar,
        },
        {
          key: "student-courses",
          to: "/student/courses",
          label: "Khoá học của tôi",
          icon: BookOpen,
        },
        {
          key: "student-daily",
          to: "/student/daily-exercises",
          label: "Bài tập hôm nay",
          icon: BookOpenCheck,
        },
      ],
    },
    {
      key: "training",
      label: "Luyện tập cờ",
      items: [
        {
          key: "student-analysis",
          to: "/student/analysis",
          label: "Phân tích thế cờ",
          icon: Cpu,
        },
        {
          key: "student-puzzle-rush",
          to: "/student/training/puzzle-rush",
          label: "Puzzle Rush",
          icon: Flame,
        },
        {
          key: "student-puzzle-survival",
          to: "/student/training/puzzle-survival",
          label: "Puzzle Survival",
          icon: Trophy,
        },
        {
          key: "student-daily-puzzle",
          to: "/student/training/daily",
          label: "Daily Puzzle",
          icon: CalendarCheck,
        },
      ],
    },
    {
      key: "account",
      label: "Tài khoản",
      items: [
        {
          key: "student-tuition",
          to: "/student/tuition",
          label: "Học phí",
          icon: Wallet,
        },
        {
          key: "student-profile",
          to: "/student/profile",
          label: "Hồ sơ",
          icon: UserCircle,
        },
      ],
    },
    {
      key: "system",
      label: "Hệ thống",
      items: [
        {
          key: "student-notifications",
          to: "/student/notifications",
          label: "Thông báo",
          icon: Bell,
          indicator: "notification-unread",
        },
        {
          key: "student-chat",
          to: "/student/chat",
          label: "Tư vấn trực tuyến",
          icon: MessageCircle,
          indicator: "chat-unread",
        },
      ],
    },
  ],
};

export const MENU_CONFIGS = Object.freeze({
  admin: ADMIN_MENU,
  teacher: TEACHER_MENU,
  parent: PARENT_MENU,
  student: STUDENT_MENU,
});

export const getMenuByRole = (role) => {
  const normalized = String(role || "").toLowerCase();
  return MENU_CONFIGS[normalized] || null;
};

export const flattenMenuItems = (menuConfig) => {
  if (!menuConfig?.sections) return [];
  return menuConfig.sections.flatMap((section) =>
    (section.items || []).map((item) => ({ ...item, sectionKey: section.key })),
  );
};
