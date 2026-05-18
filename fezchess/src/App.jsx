import { lazy, Suspense, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/common/ProtectedRoute";
import ErrorBoundary from "./components/common/ErrorBoundary";
import NotFoundPage from "./components/common/NotFoundPage";

// Admin Pages
import TeacherList from "./pages/Admin/Teachers/TeacherList";
import TeacherForm from "./pages/Admin/Teachers/TeacherForm";
import StudentList from "./pages/Admin/Students/StudentList";
import StudentForm from "./pages/Admin/Students/StudentForm";
import StudentDetail from "./pages/Admin/Students/StudentDetail";
import ClassList from "./pages/Admin/Classes/ClassList";
import ClassForm from "./pages/Admin/Classes/ClassForm";
import Finance from "./pages/Admin/Finance/Finance";
import Attendance from "./pages/Admin/Attendance/Attendance";
import EnrollmentList from "./pages/Admin/Enrollments/EnrollmentList";
import EnrollmentForm from "./pages/Admin/Enrollments/EnrollmentForm";
import Schedule from "./pages/Admin/Schedule/Schedule";
import ParentList from "./pages/Admin/Parents/ParentList";
import ParentForm from "./pages/Admin/Parents/ParentForm";
import ProgressList from "./pages/Admin/Progress/ProgressList";
import ProgressDetail from "./pages/Admin/Progress/ProgressDetail";
import ProgressLessonTemplateAdmin from "./pages/Admin/Progress/ProgressLessonTemplateAdmin";
import PostList from "./pages/Admin/CMS/PostList";
import PostForm from "./pages/Admin/CMS/PostForm";
import TestimonialList from "./pages/Admin/CMS/TestimonialList";
import TestimonialForm from "./pages/Admin/CMS/TestimonialForm";
import InquiryList from "./pages/Admin/CRM/InquiryList";
import AdminCourseList from "./pages/Admin/Courses/AdminCourseList";
import AdminCourseForm from "./pages/Admin/Courses/AdminCourseForm";

import SystemSettings from "./pages/Admin/Settings/SystemSettings";

// Public Pages
import CourseStorePage from "./pages/public/CourseStorePage";
import CourseDetail from "./pages/public/CourseDetail";
import CourseCheckoutPage from "./pages/public/CourseCheckoutPage";

// Layouts
import ParentLayout from "./layouts/ParentLayout";
import TeacherLayout from "./layouts/TeacherLayout";
import StudentLayout from "./layouts/StudentLayout";
import PublicLayout from "./components/layout/PublicLayout"; // Using the component version

// Portal Pages
import ParentSchedule from "./pages/portal/Parent/ParentSchedule";
import ParentProgressView from "./pages/portal/Parent/ParentProgressView";
import ParentMyCourses from "./pages/portal/Parent/ParentMyCourses";

import TeachingLogList from "./pages/portal/Teacher/Payroll/TeachingLogList";
import AssessmentList from "./pages/portal/Teacher/Assessment/AssessmentList";
import TeacherClassList from "./pages/portal/Teacher/Classes/TeacherClassList";
import TeacherClassDetail from "./pages/portal/Teacher/Classes/TeacherClassDetail";
import TeacherAttendance from "./pages/portal/Teacher/Attendance/TeacherAttendance";
import TeacherSchedule from "./pages/portal/Teacher/Schedule/TeacherSchedule";
import TeacherSettings from "./pages/portal/Teacher/Settings/TeacherSettings";

import StudentSchedule from "./pages/portal/Student/Schedule/StudentSchedule";
import StudentProfile from "./pages/portal/Student/Profile/StudentProfile";
import MyCourses from "./pages/portal/Student/MyCourses";
import TuitionPage from "./pages/portal/Student/Tuition/TuitionPage";
import StudentPuzzleTodayPage from "./pages/shared/Exercises/StudentPuzzleTodayPage";

// Auth & Public
import Login from "./pages/auth/Login/Login";
import Signup from "./pages/auth/Signup/Signup";
import HomePage from "./pages/public/HomePage";
import NewsPage from "./pages/public/NewsPage";
import PostDetail from "./pages/public/PostDetail";
import ContactPage from "./pages/public/ContactPage";
import TeacherPage from "./pages/public/TeacherPage";
import TeacherDetailPage from "./pages/public/TeacherDetailPage";
import PrivacyPolicyPage from "./pages/public/PrivacyPolicyPage";
import TermsOfUsePage from "./pages/public/TermsOfUsePage";
import { Toaster, toast } from "sonner";
import { SystemSettingsProvider } from "./context/SystemSettingsContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { TooltipProvider } from "./components/ui";
import { PublicCmsProvider } from "./context/PublicCmsContext";
import FloatingSocialButtons from "./components/common/FloatingSocialButtons";
import CrudRealtimeBridge from "./components/common/CrudRealtimeBridge";

const LearningPage = lazy(() => import("./pages/public/LearningPage"));
const ChatPage = lazy(() => import("./pages/shared/Chat/ChatPage"));
const AdminPayroll = lazy(() => import("./pages/Admin/Payroll/AdminPayroll"));
const PdfPuzzleImportPage = lazy(() => import("./pages/AdminImport/PdfPuzzleImportPage"));
const NotificationListPage = lazy(
  () => import("./pages/shared/Notifications/NotificationListPage"),
);
const NotificationDetailPage = lazy(
  () => import("./pages/shared/Notifications/NotificationDetailPage"),
);
const AdminNotificationCreate = lazy(
  () => import("./pages/Admin/Notifications/AdminNotificationCreate"),
);
const Dashboard = lazy(() => import("./pages/Admin/Dashboard/MainDashboard"));
const HeroSettingForm = lazy(() => import("./pages/Admin/CMS/HeroSettingForm"));
const AnalysisPage = lazy(() => import("./features/analysis/pages/AnalysisPage"));
const PuzzleRushPage = lazy(
  () => import("./features/training/pages/PuzzleRushPage"),
);
const PuzzleSurvivalPage = lazy(
  () => import("./features/training/pages/PuzzleSurvivalPage"),
);
const DailyPuzzlePage = lazy(
  () => import("./features/training/pages/DailyPuzzlePage"),
);
const TrainingHubPage = lazy(
  () => import("./features/training/pages/TrainingHubPage"),
);
const LiveGamePage = lazy(() => import("./features/play/pages/LiveGamePage"));

const CmsSuspenseFallback = () => (
  <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
    Đang mở Public CMS Builder...
  </div>
);

const withCmsSuspense = (element) => (
  <Suspense fallback={<CmsSuspenseFallback />}>{element}</Suspense>
);
const ParentDashboard = lazy(() => import("./pages/portal/Parent/ParentDashboard"));
const TeacherDashboard = lazy(
  () => import("./pages/portal/Teacher/Dashboard/TeacherDashboard"),
);
const StudentDashboard = lazy(
  () => import("./pages/portal/Student/Dashboard/StudentDashboard"),
);

const DashboardSuspenseFallback = () => (
  <div className="space-y-4 md:space-y-6">
    <div className="h-24 rounded-2xl bg-muted/50 animate-pulse" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-32 rounded-2xl bg-muted/50 animate-pulse" />
      ))}
    </div>
    <div className="h-72 rounded-2xl bg-muted/50 animate-pulse" />
  </div>
);

const withDashboardSuspense = (element) => (
  <Suspense fallback={<DashboardSuspenseFallback />}>{element}</Suspense>
);

const ChatPageRoute = () => (
  <Suspense
    fallback={
      <div className="min-h-screen bg-background py-20 text-center text-foreground">
        Đang tải hộp thoại...
      </div>
    }
  >
    <ChatPage />
  </Suspense>
);

const ChessSuspenseFallback = ({ label = "Đang khởi động bàn cờ..." }) => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-200">
    {label}
  </div>
);

const withChessSuspense = (element, label) => (
  <Suspense fallback={<ChessSuspenseFallback label={label} />}>
    {element}
  </Suspense>
);

const withNotificationSuspense = (element) => (
  <Suspense
    fallback={
      <div className="min-h-screen bg-background py-20 text-center text-foreground">
        Đang tải thông báo...
      </div>
    }
  >
    {element}
  </Suspense>
);

const ThemedToaster = () => {
  const { isDark } = useTheme();
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      theme={isDark ? "dark" : "light"}
      toastOptions={{
        className: "themed-toast",
      }}
    />
  );
};

function App() {
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const originalAlert = window.alert;
    window.alert = (message) => {
      const text = String(message || "").trim() || "Có thông báo mới";
      const lowered = text.toLowerCase();
      if (
        lowered.includes("lỗi") ||
        lowered.includes("thất bại") ||
        lowered.includes("không thể") ||
        lowered.includes("không hợp lệ")
      ) {
        toast.error(text);
        return;
      }
      if (lowered.includes("thành công") || lowered.includes("đã lưu")) {
        toast.success(text);
        return;
      }
      toast.message(text);
    };
    return () => {
      window.alert = originalAlert;
    };
  }, []);

  return (
    <Router>
      <ErrorBoundary>
        <ThemeProvider>
          <TooltipProvider>
          <SystemSettingsProvider>
            <PublicCmsProvider>
              <ThemedToaster />
              <FloatingSocialButtons />
              <CrudRealtimeBridge />
              <Routes>
            {/* Public Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route
                path="/test-register"
                element={<Navigate to="/contact" replace />}
              />
              <Route path="/courses" element={<CourseStorePage />} />
              <Route path="/courses/:slug/checkout" element={<CourseCheckoutPage />} />
              <Route path="/courses/:slug" element={<CourseDetail />} />
              <Route
                path="/learning/:courseSlug/:lessonId"
                element={
                  <Suspense
                    fallback={
                      <div className="min-h-screen bg-background py-20 text-center text-foreground">
                        Đang tải bài học...
                      </div>
                    }
                  >
                    <LearningPage />
                  </Suspense>
                }
              />

              <Route path="/news" element={<NewsPage />} />
              <Route path="/news/:slug" element={<PostDetail />} />
              <Route path="/teachers" element={<TeacherPage />} />
              <Route path="/teachers/:id" element={<TeacherDetailPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/terms-of-use" element={<TermsOfUsePage />} />
              <Route
                path="/analysis"
                element={withChessSuspense(
                  <AnalysisPage />,
                  "Đang khởi động Analysis Board...",
                )}
              />
              <Route
                path="/training"
                element={
                  <Suspense
                    fallback={
                      <div className="min-h-screen bg-slate-950 py-20 text-center text-slate-300">
                        Đang tải…
                      </div>
                    }
                  >
                    <TrainingHubPage />
                  </Suspense>
                }
              />
              <Route
                path="/play/live"
                element={withChessSuspense(
                  <LiveGamePage />,
                  "Đang mở phòng đối kháng…",
                )}
              />
              <Route
                path="/play/live/:code"
                element={withChessSuspense(
                  <LiveGamePage />,
                  "Đang mở phòng đối kháng…",
                )}
              />
              <Route
                path="/training/puzzle-rush"
                element={withChessSuspense(
                  <PuzzleRushPage />,
                  "Đang chuẩn bị Puzzle Rush...",
                )}
              />
              <Route
                path="/training/puzzle-survival"
                element={withChessSuspense(
                  <PuzzleSurvivalPage />,
                  "Đang chuẩn bị Puzzle Survival...",
                )}
              />
              <Route
                path="/training/daily"
                element={withChessSuspense(
                  <DailyPuzzlePage />,
                  "Đang chuẩn bị Daily Puzzle...",
                )}
              />
            </Route>

            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Admin Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <MainLayout>{withDashboardSuspense(<Dashboard />)}</MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/teachers"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <MainLayout>
                    <TeacherList />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/teachers/new"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <MainLayout>
                    <TeacherForm />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/teachers/:id/edit"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <MainLayout>
                    <TeacherForm />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/students"
              element={<Navigate to="/students" replace />}
            />
            <Route
              path="/admin/students/create"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <MainLayout>
                    <StudentForm />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/students/:id"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <MainLayout>
                    <StudentDetail />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/students/:id/edit"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <MainLayout>
                    <StudentForm />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/students"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <MainLayout>
                    <StudentList />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/students/new"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <MainLayout>
                    <StudentForm />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/students/create"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <MainLayout>
                    <StudentForm />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/students/:id"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <MainLayout>
                    <StudentDetail />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/students/:id/edit"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <MainLayout>
                    <StudentForm />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/students/edit/:id"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <MainLayout>
                    <StudentForm />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/classes"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <MainLayout>
                    <ClassList />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/classes/new"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <MainLayout>
                    <ClassForm />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/classes/:id/edit"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <MainLayout>
                    <ClassForm />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/parents"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <MainLayout>
                    <ParentList />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/parents/new"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <MainLayout>
                    <ParentForm />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/parents/:id"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <MainLayout>
                    <ParentForm />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/enrollments"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <MainLayout>
                    <EnrollmentList />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/enrollments/new"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <MainLayout>
                    <EnrollmentForm />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/enrollments/:id/edit"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <MainLayout>
                    <EnrollmentForm />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/schedule"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <MainLayout>
                    <Schedule />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <MainLayout>
                    <Attendance />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/finance"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <MainLayout>
                    <Finance />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/progress"
              element={
                <ProtectedRoute allowedRoles={["Admin", "Teacher"]}>
                  <MainLayout>
                    <ProgressList />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/progress/:studentId/:classId"
              element={
                <ProtectedRoute allowedRoles={["Admin", "Teacher"]}>
                  <MainLayout>
                    <ProgressDetail />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/progress-lesson-templates"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <MainLayout>
                    <ProgressLessonTemplateAdmin />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            {/* CMS & CRM */}
            <Route
              path="/cms/posts"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <MainLayout>
                    <PostList />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cms/posts/new"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <MainLayout>
                    <PostForm />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cms/posts/:id/edit"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <MainLayout>
                    <PostForm />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cms/testimonials"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <MainLayout>
                    <TestimonialList />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cms/testimonials/new"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <MainLayout>
                    <TestimonialForm />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cms/testimonials/:id/edit"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <MainLayout>
                    <TestimonialForm />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cms/hero"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <MainLayout>
                    {withCmsSuspense(<HeroSettingForm />)}
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/crm/inquiries"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <MainLayout>
                    <InquiryList />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            {/* Admin Courses */}
            <Route
              path="/admin/courses"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <MainLayout>
                    <AdminCourseList />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/courses/new"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <MainLayout>
                    <AdminCourseForm />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/courses/:id/edit"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <MainLayout>
                    <AdminCourseForm />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/exercises"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <MainLayout>
                    <Suspense
                      fallback={
                        <div className="min-h-screen bg-background py-20 text-center text-foreground">
                          Đang tải import puzzle...
                        </div>
                      }
                    >
                      <PdfPuzzleImportPage />
                    </Suspense>
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/payroll"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <MainLayout>
                    <Suspense
                      fallback={
                        <div className="min-h-screen bg-background py-20 text-center text-foreground">
                          Đang tải bảng lương...
                        </div>
                      }
                    >
                      <AdminPayroll />
                    </Suspense>
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/notifications"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <MainLayout>
                    {withNotificationSuspense(
                      <NotificationListPage basePath="/admin/notifications" />,
                    )}
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/notifications/new"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <MainLayout>
                    {withNotificationSuspense(<AdminNotificationCreate />)}
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/notifications/:id"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <MainLayout>
                    {withNotificationSuspense(
                      <NotificationDetailPage basePath="/admin/notifications" />,
                    )}
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <MainLayout>
                    <SystemSettings />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/chat"
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <MainLayout>
                    <ChatPageRoute />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            {/* Teacher Routes */}
            <Route
              path="/teacher"
              element={<Navigate to="/teacher/dashboard" replace />}
            />
            <Route
              path="/teacher/*"
              element={
                <ProtectedRoute allowedRoles={["Teacher"]}>
                  <TeacherLayout>
                    <Routes>
                      <Route
                        path="dashboard"
                        element={withDashboardSuspense(<TeacherDashboard />)}
                      />
                      <Route path="classes" element={<TeacherClassList />} />
                      <Route
                        path="classes/:classId"
                        element={<TeacherClassDetail />}
                      />
                      <Route
                        path="attendance"
                        element={<TeacherAttendance />}
                      />
                      <Route path="schedule" element={<TeacherSchedule />} />
                      <Route path="payroll" element={<TeachingLogList />} />
                      <Route path="assessments" element={<AssessmentList />} />
                      <Route
                        path="exercises"
                        element={
                          <Suspense
                            fallback={
                              <div className="p-10 text-center text-foreground">
                                Đang tải import puzzle...
                              </div>
                            }
                          >
                            <PdfPuzzleImportPage />
                          </Suspense>
                        }
                      />
                      <Route path="settings" element={<TeacherSettings />} />
                      <Route path="chat" element={<ChatPageRoute />} />
                      <Route
                        path="analysis"
                        element={withChessSuspense(<AnalysisPage />)}
                      />
                      <Route
                        path="training/puzzle-rush"
                        element={withChessSuspense(<PuzzleRushPage />)}
                      />
                      <Route
                        path="training/puzzle-survival"
                        element={withChessSuspense(<PuzzleSurvivalPage />)}
                      />
                      <Route
                        path="training/daily"
                        element={withChessSuspense(<DailyPuzzlePage />)}
                      />
                      <Route
                        path="notifications"
                        element={withNotificationSuspense(
                          <NotificationListPage basePath="/teacher/notifications" />,
                        )}
                      />
                      <Route
                        path="notifications/:id"
                        element={withNotificationSuspense(
                          <NotificationDetailPage basePath="/teacher/notifications" />,
                        )}
                      />
                      <Route
                        path="*"
                        element={
                          <div className="p-10">Trang giáo viên đang được cập nhật</div>
                        }
                      />
                    </Routes>
                  </TeacherLayout>
                </ProtectedRoute>
              }
            />

            {/* Parent Routes */}
            <Route
              path="/parent"
              element={<Navigate to="/parent/dashboard" replace />}
            />
            <Route
              path="/parent/*"
              element={
                <ProtectedRoute allowedRoles={["Parent"]}>
                  <ParentLayout>
                    <Routes>
                      <Route
                        path="dashboard"
                        element={withDashboardSuspense(<ParentDashboard />)}
                      />
                      <Route path="schedule" element={<ParentSchedule />} />
                      <Route path="courses" element={<ParentMyCourses />} />
                      <Route path="progress" element={<ParentProgressView />} />
                      <Route path="daily-exercises" element={<StudentPuzzleTodayPage />} />
                      <Route path="chat" element={<ChatPageRoute />} />
                      <Route
                        path="notifications"
                        element={withNotificationSuspense(
                          <NotificationListPage basePath="/parent/notifications" />,
                        )}
                      />
                      <Route
                        path="notifications/:id"
                        element={withNotificationSuspense(
                          <NotificationDetailPage basePath="/parent/notifications" />,
                        )}
                      />
                      <Route
                        path="*"
                        element={
                          <div className="p-10">Trang phụ huynh đang được cập nhật</div>
                        }
                      />
                    </Routes>
                  </ParentLayout>
                </ProtectedRoute>
              }
            />

            {/* Student Routes */}
            <Route
              path="/student"
              element={<Navigate to="/student/dashboard" replace />}
            />
            <Route
              path="/student/*"
              element={
                <ProtectedRoute allowedRoles={["Student"]}>
                  <StudentLayout>
                    <Routes>
                      <Route
                        path="dashboard"
                        element={withDashboardSuspense(<StudentDashboard />)}
                      />
                      <Route path="schedule" element={<StudentSchedule />} />
                      <Route path="profile" element={<StudentProfile />} />
                      <Route path="courses" element={<MyCourses />} />
                      <Route path="tuition" element={<TuitionPage />} />
                      <Route path="daily-exercises" element={<StudentPuzzleTodayPage />} />
                      <Route path="chat" element={<ChatPageRoute />} />
                      <Route
                        path="analysis"
                        element={withChessSuspense(<AnalysisPage />)}
                      />
                      <Route
                        path="training/puzzle-rush"
                        element={withChessSuspense(<PuzzleRushPage />)}
                      />
                      <Route
                        path="training/puzzle-survival"
                        element={withChessSuspense(<PuzzleSurvivalPage />)}
                      />
                      <Route
                        path="training/daily"
                        element={withChessSuspense(<DailyPuzzlePage />)}
                      />
                      <Route
                        path="notifications"
                        element={withNotificationSuspense(
                          <NotificationListPage basePath="/student/notifications" />,
                        )}
                      />
                      <Route
                        path="notifications/:id"
                        element={withNotificationSuspense(
                          <NotificationDetailPage basePath="/student/notifications" />,
                        )}
                      />
                      <Route
                        path="*"
                        element={
                          <div className="p-10">Trang học viên đang được cập nhật</div>
                        }
                      />
                    </Routes>
                  </StudentLayout>
                </ProtectedRoute>
              }
            />

              <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </PublicCmsProvider>
          </SystemSettingsProvider>
          </TooltipProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
