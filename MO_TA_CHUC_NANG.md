# Z CHESS - Tai lieu mo ta chuc nang he thong

> Phien ban cap nhat sau khi ra soat lai workspace `luaniudau`.
>
> Pham vi gom 3 service chinh:
> - `fezchess/` - Frontend React 19 + Vite + Tailwind + Socket.IO client
> - `zchess-be/` - Backend Node.js + Express 5 + MongoDB/Mongoose + Socket.IO
> - `python-service/` - Microservice FastAPI + OpenCV + PyMuPDF cho PDF/anh ban co
>
> Z CHESS la he thong quan ly trung tam dao tao co vua, gom website cong khai, LMS hoc co, quan tri van hanh, tai chinh, bang luong, chat realtime, notification realtime, CMS no-code va pipeline PDF/anh -> FEN -> puzzle.

---

## 1. Kien truc tong quan

```text
                +-------------------------------+
                |  Public visitors / Browsers   |
                +---------------+---------------+
                                |
                                | HTTPS
                                v
        +------------------------------------------------------+
        |  fezchess (React 19, Vite, Tailwind, Sonner)        |
        |  - Public / Admin / Teacher / Parent / Student      |
        |  - Feature modules: dashboard, cms, chat, learning  |
        |    payroll, notifications, puzzle-import            |
        |  - Axios refresh token tu dong                      |
        |  - Socket.IO client cho chat + notification         |
        +---------------+--------------------------+-----------+
                        | REST /api/*              | WebSocket
                        v                          v
        +--------------------------------------------------+
        |  zchess-be (Express 5, Mongoose, Socket.IO)      |
        |  - Routes/controllers theo domain nghiep vu      |
        |  - Modules moi: payroll, puzzles, notifications  |
        |  - JWT access + refresh cookie httpOnly          |
        |  - Helmet, hpp, sanitize, rate-limit             |
        |  - Socket room user:<id>                         |
        |  - Proxy sang python-service de detect FEN       |
        +----------------+--------------------+------------+
                         |                    |
                         v                    v
        +-----------------------+   +----------------------+
        |  MongoDB              |   |  python-service      |
        |  Users, Courses,      |   |  FastAPI :8001       |
        |  Lessons, Classes,    |   |  GET /health         |
        |  Puzzles, Orders,     |   |  POST /extract-fen   |
        |  Notifications,       |   |  PDF/image -> FEN    |
        |  Messages, Settings   |   +----------------------+
        +-----------------------+
```

### Diem thiet ke cot loi

- Frontend dang chuyen sang feature-based architecture: cac module lon da duoc tach vao `src/features/*`, cac file legacy trong `src/pages/*` chu yeu la adapter/re-export.
- Navigation system da thong nhat: Admin/Teacher/Parent/Student dung chung `AppShell`, menu config, command palette, global activity indicator, unread chat/notification badges.
- Dashboard system da modular hoa: dashboard theo role dung widget, card, chart frame, query cache va facade service rieng.
- Public CMS editor da tro thanh no-code content editor: schema-driven blocks, central store, undo/redo, dirty tracking, autosave draft, media uploader va live preview.
- Backend van la monolith Express, nhung dang refactor dan theo module: payroll, puzzles va notifications da co service/repository/job/broadcaster ro hon.
- Realtime tap trung qua Socket.IO: notification, chat, online/offline, typing, read receipt.
- PDF/anh ban co tach sang Python service: Node giu business flow, Python xu ly computer vision.

---

## 2. Stack va phu thuoc chinh

### Frontend `fezchess`

- React 19, Vite, React Router DOM 7.
- Tailwind CSS, Framer Motion, Sonner, Lucide, Heroicons.
- Axios client co interceptor refresh token chu dong.
- Socket.IO client cho chat, notification, online status.
- Recharts cho dashboard/finance charts.
- `chess.js` va `react-chessboard` cho lesson co vua va puzzle.
- `clsx`, `tailwind-merge` cho UI utility.

### Backend `zchess-be`

- Express 5, Mongoose 9, MongoDB.
- JWT access token + refresh token, bcryptjs, cookie-parser.
- Bao mat: Helmet, hpp, express-mongo-sanitize, express-rate-limit, request sanitizer.
- Upload: Multer 2, static `/uploads`.
- Xu ly file/bao cao: pdf-parse, ExcelJS, PDFKit, docx.
- Realtime: Socket.IO 4.
- Chess validation/parser: chess.js.

### Python service

- FastAPI, Uvicorn, python-multipart.
- OpenCV, NumPy.
- PyMuPDF de render PDF thanh image.

---

## 3. Phan quyen va vai tro

`ProtectedRoute` chan route theo `allowedRoles`, redirect ve `/login` neu chua dang nhap va ve `/` neu sai role. Backend dung `protect`, `optionalProtect`, `authorize(...roles)`.

| Vai tro | Pham vi su dung | Layout frontend |
| --- | --- | --- |
| Admin | Quan tri toan he thong: user, lop, khoa hoc, hoc phi, luong, CMS, puzzle, notification, chat | `MainLayout` -> `AppShell role="admin"` |
| Teacher | Lop cua minh, ca day, diem danh, danh gia, bai tap co, lich day | `TeacherLayout` -> `AppShell role="teacher"` |
| Parent | Lich hoc cua con, khoa hoc da mua, bai tap hom nay cua con, chat voi Admin, thong bao | `ParentLayout` -> `AppShell role="parent"` |
| Student | Lich hoc, ho so, khoa hoc cua toi, bai tap hom nay, chat voi Admin | `StudentLayout` -> `AppShell role="student"` |
| Guest | Trang chu, khoa hoc, bai viet, giao vien, lien he, dieu khoan | `PublicLayout` |

---

## 4. Backend - Module nghiep vu

### 4.1. Authentication va User

- `POST /api/auth/signup`: dang ky public, mac dinh role Parent.
- `POST /api/auth/signin`: dang nhap bang username/email, tra access token va set cookie.
- `POST /api/auth/signout`: mark offline, xoa cookie.
- `POST /api/auth/refresh`: rolling refresh token.
- `GET /api/users/me`: lay user hien tai.
- Admin co the tao/sua/xoa user, teacher, lay danh sach online, activity status.
- Middleware cap nhat `lastSeenAt`, `isOnline`, kiem tra role va sanitize request.

### 4.2. Khoa hoc, chuong, bai hoc

- `Course`: title, slug, level, category, price/salePrice, thumbnail, heroBackground, instructor, published status.
- `Chapter` thuoc course, `Lesson` thuoc chapter va denormalize `courseId`.
- Lesson ho tro `video`, `text`, `quiz`, `chess`.
- Lesson chess co `initialFen`, `initialPgn`, `initialMoves`, `initialMoveNotes`, `chessMode`, `exerciseMode`, `chessBackgroundUrl`.
- Quyen xem noi dung dua tren `CourseAccess` hoac `Order.completed`.
- Neu user chua co quyen, Course Detail chi hien lesson title/lesson count, an content.
- `LessonChessProgress` luu FEN/PGN/moves rieng theo user.

### 4.3. Lop hoc, ghi danh, diem danh, lich hoc

- `Class`: classId, className, fee, level, maxStudents, totalSessions, teacherId, scheduleSlots, room, studentIds.
- `Enrollment`: enrollmentId, paymentStatus, status, sessionsTotal, sessionsUsed.
- Attendance chi hop le neu hoc vien thuoc lop va ngay diem danh trung `scheduleSlots.day`.
- Khi doi trang thai present/absent, backend cap nhat atomic thong ke hoc vien.
- Schedule loc theo role: Teacher thay lop cua minh, Parent thay lop cua con, Student thay lop minh hoc.

### 4.4. Tai chinh, doanh thu, chi phi, don hang

- Models: `Revenue`, `Expense`, `Payment`, `FinancialReport`, `Order`, `Enrollment`.
- Finance stats tinh doanh thu, chi phi, loi nhuan, doanh thu khoa hoc theo thang.
- Co chart 6 thang, cost structure, transactions, export CSV.
- Thanh toan hoc phi tao `Revenue` va set `Enrollment.paymentStatus = paid`.
- Order pending gui notification cho Admin.
- Admin duyet order completed se cap `CourseAccess`, set `paidAt`, gui notification cho phu huynh.

### 4.5. Bang luong

- Model chinh: `TeachingLog`.
- Teacher co the tao ca day cua lop minh nhung khong duoc set salary.
- Admin co the tao ca, import Excel, cap nhat salary, bonus, deduction, other cost, reset salary, xem summary.
- Export payslip Excel/PDF co logo va font Unicode fallback.
- Backend da tach module:
  - `modules/payroll/services/payrollService.js`
  - `modules/payroll/repositories/payrollRepository.js`
  - `modules/payroll/calculators/payrollCalculator.js`
  - `modules/payroll/validators/payrollValidator.js`

### 4.6. Bai tap co va puzzle

#### ChessExercise gan voi lesson

- Routes: `/api/chess-exercises`.
- Import tu PGN/FEN/image trong luc soan lesson.
- Model `ChessExercise`: startFen, solutionSan/Uci, hintText, explanation, difficulty, tags, parseWarnings, status.
- Publish can co solution.
- Hoc vien submit dap an; backend chuyen answer sang UCI de so sanh.
- `ChessExerciseAttempt` luu attemptCount, isSolved, solvedAt.
- Hint da cap: ky tu dau, o dich, ...

#### ExerciseAssignment - bai tap hang ngay

- Routes: `/api/exercise-assignments`.
- Admin/Teacher tao assignment cho student/class.
- Co flow auto-from-pdf bang text extraction va FEN/PGN heuristic.
- `ExerciseAssignmentProgress` luu submissions, solvedPuzzles, accuracy, timeSpentSec, latestSubmittedFen.
- Parent/Student xem `/my-today`, nop FEN/PGN/moves qua `submit-board`.

#### PDF/Image Puzzle pipeline

- Admin/Teacher upload PDF/anh, backend goi Python service detect FEN.
- `POST /api/admin/puzzle/preview`: tao preview detection.
- `GET /api/admin/puzzle/preview-jobs/:jobId`: theo doi job preview bat dong bo.
- `POST /api/admin/puzzle/confirm`: luu puzzle da chon/sua.
- `POST /api/admin/assign`: giao puzzle cho hoc vien/lop.
- `GET /api/student/assignments/today`: Parent/Student lay bai hom nay.
- `POST /api/student/attempt/:puzzleId/move`: nop tung nuoc SAN, backend validate bang chess.js va luu FEN truoc/sau.
- Backend module moi:
  - `modules/puzzles/services/puzzleDetectionService.js`
  - `modules/puzzles/services/puzzleImportService.js`
  - `modules/puzzles/services/puzzleAssignmentService.js`
  - `modules/puzzles/services/puzzleDetectionJobService.js`
  - `modules/puzzles/vision/pythonVisionClient.js`

### 4.7. Notification realtime

- Models: `Notification`, `NotificationRecipient`.
- Admin tao notification theo target role/user.
- Backend fanout thanh recipient rieng cho tung user.
- User fetch feed/detail, mark read, mark all read.
- Socket broadcast `notification:new` den room `user:<id>`.
- Module backend:
  - `modules/notifications/services/notificationFanoutService.js`
  - `modules/notifications/services/notificationFeedService.js`
  - `modules/notifications/jobs/notificationDeliveryJob.js`
  - `modules/notifications/broadcasters/socketNotificationBroadcaster.js`

### 4.8. Chat realtime

- Model `Message`: senderId, recipientId, content, imageUrl, readAt.
- Business rule: chi Admin chat voi Teacher/Parent/Student. Khong cho Teacher chat Parent truc tiep.
- Endpoints:
  - `GET /api/chat/contacts`
  - `GET /api/chat/messages/:userId`
  - `POST /api/chat/messages`
  - `GET /api/chat/unread-summary`
- Socket events: `message:new`, `message:sent`, `message:markRead`, `message:read`, `message:typing`, `message:stopTyping`, `user:online`, `user:offline`, `user:status`.
- Frontend da co optimistic UI va dedupe message de tranh race REST/socket tao duplicate key.

### 4.9. Public CMS, settings, content

- `Setting` singleton chua thong tin trung tam, logo, QR, announcement, banking, publicCms.
- `publicCms` gom theme, home, courseStore, courseDetail, teachersPage, newsPage, contactPage.
- `GET /api/settings/public-cms/public`: public CMS cho trang cong khai.
- `PATCH /api/settings/public-cms`: admin update bang deep merge.
- `HeroSetting` legacy duoc giu va migrate vao `publicCms.home.hero` khi can.
- Post/news, testimonial, inquiry, lead, review phuc vu website va CRM.

### 4.10. Danh gia tien bo va phieu hoc tap

- `Progress`: 1 record theo hoc vien/lop, gom sessions, midTermEvaluation, finalTermEvaluation, teacherFeedback.
- `Assessment`: Regular, MidTerm, EndTerm.
- Teacher cham diem, Admin/Teacher xem tien do.
- Co export phieu hoc tap PDF/Word bang PDFKit/docx.

### 4.11. Upload va media

- `/api/upload/avatar`: avatar Admin/Teacher.
- `/api/upload/logo`, `/payment-qr`: logo va QR thanh toan.
- `/api/upload/public-cms-media`, `/course-image`, `/hero-media`: media public/CMS/course.
- `/api/upload/chat-image`: anh chat.
- Backend serve static `/uploads` de frontend load anh/video.

---

## 5. Frontend - Ban do giao dien

### 5.1. Routing tong

- Public: `/`, `/courses`, `/courses/:slug`, `/learning/:courseSlug/:lessonId`, `/news`, `/news/:slug`, `/teachers`, `/teachers/:id`, `/contact`, `/privacy-policy`, `/terms-of-use`.
- Auth: `/login`, `/signup`.
- Admin: dashboard, teachers, students, parents, classes, enrollments, schedule, attendance, finance, progress, courses, CMS posts/testimonials/Public CMS, CRM inquiries, exercises, payroll, notifications, settings, chat.
- Teacher: dashboard, classes, attendance, schedule, payroll sessions, assessments, exercises, settings, chat, notifications.
- Parent: dashboard, schedule, courses, progress, daily exercises, chat, notifications.
- Student: dashboard, schedule, profile, courses, daily exercises, chat, notifications.

### 5.2. Provider stack

```jsx
<Router>
  <ThemeProvider>
    <SystemSettingsProvider>
      <PublicCmsProvider>
        <ThemedToaster />
        <FloatingSocialButtons />
        <Routes />
      </PublicCmsProvider>
    </SystemSettingsProvider>
  </ThemeProvider>
</Router>
```

- `ThemeProvider`: light/dark theme foundation.
- `SystemSettingsProvider`: logo, hotline, announcement, QR, settings.
- `PublicCmsProvider`: public CMS data cho Home/Courses/Teachers/News/Contact.
- `window.alert` duoc intercept thanh toast.

### 5.3. Axios client

- Base URL: `/api` trong dev hoac `VITE_API_URL` khi build.
- `withCredentials: true`.
- Request interceptor refresh access token neu sap het han.
- Response interceptor retry 401 mot lan bang refresh token.
- Blob response duoc giu nguyen de export file.
- `localStorage.user` luu thong tin user/accessToken.

### 5.4. Navigation system

- `src/layouts/navigation/shell/AppShell.jsx` dung chung cho 4 role dang nhap.
- `menuConfig.js` cau hinh menu theo role, section, icon, route, indicator.
- Sidebar co collapsed state, mobile top bar, search trigger, command palette, keyboard shortcuts.
- Stores:
  - `sidebarStore`
  - `activityStore`
  - `chatUnreadStore`
- Header chung co notification bell, theme toggle, role label, logout.

---

## 6. Frontend - Feature modules da refactor

### 6.1. `features/dashboard`

- Dashboard theo role: Admin, Teacher, Parent, Student.
- UI primitives: `DashboardLayout`, `DashboardHeader`, `WidgetGrid`, `PeriodSwitcher`, `KpiCard`, `SectionCard`, `EmptyState`, `Skeleton`.
- Widgets:
  - Admin: KPI, revenue bar, level donut, recent enrollments.
  - Teacher: KPI, today schedule, class list, latest attendance, finance.
  - Parent: child switcher, stats, progress circle, leaderboard.
  - Student: KPI, upcoming classes, ELO line, homework.
- Charts: `ChartFrame`, `BarChartView`, `LineChartView`, `AreaChartView`, `DonutChartView`, `MountainRankChart`.
- `ChartFrame` dung ResizeObserver de tranh Recharts warning khi container chua co kich thuoc.
- Query cache nhe: TTL, dedupe request, subscribe.

### 6.2. `features/cms`

- Thay the `HeroSettingForm` monolithic bang Public CMS builder.
- Cau truc:
  - `schema/`: default publicCms va schema tabs/blocks/fields.
  - `stores/`: `editorStore` quan ly draft, savedSnapshot, history, status, dirtyPaths.
  - `hooks/`: field binding, autosave, media upload, hotkeys, store subscription.
  - `forms/`: text, textarea, color, media field, field renderer.
  - `blocks/`: block renderer/header.
  - `media/`: uploader, thumb.
  - `preview/`: live preview provider/frame/switcher.
  - `editors/`: sidebar, toolbar, canvas, root page.
- Chuc nang:
  - Live preview theo draft.
  - Autosave debounce.
  - Dirty indicator theo tab/field.
  - Undo/redo foundation.
  - Sticky save actions.
  - Media upload tai su dung.
  - Schema-driven extensibility cho dynamic blocks/page builder trong tuong lai.

### 6.3. `features/chat`

- Page: `features/chat/pages/ChatPage.jsx`.
- Controller: `useChatPageController`.
- Hooks: contacts, conversation, unread summary, typing, activity status, auto-scroll.
- Components: contact list, online panel, header, message list, bubble, input.
- Services: API service va socket client rieng.
- Utils: relative time, message grouping, optimistic message, dedupe `_id`.
- Da xu ly race REST/socket khi gui tin nhan de khong render duplicate key trong `MessageList`.

### 6.4. `features/notifications`

- Dung chung cho Admin/Teacher/Parent/Student.
- Pages: list, detail, admin create.
- Store ho tro:
  - hydrate co TTL
  - dedupe realtime
  - unread count
  - pagination cursor
  - mark read / mark all read
- Socket client subscribe `notification:new`.
- Notification bell va center dung chung trong header.

### 6.5. `features/learning`

- Lesson player cho public/authorized learning route.
- Controller tach logic load course/lesson, next/prev, lesson content, chess progress.
- Ho tro video, text, quiz, chess.
- Chess mode dung chess.js va react-chessboard, luu FEN/PGN/moves.

### 6.6. `features/payroll`

- Admin payroll page tach thanh controller, service, formatters, UI components.
- UI gom summary cards, toolbar, table, create session form, teacher payroll list.
- Ho tro filter theo teacher/month/year, import Excel, export payslip, update compensation.

### 6.7. `features/puzzle-import`

- Dung cho Admin va Teacher.
- Upload PDF/anh, preview detection, sua FEN, chon puzzle, confirm save.
- Chon hoc vien/lop, dat deadline, assign puzzle.
- FEN validation rieng.
- Ket noi backend preview job va confirm endpoints.

---

## 7. Cac trang va chuc nang noi bat

### Public website

- Home: hero, counters, courses, teachers, testimonials, CTA, contact sections.
- Course store: danh sach khoa hoc, filter/search theo CMS va API.
- Course detail: curriculum, instructor, pricing, access/buy CTA.
- Learning page: hoc lesson theo khoa, chess lesson co board va progress.
- News: danh sach va chi tiet bai viet.
- Teachers: danh sach va chi tiet giao vien.
- Contact: form inquiry, thong tin trung tam, ban do/thong tin lien he.
- Privacy Policy, Terms of Use.
- Floating buttons: Facebook, Zalo, hotline, back-to-top.

### Admin

- Dashboard SaaS-style.
- Quan ly giao vien, hoc vien, phu huynh.
- Quan ly lop, ghi danh, lich hoc, diem danh.
- Quan ly khoa hoc, chapter, lesson.
- Tai chinh, order, giao dich, hoc phi.
- Bang luong giao vien, import/export.
- CMS posts, testimonials, Public CMS editor, inquiries/leads.
- PDF puzzle import va giao bai.
- Notifications va chat.
- System settings.

### Teacher

- Dashboard giao vien.
- Lop cua toi, chi tiet lop, danh sach hoc vien.
- Diem danh, lich day, ca day.
- Danh gia hoc vien.
- Tao/giao bai tap co.
- Chat voi Admin, thong bao.
- Settings/profile.

### Parent

- Dashboard theo tung con.
- Lich hoc cua con.
- Khoa hoc da mua/duoc cap quyen.
- Progress cua con.
- Bai tap hom nay cua con.
- Chat voi Admin, thong bao.

### Student

- Dashboard hoc vien.
- Lich hoc, ho so, khoa hoc cua toi.
- Bai tap hom nay bang chessboard.
- Chat voi Admin, thong bao.

---

## 8. Python Vision Service

Endpoint:

| Method | Path | Muc dich |
| --- | --- | --- |
| GET | `/health` | Health check |
| POST | `/extract-fen` | Multipart file PDF/anh + `flip`, tra detections va failedDetections |

Pipeline:

1. PDF -> image bang PyMuPDF.
2. Detect ban co bang OpenCV contour.
3. Crop/normalize thanh board vuong.
4. Tach 64 o.
5. Template matching 13 template: wp, wn, wb, wr, wq, wk, bp, bn, bb, br, bq, bk, empty.
6. Build FEN.
7. Tra `fen`, `imagePreview`, `confidence`, `debug`.

Neu template thieu, service tu tao placeholder template, phu hop MVP nhung can nang cap neu can do chinh xac cao.

---

## 9. Bao mat va van hanh

- Helmet headers, CORS allowlist, hpp, sanitizer.
- Rate limit chung va rate limit rieng signin/signup/refresh.
- Cookie `httpOnly`, `secure` production, `sameSite` cau hinh qua env.
- JWT socket auth khi handshake.
- Upload co whitelist mime va gioi han dung luong theo endpoint.
- Static `/uploads` can chien luoc backup/cleanup khi production.
- Puzzle failure log ghi vao `logs/puzzle-detection-failures.log`.
- Migration scripts co trong `zchess-be/scripts`.

Bien moi truong chinh:

- `MONGO_URI`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `ACCESS_TOKEN_EXPIRES`
- `REFRESH_TOKEN_EXPIRES`
- `COOKIE_SAME_SITE`
- `CLIENT_URL`
- `NODE_ENV`
- `PORT`
- `PYTHON_VISION_URL`
- `ONLINE_USER_THRESHOLD_MINUTES`
- `PAYSLIP_FONT_REGULAR_PATH`
- `PAYSLIP_FONT_BOLD_PATH`
- `PAYSLIP_LOGO_PATH`

---

## 10. Cach chay dev

```bash
# Backend
cd zchess-be
npm install
npm run dev

# Python Vision
cd python-service
pip install -r requirements.txt
python main.py

# Frontend
cd fezchess
npm install
npm run dev
```

Backend mac dinh port `5000`, frontend Vite port `5173`, python-service port `8001`.

---

## 11. Mo hinh du lieu tom luoc

| Collection | Muc dich |
| --- | --- |
| `users` | User auth va role Admin/Teacher/Parent/Student |
| `students` | Ho so hoc vien, phu huynh, lop, tien do |
| `courses` | Khoa hoc |
| `chapters`, `lessons` | Cau truc noi dung khoa hoc |
| `courseaccesses` | Quyen xem noi dung khoa hoc |
| `courseprogresses` | Tien do hoc khoa |
| `lessonchessprogresses` | FEN/PGN/moves cho lesson chess |
| `classes` | Lop hoc va lich hoc |
| `enrollments` | Ghi danh, hoc phi, trang thai hoc |
| `attendances` | Diem danh |
| `progresses`, `assessments` | Danh gia va phieu hoc tap |
| `teachinglogs` | Ca day va bang luong |
| `revenues`, `expenses`, `payments`, `orders` | Tai chinh va mua khoa hoc |
| `chessexercises`, `chessexerciseattempts` | Bai tap co gan lesson |
| `exerciseassignments`, `exerciseassignmentprogresses` | Bai tap hang ngay |
| `puzzles`, `puzzleassignments`, `puzzleattempts` | Puzzle tu PDF/anh va ket qua lam bai |
| `notifications`, `notificationrecipients` | Thong bao multi-recipient |
| `messages` | Chat 1-1 |
| `settings` | System settings va Public CMS |
| `herosettings` | Legacy hero settings |
| `posts`, `testimonials`, `inquiries`, `leads`, `reviews` | Public content va CRM |

---

## 12. Cac luong nghiep vu quan trong

### 12.1. Mua va hoc khoa hoc

1. Guest xem danh sach/chi tiet khoa hoc.
2. Parent dang ky/dang nhap va tao order.
3. Admin duyet order thanh completed.
4. Backend cap `CourseAccess` va gui notification.
5. Parent/Student vao My Courses, mo lesson.
6. Lesson chess luu progress rieng theo user.

### 12.2. Giao va giai puzzle tu PDF

1. Admin/Teacher upload PDF/anh.
2. Backend tao preview job va goi python-service.
3. Frontend hien FEN, anh preview, confidence.
4. Nguoi dung sua FEN/chon puzzle hop le.
5. Confirm luu puzzle va assign cho hoc vien/lop.
6. Student/Parent giai tren chessboard.
7. Backend luu tung nuoc di va tinh accuracy/progress.

### 12.3. Public CMS no-code

1. Admin mo `/cms/hero`.
2. Frontend load `Setting.publicCms`.
3. `editorStore` tao draft va render theo schema.
4. Field update theo dot-path, dirty path duoc danh dau.
5. Autosave debounce patch len backend.
6. Preview inject draft vao `PublicCmsContext` de xem live.

### 12.4. Notification realtime

1. Admin tao notification.
2. Backend fanout thanh recipient.
3. Delivery job broadcast socket.
4. Frontend store ingest event, dedupe, cap nhat badge/feed.
5. User mark read/mark all read.

### 12.5. Chat realtime

1. User mo chat, load contacts/conversation.
2. Gui text/anh tao optimistic message.
3. REST luu message, Socket.IO broadcast.
4. Frontend upsert/dedupe de tranh duplicate.
5. Typing/read events dong bo qua socket.

---

## 13. Trang thai refactor hien tai

### Da refactor manh

- Frontend: LearningPage, ChatPage, AdminPayroll, PdfPuzzleImportPage.
- Phase UI: navigation/sidebar/layout system, dashboard system, Public CMS editor.
- Realtime: notification system, chat unread store, socket lifecycle.
- Backend: payroll module, puzzle module, notification fanout/delivery, mot phan course service.
- Performance: lazy loading routes, dashboard cache, autosave debounce, chart ResizeObserver, message dedupe.

### Con legacy can refactor tiep

- Admin Finance van la component lon, nen tach controller hook/service/widgets.
- Attendance/Schedule/Class/Enrollment/Student/Teacher admin pages con nhieu logic UI + API tron chung.
- Backend nhieu controller van day, nen tiep tuc service/repository/validator theo pattern payroll/puzzle/notification.
- Upload local can object storage, cleanup, antivirus/scan, quota.
- Test suite con mong, can Jest/Supertest/React Testing Library/Playwright.

---

## 14. Diem manh va goi y nang cap

### Diem manh

- He thong da bao phu day du nghiep vu cua trung tam co vua: public site, LMS, lop hoc, lich, diem danh, finance, payroll, CMS, notification, chat, puzzle.
- Kien truc da role ro rang, route guard va layout rieng theo role.
- Frontend da co nhieu feature module hien dai, giam dan monolithic page.
- CMS moi co nen tang tot cho page builder/multilingual/template trong tuong lai.
- Backend bat dau co module/service layer cho cac domain phuc tap.
- Python service tach rieng computer vision khoi Node business backend.
- Realtime co room theo user va dung chung cho chat/notification/online.

### Goi y nang cap

- Chuan hoa backend theo `modules/<domain>` cho finance, enrollment, attendance, schedule, users.
- Them test tu dong cho auth, payroll, puzzle, notification, CMS, chat.
- Tang bao mat refresh token: reuse detection, token invalidation, audit log DB, permission matrix.
- Chuyen upload sang S3-compatible storage khi production.
- Them Redis cache/socket adapter va BullMQ cho multi-instance.
- Them observability: structured logging, request tracing, Sentry.
- Thiet ke tenantId/subscription/feature flags neu mo rong multi-center SaaS.

---

*Tai lieu duoc cap nhat tu viec ra soat source code hien tai cua frontend, backend va python-service. Khi thay doi nghiep vu lon hoac hoan tat them phase refactor, nen cap nhat lai file nay de giu tai lieu dong bo voi he thong thuc te.*
