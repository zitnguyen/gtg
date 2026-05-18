# Đặc tả yêu cầu phần mềm (SRS)
# Hệ thống Z CHESS — Quản lý trung tâm cờ vua

| Thuộc tính | Giá trị |
|------------|---------|
| **Phiên bản tài liệu** | 1.0 |
| **Ngày** | 17/05/2026 |
| **Phạm vi** | `fezchess` (FE), `zchess-be` (BE), `python-service` (OCR/FEN) |
| **Trạng thái** | Dựa trên rà soát mã nguồn workspace `luaniudau` |

---

## Mục lục

1. [Giới thiệu](#1-giới-thiệu)
2. [Mô tả tổng quan](#2-mô-tả-tổng-quan)
3. [Vai trò người dùng](#3-vai-trò-người-dùng)
4. [Yêu cầu chức năng](#4-yêu-cầu-chức-năng)
5. [Yêu cầu phi chức năng](#5-yêu-cầu-phi-chức-năng)
6. [Giao diện hệ thống](#6-giao-diện-hệ-thống)
7. [Mô hình dữ liệu](#7-mô-hình-dữ-liệu)
8. [Ma trận phân quyền](#8-ma-trận-phân-quyền)
9. [Luồng nghiệp vụ chính](#9-luồng-nghiệp-vụ-chính)
10. [Hạn chế & khoảng trống đã biết](#10-hạn-chế--khoảng-trống-đã-biết)
11. [Phụ lục](#11-phụ-lục)

---

## 1. Giới thiệu

### 1.1 Mục đích

Tài liệu SRS mô tả **yêu cầu chức năng và phi chức năng** của hệ thống **Z CHESS** — nền tảng website và vận hành nội bộ cho trung tâm đào tạo cờ vua, gồm:

- Website công khai (giới thiệu, khóa học, tin tức, liên hệ, luyện cờ cơ bản).
- Cổng quản trị **Admin**.
- Cổng **Giáo viên**, **Phụ huynh**, **Học viên**.
- LMS khóa học online, điểm danh, phiếu học tập, tài chính, bảng lương, chat, thông báo realtime, import puzzle từ PDF.

Tài liệu phục vụ: phát triển, kiểm thử, nghiệm thu, và mở rộng hệ thống.

### 1.2 Phạm vi

| Trong phạm vi | Ngoài phạm vi (hiện tại) |
|---------------|---------------------------|
| Quản lý HV, lớp, ghi danh, điểm danh | Thanh toán cổng tự động (VNPay/MoMo) đầy đủ |
| Khóa học online + tiến độ bài học | Ứng dụng mobile native |
| Phiếu học tập + mẫu nội dung theo level | Engine cờ tự host (dùng Stockfish client + Lichess API) |
| Tài chính thu/chi, học phí, export | ERP kế toán tổng hợp |
| Chat & thông báo realtime | Video call / lớp học trực tuyến WebRTC |
| Import puzzle PDF (OCR FEN) | Đa chi nhánh (multi-tenant) |

### 1.3 Định nghĩa, từ viết tắt

| Thuật ngữ | Ý nghĩa |
|----------|---------|
| **HV** | Học viên (`Student` record + có thể có `User` role Student) |
| **PH** | Phụ huynh (`User` role Parent, liên kết con qua `Student.parentId`) |
| **GV** | Giáo viên (`User` role Teacher) |
| **LMS** | Hệ thống học khóa online (course/chapter/lesson) |
| **Phiếu học tập** | Bản ghi `Progress` theo cặp HV × lớp, gồm nội dung từng buổi |
| **Mẫu nội dung học** | `ProgressLessonTemplate` — level + danh sách bài mẫu để chèn nhanh |
| **JWT** | Access token (ngắn hạn) + refresh token (cookie httpOnly) |
| **FEN** | Chuỗi ký hiệu thế cờ (Forsyth-Edwards Notation) |

### 1.4 Tài liệu tham chiếu

- `MO_TA_CHUC_NANG.md` — mô tả chức năng chi tiết theo module.
- `SYSTEM_AUDIT.md`, `OPERATIONS_AUDIT.md`, `UI_UX_AUDIT.md` — rà soát kỹ thuật/vận hành/UI.
- Mã nguồn: `fezchess/src/App.jsx`, `zchess-be/app.js`.

---

## 2. Mô tả tổng quan

### 2.1 Bối cảnh sản phẩm

```text
                    ┌─────────────────────────────┐
                    │  Trình duyệt (khách / user) │
                    └──────────────┬──────────────┘
                                   │ HTTPS
                    ┌──────────────▼──────────────┐
                    │  fezchess (React 19 + Vite)   │
                    │  REST + Socket.IO client      │
                    └──────┬───────────────┬──────┘
                           │ /api/*        │ WebSocket
              ┌────────────▼───────────────▼────────────┐
              │  zchess-be (Express 5 + Mongoose)       │
              │  JWT, upload, Socket.IO hub             │
              └──────┬────────────────────┬───────────┘
                     │                    │
         ┌───────────▼──────────┐  ┌──────▼─────────────┐
         │  MongoDB             │  │  python-service     │
         │  (dữ liệu nghiệp vụ) │  │  PDF/ảnh → FEN      │
         └──────────────────────┘  └─────────────────────┘
```

### 2.2 Chức năng sản phẩm (tóm tắt)

1. **Công khai:** trang chủ, khóa học, tin tức, giáo viên, liên hệ, phân tích cờ, luyện puzzle, đối kháng live.
2. **Đào tạo offline:** lớp, ghi danh, điểm danh, lịch, phiếu học tập, đánh giá GV.
3. **Đào tạo online:** khóa học, chương, bài, mua khóa, tiến độ học.
4. **Tài chính:** học phí, doanh thu, chi phí, dashboard tài chính, xuất báo cáo.
5. **Nhân sự / lương:** ca dạy, bảng lương Admin.
6. **Học liệu cờ:** thư viện bài tập, giao bài theo ngày, import PDF puzzle.
7. **Giao tiếp:** chat 1-1, thông báo hệ thống.
8. **CMS:** cấu hình trang public (hero, block, testimonial, cài đặt trung tâm).

### 2.3 Đặc điểm người dùng

| Vai trò | Mô tả | Kỹ năng CNTT |
|---------|--------|--------------|
| Admin | Vận hành toàn trung tâm | Trung bình |
| Giáo viên | Dạy lớp, điểm danh, phiếu học tập, đánh giá | Cơ bản–trung bình |
| Phụ huynh | Xem lịch, tiến độ con, bài tập | Cơ bản |
| Học viên | Học online, làm bài, luyện cờ | Cơ bản |
| Khách | Xem web, đăng ký liên hệ, mua khóa | Đa dạng |

### 2.4 Ràng buộc

- Backend Node.js monolith; FE SPA.
- MongoDB là kho dữ liệu chính.
- Xác thực JWT; phân quyền theo `User.role`.
- File upload lưu local `uploads/` (logo, avatar, media CMS, PDF puzzle).
- Realtime qua Socket.IO (không bắt buộc Redis trong bản hiện tại).

### 2.5 Giả định và phụ thuộc

- MongoDB và backend luôn khả dụng khi dùng portal.
- Admin cấu hình mẫu nội dung học trước khi GV dùng chèn nhanh trên phiếu học tập.
- Điểm danh tạo danh sách buổi trên phiếu học tập (đồng bộ `attendance` → `Progress.sessions`).
- `python-service` chạy khi dùng import puzzle từ PDF/ảnh.

---

## 3. Vai trò người dùng

Hệ thống có **4 vai trò** chính trên collection `users`:

| Mã vai trò | Mô tả |
|------------|--------|
| `Admin` | Toàn quyền cấu hình và vận hành |
| `Teacher` | Lớp được phân công, HV trong lớp, điểm danh, phiếu học tập, payroll |
| `Parent` | Xem dữ liệu con (`Student` gắn `parentId`) |
| `Student` | Tài khoản gắn `linkedStudentId` → hồ sơ HV |

**Điều hướng sau đăng nhập** (mặc định):

| Role | Dashboard |
|------|-----------|
| Admin | `/dashboard` |
| Teacher | `/teacher/dashboard` |
| Parent | `/parent/schedule` (menu có thêm dashboard) |
| Student | `/student/dashboard` |

**Bảo vệ route (FE):** `ProtectedRoute` — chưa đăng nhập → `/login`; sai role → dashboard đúng role.

---

## 4. Yêu cầu chức năng

Quy ước mã: **FR-&lt;MODULE&gt;-&lt;NNN&gt;** (Functional Requirement).

### 4.1 Xác thực & tài khoản (AUTH)

| Mã | Mô tả | Ưu tiên |
|----|--------|---------|
| FR-AUTH-001 | Đăng ký tài khoản (signup) với validation | Cao |
| FR-AUTH-002 | Đăng nhập, nhận access token + refresh cookie | Cao |
| FR-AUTH-003 | Refresh token tự động (FE interceptor) khi access hết hạn | Cao |
| FR-AUTH-004 | Đăng xuất, xóa session phía client và cookie | Cao |
| FR-AUTH-005 | Admin CRUD user (GV, PH, Admin); soft constraints unique email/phone sparse | Cao |
| FR-AUTH-006 | Tài khoản Student liên kết `linkedStudentId` với hồ sơ HV | Cao |

### 4.2 Website công khai (PUB)

| Mã | Mô tả | Ưu tiên |
|----|--------|---------|
| FR-PUB-001 | Trang chủ: hero, khóa học nổi bật, testimonial, CTA (dữ liệu CMS + API) | Cao |
| FR-PUB-002 | Danh sách & chi tiết khóa học (`/courses`, slug) | Cao |
| FR-PUB-003 | Checkout khóa học (đơn hàng, thanh toán thủ công/chuyển khoản theo cấu hình) | Cao |
| FR-PUB-004 | Tin tức: danh sách + chi tiết bài (`/news`) | Trung bình |
| FR-PUB-005 | Danh sách & chi tiết giáo viên | Trung bình |
| FR-PUB-006 | Form liên hệ / inquiry | Cao |
| FR-PUB-007 | Menu chính: Trang chủ, Tin tức, Khóa học, Giáo viên | Cao |
| FR-PUB-008 | Analysis board (Stockfish WASM, PGN) | Trung bình |
| FR-PUB-009 | Training hub: Puzzle Rush, Survival, Daily | Trung bình |
| FR-PUB-010 | Đối kháng live: tạo/join phòng, cập nhật Elo | Trung bình |
| FR-PUB-011 | Chính sách bảo mật, điều khoản sử dụng | Thấp |
| FR-PUB-012 | Announcement bar, floating social, social proof toast (cấu hình hệ thống) | Thấp |

### 4.3 Quản lý học viên & phụ huynh (STU)

| Mã | Mô tả | Ưu tiên |
|----|--------|---------|
| FR-STU-001 | Admin CRUD học viên (thông tin, skill level, lifecycle) | Cao |
| FR-STU-002 | Admin CRUD phụ huynh, gán con | Cao |
| FR-STU-003 | Archive/soft-delete HV, giữ lịch sử | Trung bình |
| FR-STU-004 | Parent xem danh sách con, lịch, tiến độ, khóa đã mua | Cao |
| FR-STU-005 | Student xem profile, lịch, khóa của mình | Cao |
| FR-STU-006 | Bảng xếp hạng / leaderboard (dashboard PH) | Trung bình |

### 4.4 Lớp học & vận hành (CLS)

| Mã | Mô tả | Ưu tiên |
|----|--------|---------|
| FR-CLS-001 | Admin CRUD lớp (tên, level, GV, học phí, lịch) | Cao |
| FR-CLS-002 | Gán / gỡ HV khỏi lớp | Cao |
| FR-CLS-003 | Ghi danh (enrollment): đăng ký, rút, trạng thái thanh toán | Cao |
| FR-CLS-004 | Điểm danh theo buổi/lớp/HV | Cao |
| FR-CLS-005 | Xem lịch học (schedule) đa role | Cao |
| FR-CLS-006 | Teacher xem lớp & HV được phân công | Cao |
| FR-CLS-007 | Operations: chuyển lớp, waitlist, sự kiện hủy/bù (module operations) | Trung bình |
| FR-CLS-008 | Public xem danh sách lớp (nếu bật) | Thấp |

### 4.5 Phiếu học tập & đánh giá (PRG)

| Mã | Mô tả | Ưu tiên |
|----|--------|---------|
| FR-PRG-001 | Lưu tiến độ HV×lớp: `sessions[]` (attendanceId, content, assessment) | Cao |
| FR-PRG-002 | Khởi tạo buổi học từ bản ghi điểm danh khi chưa có progress | Cao |
| FR-PRG-003 | Admin/Teacher chỉnh sửa nội dung từng buổi, đánh giá GV (ưu/nhược/khắc phục) | Cao |
| FR-PRG-004 | Xuất phiếu học tập Word (.docx) | Cao |
| FR-PRG-005 | Parent xem phiếu học tập con (read-only) | Cao |
| FR-PRG-006 | Admin quản lý **mẫu nội dung học** theo level (`ProgressLessonTemplate`) | Cao |
| FR-PRG-007 | Chèn nhanh nội dung: chọn buổi + level + bài mẫu → điền ô nội dung | Cao |
| FR-PRG-008 | Đồng bộ buổi đang chọn khi focus/click dòng trong bảng phiếu | Cao |
| FR-PRG-009 | Teacher đánh giá qua `/teacher/assessments` | Cao |
| FR-PRG-010 | Xóa phiếu học tập (Admin) | Trung bình |

### 4.6 Khóa học online & LMS (CRS)

| Mã | Mô tả | Ưu tiên |
|----|--------|---------|
| FR-CRS-001 | Admin CRUD khóa học (giá, slug, mô tả, instructor) | Cao |
| FR-CRS-002 | Admin CRUD chương & bài học | Cao |
| FR-CRS-003 | HV/PH mua khóa → Order, Payment, CourseAccess | Cao |
| FR-CRS-004 | Học bài: `/learning/:courseSlug/:lessonId` | Cao |
| FR-CRS-005 | Tiến độ khóa (`CourseProgress`) và tiến độ bài cờ trong lesson | Cao |
| FR-CRS-006 | Review khóa học | Thấp |

### 4.7 Tài chính (FIN)

| Mã | Mô tả | Ưu tiên |
|----|--------|---------|
| FR-FIN-001 | Dashboard tài chính: học phí, công nợ, tổng hợp | Cao |
| FR-FIN-002 | CRUD doanh thu (`Revenue`) — id số, không ObjectId | Cao |
| FR-FIN-003 | CRUD chi phí (`Expense`) — id số | Cao |
| FR-FIN-004 | Xuất Excel báo cáo tài chính | Trung bình |
| FR-FIN-005 | Ghi nhận thanh toán đơn khóa / enrollment | Cao |

### 4.8 Bảng lương & ca dạy (PAY)

| Mã | Mô tả | Ưu tiên |
|----|--------|---------|
| FR-PAY-001 | GV ghi nhật ký ca dạy (teaching logs) | Cao |
| FR-PAY-002 | Admin quản lý payroll sessions, payslip | Cao |
| FR-PAY-003 | Teacher xem payroll của mình | Trung bình |

### 4.9 Bài tập cờ & puzzle (CHS)

| Mã | Mô tả | Ưu tiên |
|----|--------|---------|
| FR-CHS-001 | Thư viện bài tập cờ (FEN, đáp án, hint) | Cao |
| FR-CHS-002 | Giao bài tập theo ngày/HV (`ExerciseAssignment`) | Cao |
| FR-CHS-003 | HV làm bài, lưu attempt & progress | Cao |
| FR-CHS-004 | Import puzzle từ PDF qua Admin/Teacher + python-service OCR | Trung bình |
| FR-CHS-005 | Puzzle hàng ngày (student route + public Lichess daily) | Trung bình |
| FR-CHS-006 | Admin puzzle routes (`/api/admin/...`) | Trung bình |

### 4.10 Chat & thông báo (COM)

| Mã | Mô tả | Ưu tiên |
|----|--------|---------|
| FR-COM-001 | Chat 1-1: danh sách liên hệ, gửi/nhận tin | Cao |
| FR-COM-002 | Typing indicator, read receipt, online status | Trung bình |
| FR-COM-003 | Thông báo hệ thống: list, đọc/chưa đọc, chi tiết | Cao |
| FR-COM-004 | Push realtime qua Socket.IO (`notification:new`, `message:new`) | Cao |
| FR-COM-005 | Âm thanh thông báo (tùy chọn, user gesture) | Thấp |
| FR-COM-006 | Admin gửi thông báo broadcast (nếu có UI) | Trung bình |

### 4.11 CMS & cấu hình (CMS)

| Mã | Mô tả | Ưu tiên |
|----|--------|---------|
| FR-CMS-001 | Cài đặt hệ thống: logo, tên TT, hotline, QR, announcement | Cao |
| FR-CMS-002 | Public CMS editor: schema-driven blocks, autosave, preview | Cao |
| FR-CMS-003 | CRUD bài viết / tin tức | Cao |
| FR-CMS-004 | Hero settings trang chủ | Trung bình |
| FR-CMS-005 | Testimonial CRUD + hiển thị public | Trung bình |
| FR-CMS-006 | Form metadata động cho Admin forms | Thấp |

### 4.12 Dashboard (DSH)

| Mã | Mô tả | Ưu tiên |
|----|--------|---------|
| FR-DSH-001 | Admin dashboard: KPI, biểu đồ HV theo level, doanh thu | Cao |
| FR-DSH-002 | Teacher dashboard: lớp hôm nay, KPI | Cao |
| FR-DSH-003 | Parent dashboard: chọn con, tiến độ, leaderboard | Cao |
| FR-DSH-004 | Student dashboard: Elo, bài tập, lịch | Cao |
| FR-DSH-005 | Widget grid, period switcher, cache facade | Trung bình |

### 4.13 CRM (CRM)

| Mã | Mô tả | Ưu tiên |
|----|--------|---------|
| FR-CRM-001 | Lưu inquiry từ form liên hệ | Cao |
| FR-CRM-002 | Admin danh sách & xử lý inquiry | Cao |
| FR-CRM-003 | Lead POST → Inquiry | Thấp |

### 4.14 Tích hợp Lichess (LCH)

| Mã | Mô tả | Ưu tiên |
|----|--------|---------|
| FR-LCH-001 | Proxy thông tin tài khoản Lichess (Bearer token server) | Thấp |
| FR-LCH-002 | Daily puzzle public API | Thấp |

### 4.15 Cổng Admin — điều hướng (NAV)

| Mã | Mô tả | Ưu tiên |
|----|--------|---------|
| FR-NAV-001 | AppShell thống nhất: sidebar, top bar, mobile nav | Cao |
| FR-NAV-002 | Menu công khai trên portal Admin (Trang chủ, Tin tức, Khóa học, GV) | Trung bình |
| FR-NAV-003 | Command palette, phím tắt sidebar | Thấp |
| FR-NAV-004 | CRUD realtime bridge (`api:crud` → refetch UI) | Trung bình |

---

## 5. Yêu cầu phi chức năng

### 5.1 Hiệu năng (NFR-PERF)

| Mã | Yêu cầu |
|----|---------|
| NFR-PERF-001 | API REST timeout FE mặc định 15s; refresh 10s |
| NFR-PERF-002 | Response nén gzip (compression middleware) |
| NFR-PERF-003 | Dashboard/cache facade giảm gọi API lặp (TTL client) |
| NFR-PERF-004 | Analysis Stockfish chạy client-side, không block server |

### 5.2 Bảo mật (NFR-SEC)

| Mã | Yêu cầu |
|----|---------|
| NFR-SEC-001 | JWT access ngắn hạn; refresh httpOnly cookie |
| NFR-SEC-002 | `helmet`, `hpp`, `mongoSanitize`, request sanitizer |
| NFR-SEC-003 | Rate limit API và auth endpoints |
| NFR-SEC-004 | Phân quyền `authorize(role)` trên mọi route nhạy cảm |
| NFR-SEC-005 | GV chỉ truy cập HV/lớp được phân công; PH chỉ con mình |
| NFR-SEC-006 | Socket.IO xác thực JWT handshake |
| NFR-SEC-007 | CORS whitelist + credentials; không lộ `x-powered-by` |

### 5.3 Khả dụng & UX (NFR-UX)

| Mã | Yêu cầu |
|----|---------|
| NFR-UX-001 | Giao diện tiếng Việt cho portal và thông báo lỗi chính |
| NFR-UX-002 | Responsive: mobile bottom nav, drawer sidebar |
| NFR-UX-003 | Toast (Sonner) cho phản hồi thao tác |
| NFR-UX-004 | Error boundary trang lỗi 404 |
| NFR-UX-005 | Skeleton/loading state trên dashboard và form lớn |

### 5.4 Độ tin cậy (NFR-REL)

| Mã | Yêu cầu |
|----|---------|
| NFR-REL-001 | Health check `GET /api/health` |
| NFR-REL-002 | Soft-delete HV; không xóa cứng lịch sử tài chính/tiến độ |
| NFR-REL-003 | Socket reconnect + refresh token trước khi kết nối lại |

### 5.5 Khả năng bảo trì (NFR-MNT)

| Mã | Yêu cầu |
|----|---------|
| NFR-MNT-001 | Tách `features/*` trên FE; BE module hóa payroll, puzzles, notifications |
| NFR-MNT-002 | `asyncHandler` + `errorHandler` thống nhất |
| NFR-MNT-003 | Request ID trên log/health |

### 5.6 Triển khai (NFR-DEP)

| Mã | Yêu cầu |
|----|---------|
| NFR-DEP-001 | FE build Vite; env `VITE_API_URL` production |
| NFR-DEP-002 | BE `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, `CORS_ALLOWED_ORIGINS` |
| NFR-DEP-003 | Uploads persistent volume; static `/uploads` |
| NFR-DEP-004 | `python-service` port 8001 khi bật OCR |

---

## 6. Giao diện hệ thống

### 6.1 API REST

- **Base URL:** `/api` (dev FE proxy → backend).
- **Định dạng:** JSON; file upload `multipart/form-data`.
- **Auth:** Header `Authorization: Bearer <accessToken>` hoặc cookie; refresh `POST /api/auth/refresh`.

**Nhóm endpoint chính** (chi tiết trong `zchess-be/app.js`):

| Prefix | Domain |
|--------|--------|
| `/api/auth` | Đăng nhập, refresh |
| `/api/users`, `/api/students`, `/api/parents` | Người dùng & HV |
| `/api/classes`, `/api/enrollments`, `/api/attendance` | Lớp & vận hành |
| `/api/progress`, `/api/progress-lesson-templates` | Phiếu học tập & mẫu |
| `/api/courses`, `/api/chapters`, `/api/lessons` | LMS |
| `/api/orders`, `/api/finance`, `/api/revenue`, `/api/expenses` | Tài chính |
| `/api/teacher`, `/api/admin` | Portal GV & payroll/puzzle admin |
| `/api/chat`, `/api/notifications` | Giao tiếp |
| `/api/settings`, `/api/posts`, `/api/hero-settings`, `/api/testimonials` | CMS |
| `/api/chess-exercises`, `/api/exercise-assignments`, `/api/student` | Bài tập cờ |
| `/api/live-games`, `/api/public/puzzles`, `/api/lichess` | Cờ & Lichess |
| `/api/upload` | Upload file |
| `/api/inquiries`, `/api/leads` | CRM |
| `/api/operations` | Vận hành nâng cao |

### 6.2 WebSocket (Socket.IO)

| Event / nhóm | Mục đích |
|--------------|----------|
| `notification:new`, `notification:broadcast` | Thông báo |
| `message:new`, `message:sent`, `message:read` | Chat |
| `message:typing`, `message:stopTyping` | Đang nhập |
| `user:online`, `user:offline`, `user:status` | Trạng thái |
| `api:crud` | Đồng bộ UI sau mutation REST |
| `live:*` | Ván đối kháng realtime |

Room: `user:{userId}`.

### 6.3 Dịch vụ ngoài

| Dịch vụ | Giao thức | Mục đích |
|---------|-----------|----------|
| MongoDB | Wire protocol | Persistence |
| python-service | HTTP `POST /extract-fen` | OCR PDF → FEN |
| Lichess API | HTTPS | Daily puzzle, account proxy |
| SMTP (tùy chọn) | Email | Xác nhận đơn hàng |

### 6.4 Giao diện người dùng (màn hình chính)

| Vùng | URL gốc | Layout |
|------|---------|--------|
| Public | `/`, `/courses`, `/news`, … | `PublicLayout` + `Header` |
| Admin | `/dashboard`, `/students`, … | `MainLayout` + `AppShell` |
| Teacher | `/teacher/*` | `TeacherLayout` |
| Parent | `/parent/*` | `ParentLayout` |
| Student | `/student/*` | `StudentLayout` |
| Auth | `/login`, `/signup` | Standalone |

---

## 7. Mô hình dữ liệu

### 7.1 Thực thể lõi

```text
User (role: Admin|Teacher|Parent|Student)
  └── linkedStudentId? → Student

Student ──parentId──→ User (Parent)
Student ──enrollment──→ Class
Class ──teacherId──→ User (Teacher)

Attendance → buổi học theo (class, student, date)
Progress (studentId + classId) → sessions[] { attendanceId, content, assessment }

ProgressLessonTemplate → levelKey, lessons[] { title, content, order }

Course → Chapter → Lesson
Order → Payment → CourseAccess → CourseProgress

Revenue, Expense (id numeric)
TeachingLog, Payroll (modules)

Message (chat), Notification + NotificationRecipient
ChessExercise, ExerciseAssignment, Puzzle, PuzzleAssignment, LiveGame
Setting (singleton), Post, Inquiry, Testimonial, HeroSetting
```

### 7.2 Ràng buộc dữ liệu quan trọng

- `Progress`: unique logic theo cặp `(studentId, classId)`.
- `User.email`, `User.phone`: unique sparse (cho phép null/empty không trùng).
- `ProgressLessonTemplate.levelKey`: unique.
- `CourseProgress`: unique `(userId, courseId)`.
- Bài mẫu lưu: **bắt buộc `title`**; `content` có thể rỗng (chèn nhanh dùng title).

---

## 8. Ma trận phân quyền

✓ = Được phép · — = Không · ◐ = Một phần (dữ liệu của mình/lớp mình)

| Chức năng | Admin | Teacher | Parent | Student | Public |
|-----------|:-----:|:-------:|:------:|:-------:|:------:|
| Cấu hình hệ thống / CMS | ✓ | — | — | — | ◐ đọc |
| CRUD HV / PH / lớp | ✓ | ◐ lớp mình | — | — | — |
| Điểm danh | ✓ | ✓ lớp mình | — | — | — |
| Phiếu học tập sửa | ✓ | ✓ lớp mình | — | — | — |
| Phiếu học tập xem | ✓ | ✓ | ✓ con | ◐ | — |
| Mẫu nội dung học | ✓ CRUD | ◐ đọc | — | — | — |
| Tài chính thu/chi | ✓ | ◐ | — | — | — |
| Payroll admin | ✓ | — | — | — | — |
| Ca dạy / payroll GV | ✓ | ✓ | — | — | — |
| Khóa học CRUD | ✓ | ◐ | — | — | ◐ xem |
| Mua khóa | ✓ | — | ✓ | ✓ | ✓ |
| Học bài online | ✓ | ✓ | ✓ | ✓ | — |
| Chat | ✓ | ✓ | ✓ | ✓ | — |
| Import puzzle PDF | ✓ | ✓ | — | — | — |
| Bài tập ngày | ✓ giao | — | ◐ xem con | ✓ làm | — |
| Analysis / training public | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## 9. Luồng nghiệp vụ chính

### 9.1 Ghi phiếu học tập với chèn nhanh

```text
[Admin/GV] Mở /progress/:studentId/:classId
    → Hệ thống load Progress hoặc tạo sessions từ Attendance
    → [Admin] Cấu hình ProgressLessonTemplate (level + bài mẫu)
[GV] Chọn buổi (click dòng / dropdown / badge "Đang chèn vào: Buổi N")
    → Chọn Level → Bấm bài mẫu
    → Nội dung điền vào session[N].content
    → Lưu → POST/PUT /api/progress
[GV/PH] Xuất Word → GET /api/progress/export/...
```

### 9.2 Mua và học khóa online

```text
[Khách/HV/PH] /courses → chi tiết → checkout
    → POST order + payment (manual/bank info từ Settings)
    → CourseAccess granted
[HV] /learning/:slug/:lessonId → hoàn thành → CourseProgress cập nhật
```

### 9.3 Điểm danh → phiếu học tập

```text
[GV/Admin] Ghi attendance buổi mới
    → Lần mở progress: thêm session { attendanceId, content: "" }
    → GV điền nội dung (thủ công hoặc chèn mẫu)
```

### 9.4 Import puzzle PDF

```text
[Admin/Teacher] Upload PDF → BE → python-service extract FEN
    → Lưu Puzzle → gán PuzzleAssignment cho HV
[Student] /student/daily-exercises → giải → PuzzleAttempt
```

---

## 10. Hạn chế & khoảng trống đã biết

**Đã xử lý (không còn trong bảng):** GAP-01 route `/student/tuition`; GAP-02 menu Parent tiến độ; GAP-03 model `FinancialReport` + export Excel; GAP-04 trang không route chuyển `fezchess/src/pages/_legacy/`, gắn `/admin/notifications/new`; GAP-05 `ThemeContext` + `ThemeToggle` + `darkMode: class`.

| # | Mô tả | Ảnh hưởng |
|---|--------|-----------|
| GAP-06 | Thanh toán online tự động chưa tích hợp đầy đủ | Thủ công/chuyển khoản |
| GAP-07 | Redis queue notification ghi chú tương lai | Scale horizontal hạn chế |
| GAP-08 | Đa chi nhánh / multi-tenant | Single center only |
| GAP-09 | Bộ test tự động BE/FE chưa có (`npm test` placeholder) | Regression thủ công |

---

## 11. Phụ lục

### 11.1 Biến môi trường (tối thiểu vận hành)

**Backend (`zchess-be/.env`):**

```env
MONGO_URI=
JWT_SECRET=
JWT_REFRESH_SECRET=          # khuyến nghị tách
PORT=5000
NODE_ENV=production
CLIENT_URL=https://...
CORS_ALLOWED_ORIGINS=
PYTHON_VISION_URL=http://localhost:8001
LICHESS_API_TOKEN=           # tùy chọn
SMTP_*=                      # tùy chọn email
```

**Frontend (`fezchess/.env`):**

```env
VITE_API_URL=https://api.example.com/api   # production
VITE_SOCKET_URL=                           # tùy chọn
```

### 11.2 Công nghệ

| Tầng | Công nghệ |
|------|-----------|
| FE | React 19, Vite 7, React Router 7, Tailwind, Axios, Socket.IO client, chess.js, react-chessboard, Recharts, Sonner |
| BE | Node.js, Express 5, Mongoose 9, Socket.IO, bcryptjs, docx, exceljs, multer, chess.js |
| DB | MongoDB |
| Vision | FastAPI, OpenCV, PyMuPDF (`python-service`) |

### 11.3 Traceability — module mã nguồn

| SRS Module | FE | BE |
|------------|----|----|
| PRG | `components/progress/*`, `pages/Admin/Progress/*`, `teacher/Assessment/*` | `progress*`, `progressLessonTemplate*` |
| CRS | `pages/public/Course*`, `features/learning` | `course*`, `chapter*`, `lesson*`, `order*` |
| COM | `features/chat`, `features/notifications` | `chatRoutes`, `notificationRoutes`, `realtime/` |
| CMS | `features/cms`, `PublicCmsContext` | `settings`, `post`, `hero`, `testimonial` |
| CHS | `features/training`, `features/puzzle-import` | `chessExercise*`, `adminPuzzle*`, `studentPuzzle*` |

---

**Phê duyệt**

| Vai trò | Họ tên | Chữ ký | Ngày |
|---------|--------|--------|------|
| Chủ dự án | | | |
| Kỹ thuật trưởng | | | |
| QA | | | |

---

*Tài liệu được lập từ rà soát mã nguồn và `MO_TA_CHUC_NANG.md`. Khi thay đổi chức năng, cập nhật SRS và mã traceability tương ứng.*
