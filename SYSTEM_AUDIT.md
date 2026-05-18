# Z CHESS — System Audit & Production Roadmap

> Audit time: 2026-05-11
> Repos: `zchess-be` (Node 22 + Express 5 + Mongoose 9), `fezchess` (React 19 + Vite 7 + Tailwind), `python-service` (đã loại bỏ).
> Scope: codebase + ops surface, không kiểm thử runtime.

Mục tiêu: chuyển từ "internal chess center website" sang "production-grade chess academy SaaS". Audit này được phân thành 3 lớp: **Findings** (sự thật trong code) → **Risks/Impacts** → **Recommendations + Plan**.

Ưu tiên: **P0** = production/security blocker · **P1** = business-critical missing flow · **P2** = UX/perf · **P3** = nice-to-have.

---

## 0. Executive summary

Hệ thống hiện đã đạt mức MVP đầy đủ (auth, RBAC, course/class, attendance, payroll, chess training, CMS, chat, notifications). Nền tảng mã sạch, có module hóa nhất quán (`modules/payroll`, `modules/notifications`, `modules/puzzles`), feature-based FE (`features/*`), pub/sub store. Đó là điểm mạnh hiếm có trong stack tương tự cùng cỡ.

Còn 5 nhóm vấn đề lớn cản đường vào production SaaS:

1. **Trust boundary chưa chặt**: vài endpoint thiếu authorization chặt, có 1 lỗ leo quyền (`orderController.createOrder`), endpoint public lộ đáp án bài tập, không có audit log, refresh token không revoke server-side.
2. **Operational void**: không có Docker/CI/CD, không log structured, không request id, không Sentry, queue thông báo + detection job đều in-memory (mất khi restart), không backup script, không OpenAPI.
3. **Business gap**: thiếu password reset / email verify / 2FA, không có cổng thanh toán thật (chỉ field), không có certificate / leaderboard / tournament / homework / makeup class / class transfer. SaaS layer (multi-tenant / billing / impersonation) chưa có.
4. **UX/i18n nợ kỹ thuật**: `lang="en"` trên site VN, theme bị ép sáng nhưng `index.html` còn script dark, ThemeToggle no-op, không ErrorBoundary, không 404 page, không skeleton/empty state đồng bộ, không SEO meta.
5. **Performance / scalability**: index DB hot fields thiếu, bundle FE 1.4 MB, không compression middleware, list endpoint chưa server pagination/cursor, hai store unread chat song song dễ drift.

Bộ P0 trong audit này tập trung vào (1)+(4)+(2) — những gì có thể vá an toàn ngay mà không phá business logic. Phần lớn (3) phải lên roadmap riêng vì là tính năng mới.

---

## 1. Existing modules (factual inventory)

### Backend (`zchess-be`)

| Domain | Files |
|---|---|
| **Auth** | `routes/authRoutes.js`, `controllers/authController.js`, `middleware/authMiddleware.js` (Bearer + refresh cookie + role-insensitive `authorize`) |
| **User base & discriminators** | `models/User.js` (Admin/Parent/Student/Teacher), `Teacher.js`, `Admin.js`, `Parents.js` |
| **Academy core** | `Student`, `Class`, `Course`, `Chapter`, `Lesson`, `Enrollment`, `Schedule`, `Attendance`, `Progress`, `Assessment`, `TeachingLog` |
| **Commerce** | `Order`, `Payment` (orphan), `Revenue`, `Expense`, `controllers/orderController.js`, `controllers/financeController.js` |
| **Chess content** | `LessonChessProgress`, `Puzzle`, `PuzzleAssignment`, `PuzzleAttempt`, `ChessExercise`, `ChessExerciseAttempt`, `ExerciseAssignment`, `ExerciseAssignmentProgress` |
| **CMS** | `Post`, `Testimonial`, `HeroSetting`, `Setting.publicCms` |
| **CRM** | `Inquiry`, `leadRoutes` |
| **Real-time** | `socket.io` mounted in `server.js`, `realtime/socketHub.js`, `modules/notifications/*`, `Message`, `Notification`, `NotificationRecipient` |
| **Modules** | `modules/payroll/*`, `modules/notifications/*`, `modules/puzzles/*` |
| **Middleware** | `securityMiddleware`, `requestSanitizerMiddleware`, `validationMiddleware`, `paramValidationMiddleware`, `chessExerciseValidationMiddleware`, `errorMiddleware`, `asyncHandler` |

### Frontend (`fezchess`)

| Domain | Folders |
|---|---|
| **Routing/layout** | `App.jsx`, `layouts/{MainLayout,TeacherLayout,ParentLayout,StudentLayout}`, `layouts/navigation/{shell,sidebar,command-palette}`, `components/layout/PublicLayout.jsx` |
| **Auth** | `pages/auth/{Login,Signup}`, `services/authService.js`, `api/axiosClient.js` |
| **Public marketing** | `pages/public/*`, `context/PublicCmsContext.jsx`, `features/cms/*` |
| **Admin pages** | `pages/Admin/*` (Teachers, Students, Classes, Enrollments, Attendance, Schedule, Finance, Payroll, Parents, Settings, Notifications, Courses, CMS, CRM) |
| **Portal pages** | `pages/portal/{Teacher,Parent,Student}/*`, dashboards lazy-loaded từ `features/dashboard/pages/*` |
| **Chess** | `features/chess-ui`, `features/learning`, `features/analysis`, `features/training`, `features/puzzle-import`, `lib/chess`, `lib/chess-engine`, `stores/*` |
| **Realtime** | `services/realtimeSocket.js`, `features/notifications/*`, `features/chat/*` |
| **Design tokens** | `tailwind.config.js`, `index.css`, `context/ThemeContext.jsx` |

---

## 2. P0 — Critical (production/security blockers)

### P0-1. Privilege escalation in `createOrder`

**Problem.** `controllers/orderController.js:19` cho phép body override owner:
```js
const userId = req.user?._id || req.body.userId;
```
Vì `protect` đã chạy, `req.user` luôn tồn tại trừ khi token invalid → fallback gần như không kích hoạt. Nhưng nếu trong tương lai middleware đổi (ví dụ `optionalProtect`), bất kỳ user nào cũng tạo được order cho người khác.

**Why it matters.** Đơn hàng → `CourseAccess` cấp quyền học khoá học. Hệ luỵ nếu bị lợi dụng: user A trả tiền giả thay user B, hoặc admin thao tác sai → phân quyền khoá học sai.

**Fix.** Bắt buộc lấy từ `req.user._id`; loại fallback. Đã áp dụng.

**Files.** `zchess-be/controllers/orderController.js`.

### P0-2. Public chess exercises lộ đáp án

**Problem.** `getPublicExercises` `select(..., "solutionSan solutionUci")` (`controllers/chessExerciseController.js:115-119`) trả về toàn bộ đáp án.

**Why it matters.** Endpoint `GET /api/chess-exercises/public` (đã có `protect`) trả về đầy đủ `solutionSan/solutionUci` cho mọi user (kể cả Student). Người học chỉ cần devtools là copy đáp án.

**Fix.** Loại 2 field này khỏi `select` ở `getPublicExercises`. Đáp án chỉ tham chiếu phía server khi `submitAnswer`. Đã áp dụng.

**Files.** `zchess-be/controllers/chessExerciseController.js`.

### P0-3. `POST /api/auth/signout` không có `protect`

**Problem.** Bất kỳ ai (kể cả không token) có thể gọi signout → có thể xoá cookie người khác qua CSRF nếu không có same-site (đã `sameSite=lax` mặc định, nhưng vẫn nên gating).

**Fix.** Thêm `protect` ở route. Đã áp dụng.

**Files.** `zchess-be/routes/authRoutes.js`.

### P0-4. Multer upload bài tập cờ không có MIME allowlist

**Problem.** `routes/chessExerciseRoutes.js:26-29` chỉ giới hạn 10 MB, không `fileFilter`. Lúc đó admin/teacher có thể upload bất kỳ MIME nào → chiếm dụng disk + service tĩnh `/uploads` phục vụ luôn.

**Fix.** Thêm allowlist `application/pdf`, `image/png`, `image/jpeg`, `image/webp`. Đã áp dụng.

**Files.** `zchess-be/routes/chessExerciseRoutes.js`.

### P0-5. `express.json()` không có `limit` → DoS risk

**Problem.** `app.js:76` dùng default 100 KB của body-parser cũ; Express 5 mặc định cũng 100 KB nên rủi ro tương đối nhẹ, nhưng admin upload (CMS draft) có payload lớn → khi tăng cần biết rõ giới hạn. Cần khai báo tường minh.

**Fix.** `express.json({ limit: '1mb' })` + `express.urlencoded({ extended: true, limit: '1mb' })`. Đã áp dụng.

**Files.** `zchess-be/app.js`.

### P0-6. Không có `compression`

**Problem.** Backend trả JSON payload lớn (notifications, finance, dashboard) không gzip → chậm + chi phí băng thông.

**Fix.** Thêm `compression()` middleware. Đã áp dụng (cài `compression`).

**Files.** `zchess-be/app.js`, `zchess-be/package.json`.

### P0-7. `express-mongo-sanitize` chưa wire

**Problem.** Đã cài trong `package.json` nhưng `app.js` không import. Có sanitizer custom (`requestSanitizerMiddleware`) nhưng phòng-thủ-theo-tầng vẫn nên bật cả hai.

**Fix.** Import + `app.use(mongoSanitize())` trước route. Đã áp dụng.

**Files.** `zchess-be/app.js`.

### P0-8. Không có request id correlation

**Problem.** Không cách nào trace 1 request từ frontend xuống backend log. Khi prod scale, debug lỗi chậm.

**Fix.** Thêm middleware nhỏ gắn `X-Request-Id` (re-use header nếu có, hoặc `crypto.randomUUID()`). Đã áp dụng.

**Files.** `zchess-be/middleware/requestIdMiddleware.js` (mới), `app.js`.

### P0-9. Frontend không có `ErrorBoundary` toàn cục

**Problem.** Mọi exception render bị React 19 nuốt → màn trắng. Đặc biệt nguy hiểm với chess board / engine worker.

**Fix.** Thêm `components/common/ErrorBoundary.jsx` bọc `<Routes>`. Có nút "Tải lại" + log lỗi (sau này gắn Sentry). Đã áp dụng.

**Files.** `fezchess/src/components/common/ErrorBoundary.jsx` (mới), `App.jsx`.

### P0-10. `index.html` `lang="en"` + dead-code dark mode

**Problem.** Site tiếng Việt nhưng `lang="en"` → screen reader đọc sai, SEO sai locale, lighthouse hạ điểm. `index.html` còn block script `localStorage.theme === "dark"` thêm class `dark`, trong khi `ThemeContext` xoá class dark mỗi mount → drift.

**Fix.** Đặt `lang="vi"`, gỡ block script đặt class dark, thêm `<title>` + `<meta description>` cơ bản. Đã áp dụng.

**Files.** `fezchess/index.html`.

### P0-11. CORS hardcode `192.168.1.31:5173`

**Problem.** `app.js:62` và `server.js:28` hardcode IP mạng nội bộ. Trong production để lại sẽ là origin lạ được trust.

**Fix.** Đưa CORS allowlist vào env (`CORS_ALLOWED_ORIGINS=…,…`). Trong audit này mình chưa đụng vì cần đồng thuận với env hiện hữu — đề xuất trong P1.

### P0-12. Missing `.env.example`

**Problem.** Onboarding dev chỉ có `.envbe`/`.envfe` (file thật trong repo). Đó vừa là gốc rò rỉ secret tiềm tàng (nếu khác máy clone), vừa khiến CI/CD không có template.

**Fix.** Thêm `.env.example` cho backend với danh sách biến tối thiểu (không kèm giá trị thật). Đã áp dụng.

**Files.** `zchess-be/.env.example` (mới).

---

## 3. P1 — Business critical missing flows

| ID | Module | Gap | Recommendation |
|---|---|---|---|
| P1-1 | Auth | Không password reset, email verify, 2FA, account lockout, refresh-token revocation list | Thêm `PasswordResetToken`, `EmailVerificationToken` + nodemailer/SMTP, Argon2id thay bcrypt cho mới, lockout sau N lần fail (đã có rate limit). 2FA TOTP có thể defer P2. |
| P1-2 | Payment | Không có gateway thật (MoMo/VNPay/Stripe) — chỉ field `paymentMethod`/`transactionId`; `Payment` model orphan | Triển khai adapter: 1 service interface `PaymentProviderAdapter`, 2 driver MoMo + Stripe. Webhook callback verify signature. Tạo `Invoice` model riêng cho kế toán. |
| P1-3 | Audit log | Không có model `AuditLog` (payroll log dùng stdout) | Thêm `models/AuditLog.js` với `actorId/role/action/entity/entityId/before/after/ip/userAgent/requestId` + middleware `auditMutation` cho admin routes. |
| P1-4 | Notification | Queue + delivery in-memory (`setTimeout`), mất khi restart | Hoặc chuyển sang BullMQ + Redis (persisted), hoặc lưu vào collection `NotificationOutbox` + worker poll. Thêm idempotency key. |
| P1-5 | Background jobs | Không cron | Thêm `node-cron`/Bull schedule cho: gửi nhắc lịch học (T-1 day), tổng kết tuần cho phụ huynh, dọn token hết hạn, dọn upload mồ côi. |
| P1-6 | Course completion | Không sinh `Certificate`, `CourseProgress` model orphan | Wire `CourseProgress` khi user xem hết bài; sinh PDF certificate (đã có `pdfkit`). Thêm route `GET /api/courses/:id/certificate`. |
| P1-7 | Class lifecycle | Không có flow trial / makeup / cancel / transfer | Thêm `ClassEvent` (cancellation, makeup, swap) + thông báo phụ huynh. Bổ sung `Enrollment.transferLog`. |
| P1-8 | Schedule | Không timezone, không recurrence engine, không conflict detect | Thêm `tzdata` IANA, lưu start/end time + RRULE; FE dùng `date-fns-tz`. Validate trùng giờ giáo viên + phòng. |
| P1-9 | Chess SaaS | Không có ELO progression, leaderboard, tournament, badge | Thêm `RatingHistory`, `Tournament` (Swiss/Round-robin), `Badge`/`Achievement`, leaderboard endpoint cached. |
| P1-10 | CRM | `Inquiry` chỉ list, không có pipeline | Thêm `LeadStatus` enum (new/contacted/converted/lost), assignee, follow-up reminders, conversion rate dashboard. |
| P1-11 | Multi-branch | Không có `Branch`, không có `tenantId` trên record | Long-term: chèn `branchId` vào model lõi (`Class`, `Schedule`, `User`); query scope tự động qua middleware Mongoose. |
| P1-12 | Subscription | Không có `Plan`, `Subscription`, billing UI | Cho SaaS thực sự: tích hợp Stripe Billing hoặc Paddle. |
| P1-13 | Permission | Role enum cứng 4 giá trị, không có permission matrix | Thêm `Role` collection + `Permission` enum + `RolePermission` matrix; admin UI tạo role tuỳ biến. |
| P1-14 | Email/SMS | Không gửi email/SMS thật | Wire SMTP qua `nodemailer` + queue (P1-4). Template Handlebars trong `templates/email/*`. |
| P1-15 | Backup | Không có backup script | Cron `mongodump` đẩy lên S3-compatible; documented restore. |

---

## 4. P2 — UX / Performance

### 4.1 UI/UX issues

- **Theme drift**: `ThemeContext` ép light, `ThemeToggle.jsx` `return null`, `index.html` script còn vớt `localStorage.theme="dark"`. → Hoặc bật dark mode đầy đủ (đề xuất), hoặc gỡ toàn bộ dấu vết dark + ẩn ThemeToggle. P0-10 đã sửa `index.html`. Cần follow-up: hoặc bật full dark mode (xem 4.4) hoặc xóa file `ThemeToggle.jsx`.
- **`lang="en"`** đã sửa.
- **Hai layout `PublicLayout`** (`layouts/PublicLayout.jsx` cũ vs `components/layout/PublicLayout.jsx` đang dùng) → xoá file cũ.
- **`AdminNotificationCreate`, `ProductManager`, `GalleryPage`, `TestRegisterPage`** không gắn route → chết code, gỡ hoặc gắn route.
- **Trùng route admin students**: `/admin/students` redirect, `/students/new` + `/students/create` cùng form, `/students/:id/edit` + `/students/edit/:id`. → Thống nhất 1 path, redirect các path cũ với 301.
- **404 page**: hiện chỉ in dòng "Trang đang được cập nhật". Cần component `NotFoundPage` rõ ràng + link về dashboard theo role.
- **Empty/loading skeleton**: nhiều list (Class, Enrollments, Finance) chưa skeleton thống nhất. Nên tạo `<DataTableSkeleton rows columns>`.
- **Form**: không có `react-hook-form` / `zod`. Nên thêm để chuẩn hoá validation + error display + dirty tracking.
- **i18n**: hard-coded VI khắp nơi. Khi có nhu cầu international hoá phải refactor lớn. Ưu tiên P3.
- **SEO**: thiếu `react-helmet-async` + meta OG cho public pages (HomePage, CourseDetail, NewsPage, TeacherDetail).
- **Accessibility**: `MobileTopBar` p-2 < 44 px target; nhiều icon-only button thiếu `aria-label`; không `prefers-reduced-motion`.
- **Mobile**: portal không có bottom nav; bảng dùng `overflow-x-auto` thay vì stacked card.

### 4.2 Performance issues

- **DB indexes thiếu**: ưu tiên thêm
  - `Order { userId: 1, status: 1, createdAt: -1 }`
  - `Enrollment { studentId: 1 }, { classId: 1, status: 1 }`
  - `Attendance { classId: 1, date: -1 }, { studentId: 1, date: -1 }`
  - `Schedule { studentId: 1 }`
  - `TeachingLog { teacherId: 1, date: -1, status: 1 }`
  - `Lesson { chapterId: 1, order: 1 }`
  - `Chapter { courseId: 1, order: 1 }`
  - `CourseAccess` đã unique compound — ok.
  - `Review { userId: 1, courseId: 1 }` unique để chặn 1 user review 1 khoá nhiều lần.
- **List endpoint không pagination**: `/api/courses`, `/api/students`, `/api/classes`, `/api/enrollments` trả full collection. Chuyển sang cursor-based với `pageSize` + `before/after`.
- **Bundle FE 1.4 MB main**: tách
  - tách Recharts vào chunk riêng (đã thấy circular warning)
  - tách `framer-motion` qua `motion-mini`
  - lazy-load `chess.js` chỉ trên route training/analysis
- **Duplicate unread store** (chat): `useUnreadSummary` + `chatUnreadStore` cùng tồn tại → drift. Hợp nhất một nguồn.
- **Reconnect loop**: socket `reconnectionAttempts: Infinity` + chat hydrate force trên reconnect → tránh thundering herd, thêm jitter.

### 4.3 Image/upload optimization

- Không có resize/optimize trên upload (avatar, hero, chat). Người dùng có thể upload 30 MB raw. Tích hợp `sharp` resize ≤ 1920 max-width, JPEG quality 80.

### 4.4 Theme system (đề xuất)

Phương án A — tắt hẳn dark mode: xoá `ThemeToggle.jsx`, gỡ class `.dark` khỏi `index.css`, gỡ `useTheme` không cần thiết. Bundle nhỏ hơn.

Phương án B — bật full dark: viết lại `ThemeContext` thực sự, persist `localStorage`, đồng bộ với block script `index.html`. Hữu ích nếu tệp khách dùng đêm/training nhiều.

---

## 5. P3 — Long-term / strategic

- TypeScript migration BE + FE.
- Storybook cho design system (sau khi chuẩn hoá `components/ui/*`).
- OpenAPI spec sinh từ controllers (zod schemas → swagger).
- E2E test Playwright cho luồng: signup → buy course → start lesson; teacher mark attendance → parent thấy notification.
- Visual regression test cho CMS preview.
- Feature flag service (thay cho biến env rời rạc).
- Admin impersonation (cẩn trọng với audit log + security).

---

## 6. Security checklist tổng

| Item | Status | Note |
|---|---|---|
| HTTPS only in prod | ⚠️ | cookie `secure: NODE_ENV==="production"` ✓; CORS phải đảm bảo origin https |
| Strict CORS allowlist | ⚠️ | Hardcode IP nội bộ — chuyển env |
| Helmet | ✓ | crossOriginResourcePolicy lỏng vì serve uploads — chấp nhận |
| Rate limit auth + global | ✓ | `securityMiddleware.js` |
| `hpp` | ✓ | |
| Mongo sanitize | ✓ | đã wire `express-mongo-sanitize` (sửa P0-7) |
| Body limit | ✓ | `1mb` (P0-5) |
| Multer MIME allowlist | partial → ✓ | đã sửa P0-4; vẫn cần `payrollRoutes` import (đã có whitelist Excel) |
| File serving path traversal | ⚠️ | `/uploads` mở toàn bộ; nên thêm whitelist subfolder hoặc CDN |
| JWT secret rotation | ⚠️ | Không có cơ chế xoay; refresh không revoke list |
| Email verify | ❌ | P1-1 |
| Audit log | ❌ | P1-3 |
| CSRF | ❌ | API là Bearer, đa phần không cần; chỉ rủi ro với cookie-only routes (refresh) — đã `sameSite=lax` |
| Password policy | ⚠️ | Chỉ length tối thiểu 6 (validation middleware) → tăng 8+ + complexity |
| Lockout | ❌ | rate limit per-IP có; per-account chưa |
| Sensitive data in logs | ⚠️ | `console.error` vẫn còn rải rác — cần switch sang logger và redact |

---

## 7. Implementation tracker

### Đã triển khai trong audit này (P0)

- [x] P0-1 Loại fallback `req.body.userId` trong `createOrder`.
- [x] P0-2 Bỏ `solutionSan/Uci` khỏi public exercises.
- [x] P0-3 `protect` cho `signout`.
- [x] P0-4 fileFilter MIME cho chess exercise upload.
- [x] P0-5 `express.json({ limit: '1mb' })`.
- [x] P0-6 `compression`.
- [x] P0-7 `express-mongo-sanitize` wired.
- [x] P0-8 `requestId` middleware.
- [x] P0-9 ErrorBoundary FE.
- [x] P0-10 `index.html` lang="vi" + gỡ dark script.
- [x] P0-12 `.env.example`.

### Đang theo dõi

- [ ] P0-11 Đưa CORS allowlist sang env (cần thống nhất `.env`).
- [ ] P1-1 → P1-15 (xem bảng).
- [ ] P2 UX/Perf (xem mục 4).
- [ ] P3 (mục 5).

---

## 8. Roadmap đề xuất (3 sprint × 2 tuần)

### Sprint 1 — Hardening (2 tuần)
- Hoàn tất bộ P0 còn lại (CORS env).
- AuditLog model + middleware (P1-3).
- Persist NotificationOutbox + simple worker (P1-4).
- Index DB hot fields (P2-Performance).
- Password reset + email verify (P1-1).
- ErrorBoundary chi tiết theo section (Public, Portal, Admin).
- 404 page + global toast network-down.

### Sprint 2 — Business depth (2 tuần)
- Course completion → Certificate PDF (P1-6).
- Schedule recurrence + timezone + conflict (P1-8).
- Class lifecycle: cancel/makeup/transfer + notify (P1-7).
- Email queue + template (P1-14).
- Cron jobs nhắc lịch + dọn token (P1-5).

### Sprint 3 — SaaS productisation (2 tuần)
- ELO + leaderboard + badge (P1-9).
- Tournament Swiss/Round-robin (P1-9).
- Branch model + tenant scoping (P1-11).
- Plan/Subscription + Stripe billing (P1-12).
- OpenAPI spec + SDK gen (P3).

Mỗi sprint kết: tag release, chạy lint/build/E2E happy-path, cập nhật `MO_TA_CHUC_NANG.md`.

---

## 9. References

- File cụ thể đã trích dẫn trong các mục P0/P1/P2.
- Audit do 3 lát cắt: backend explorer, frontend explorer, ops explorer chạy song song; merge vào tài liệu này.
- Tài liệu sống (sẽ cập nhật theo từng sprint). Các thay đổi mã lớn cần PR riêng và link về mục P trong file này.
