# Z CHESS — UI/UX Audit & Redesign

> Audit time: 2026-05-11
> Mục tiêu: nâng chất lượng visual + tương tác lên ngang **Linear / Notion / Stripe / Framer / Superhuman**.
> Phạm vi: toàn bộ FE `fezchess` — public, admin, portal (teacher/parent/student), auth, chess training.

Audit này chỉ tập trung UI/UX. Audit hệ thống đầy đủ xem `SYSTEM_AUDIT.md`. Mỗi vấn đề kèm: **Problem · Why · Impact · Proposed · Files · Plan**.

---

## 0. Bối cảnh thực tế

- Tailwind 3 + token semantic (HSL CSS vars: `primary`, `muted`, `card`, `destructive`, `accent`, `popover`, `ring`, `border`, `input`).
- Đã có `clsx`, `tailwind-merge`, `lucide-react`, `framer-motion`, `react-loading-skeleton`, `sonner`, `@heroicons/react`. Tức là đủ "vũ khí" để dựng design system tử tế mà **không cần thêm dependency mới**.
- Folder `components/ui/` chỉ có 1 file `TableSkeleton.jsx` → nói thẳng: dự án **chưa có design system**.
- Mỗi page tự "cuộn" kiểu riêng: `bg-white` thuần thay vì `bg-card`, button `bg-primary` đặt cứng, padding `p-6 / p-10 / p-20` không nhất quán, tiêu đề `text-2xl` / `text-3xl` lộn xộn.
- `index.css` có nhiều rule `!important` chỉ cho `data-theme="light"` → đè utility, làm preview không khớp Tailwind. Đây là nợ lớn nhưng không phá vỡ; sửa dần.
- Dark mode đã được "đông cứng" thành light (xem `SYSTEM_AUDIT.md` 4.4) — nên trong audit này **không thiết kế cho dark**, chỉ giữ tokens để sau bật lại.

---

## 1. Findings (theo nhóm)

### 1.1 Missing pages / dialogs / states

| ID | Vấn đề | Why | Impact |
|---|---|---|---|
| U-01 | Không có **404 page** chuyên biệt; chỉ render dòng "Trang đang được cập nhật" trong `App.jsx`. | Người dùng truy cập sai URL không có lối thoát. | Mất user, SEO xấu. |
| U-02 | Không có **ErrorBoundary** toàn cục. | Mọi exception → màn trắng. | Mất phiên làm việc, mất lòng tin. |
| U-03 | Nhiều route portal `*` rơi về `<div className="p-10">Trang đang được cập nhật</div>`. | Mock primitive, không có nút quay lại. | Cảm giác "đang dở". |
| U-04 | Không có **ConfirmDialog** dùng chung; mỗi list tự popover xác nhận xoá kiểu khác nhau (`StudentList` popover absolute, các nơi khác `window.confirm`). | UX không đồng nhất, mobile rớt. | Thiếu tin tưởng, dễ misclick. |
| U-05 | Không có **EmptyState** chuẩn (icon + tiêu đề + mô tả + CTA). Hiện tại empty = `Không có dữ liệu` text. | Cảm giác lỗi/dở, không hướng dẫn next action. | Bỏ tính năng. |
| U-06 | Không có **Skeleton** chuẩn ngoài `TableSkeleton` (chỉ dùng cho table). Form/dashboard/chart không skeleton. | Người dùng thấy nhảy layout. | CLS, jitter. |
| U-07 | Không có **PageHeader** chuẩn. Mỗi trang viết tay tiêu đề + actions, kích thước/padding khác nhau. | Hierarchy yếu, scan kém. | Trải nghiệm "cũ kỹ". |
| U-08 | Không có **bottom nav mobile** cho portal (parent/teacher/student/admin). Mobile chỉ có hamburger. | Nav 1 lớp ẩn, không tối ưu thumb-zone. | Engagement mobile thấp. |
| U-09 | Không có **command-palette** thống nhất giữa các role (đã có `CommandPalette` nhưng phụ thuộc menu role; không có quick action như "Tạo học viên"). | Power user khó di chuyển. | Năng suất thấp. |
| U-10 | Không có **Toast layer** thống nhất kiểu/màu (sonner đang dùng nhưng theme tự lồng). `ThemedToaster` đọc `isDark` luôn = false. | Toast lệch tone. | Lệch nhỏ nhưng dễ thấy. |

### 1.2 Inconsistent components / hierarchy

| ID | Vấn đề | Bằng chứng | Recommendation |
|---|---|---|---|
| C-01 | Nút primary đôi khi `bg-primary text-white`, đôi khi `bg-black text-white` (xem `Login.jsx:91-94`). | "Đăng nhập" dùng `bg-black`, các nơi khác `bg-primary`. | Một component `<Button variant="primary">` dùng `bg-primary`. |
| C-02 | Card đôi khi `bg-white`, đôi khi `bg-card`, đôi khi `bg-background`. | `StudentList:180,195,208` `bg-white`. | `<Card>` mặc định `bg-card border-border`. |
| C-03 | Tiêu đề trang: `text-2xl` (StudentList), `text-3xl` (Dashboard), `text-xl` (Login). Padding khác nhau. | — | `<PageHeader>` chuẩn `text-2xl md:text-3xl font-display`. |
| C-04 | Status badge tự viết Tailwind mỗi nơi: `bg-emerald-50 text-emerald-700 border-emerald-200`, `bg-blue-50 text-blue-700 border-blue-200`, … | StudentList `getStudentStatus`. | `<Badge tone="success|info|warning|danger|neutral">`. |
| C-05 | Input bo `rounded-lg`, ring `ring-primary/20`, placeholder text-gray-400 — pattern lặp lại 30 lần với khác biệt nhỏ. | Login, Signup, mọi form admin. | `<Input>` chuẩn với `ring-2 ring-ring/20 border-input`. |
| C-06 | Icon button: padding `p-2` chỗ thì `p-2.5`, hover màu khác nhau. | StudentList row actions vs AdminHeader. | `<Button variant="ghost" size="icon">`. |
| C-07 | Spacing dọc giữa section: `space-y-6` / `space-y-4` / `gap-3` lẫn lộn. | — | Token: page-level dùng `space-y-6`, card-internal `space-y-4`, form-row `space-y-3`. |
| C-08 | Border color dùng cả `border-gray-100`, `border-gray-200`, `border-border`. | StudentList `border-gray-100`. | Luôn dùng `border-border`. |
| C-09 | Text muted: `text-gray-500`, `text-gray-600`, `text-muted-foreground` lẫn lộn. | — | Luôn `text-muted-foreground`. |
| C-10 | Avatar: vài chỗ `w-9 h-9 bg-primary/10`, vài chỗ chữ cái viết tay. | AdminHeader `User` icon trong vòng tròn. | `<Avatar fallback initials>`. |

### 1.3 Spacing / layout

| ID | Vấn đề | Đề xuất |
|---|---|---|
| L-01 | `<main>` `p-4 md:p-6` nhưng nhiều trang lại tự `p-6 / p-10` bên trong → padding kép. | Trang nội dung dùng container `<PageContainer>` không tự pad nữa. |
| L-02 | Public layout có spacer `h-14 md:h-16` cho header fixed → khi nội dung là full-bleed (Hero) bị thừa khoảng trắng. | Cho Hero tự `mt-[-64px]` hoặc layout không spacer cho route public-fullbleed. |
| L-03 | `MobileTopBar` `py-3` + `AdminHeader` cũng hiện trên mobile → 2 thanh chồng. | MobileTopBar và AdminHeader chỉ chọn 1 theo breakpoint. |
| L-04 | `AnnouncementBar` chiều cao biến thiên + style inline `position: relative` → đẩy layout sticky. | Đặt `position: sticky top-0` ở wrapper hoặc absolute trong header. |
| L-05 | Container public không có `max-w-7xl` thống nhất; mỗi section tự container. | Tạo `<SectionContainer>` chuẩn. |

### 1.4 Mobile issues

| ID | Vấn đề | Đề xuất |
|---|---|---|
| M-01 | Touch target Menu button `p-2` icon 22px ≈ 38 px tổng → < 44 px khuyến nghị. | `p-2.5` + min `h-10 w-10` cho icon button. |
| M-02 | Bảng admin chỉ `overflow-x-auto`. Trên ≤ 380 px cuộn ngang khó chịu. | Pattern stacked card list dưới `md:hidden`. |
| M-03 | Form admin grid `md:grid-cols-2` đôi khi rộng + label dài → input nén. | Cho phép single column trên md, breakpoint lg cho 2 col. |
| M-04 | Floating social buttons + ChatBubble + MobileTopBar có thể đè nhau. | `<MobileBottomNav>` + safe area + z-index map. |
| M-05 | Input height `py-2.5` chỉ ≈ 38 px → nhỏ trên mobile. | `<Input size="md">` mặc định `h-10`, `<Input size="lg">` `h-11`. |

### 1.5 Confusing navigation

| ID | Vấn đề | Đề xuất |
|---|---|---|
| N-01 | `/admin/students` redirect → `/students`; tồn tại đồng thời `/students/new`, `/students/create`, `/students/:id/edit`, `/students/edit/:id`. | Chuẩn hoá `/admin/students/...` (xem SYSTEM_AUDIT N-01). |
| N-02 | Header desktop (`AdminHeader`) đè lên mobile, mobile có `MobileTopBar` riêng. Người dùng mobile vừa thấy logo trên `MobileTopBar` vừa thấy avatar bên trên (admin). | Trên mobile chỉ giữ `MobileTopBar` (đã `md:hidden` đúng). Admin Header `hidden md:flex`. |
| N-03 | Sidebar mục "Tài chính" + "Tin tức (CMS)" đặt cạnh nhau gây phân tâm. Nhóm nội dung và CRM đang ghép trong "Nội dung & CRM". | Chia "Tài chính" vẫn ổn; "Nội dung" tách "CRM" thành riêng nếu có ≥ 4 mục. |
| N-04 | Không có breadcrumb. Detail trang sâu (e.g. Student → Edit) không thấy "ancestor". | `<Breadcrumb>` trong `<PageHeader>`. |

---

## 2. Redesign principles (Linear/Notion/Stripe-grade)

1. **Hierarchy rõ ràng, density cao** — Linear style: tiêu đề đậm, label nhỏ, mọi action gom phải; Notion style: kiến trúc lề rộng, nội dung đặt trong khung readable max-width.
2. **Một component, mọi nơi** — Không inline color/padding nữa. Mọi UI lấy từ `components/ui/*`.
3. **Motion có chủ đích** — `framer-motion` chỉ cho enter/exit, không decoration. Duration 120–200 ms, easing `cubic-bezier(0.16, 1, 0.3, 1)`.
4. **Spacing scale 4-8-12-16-24-32-48** — Tailwind chuẩn. Không có 5/7/9 lẻ.
5. **Mobile-first** — Mọi list có stacked-card fallback. Bottom nav cho portal.
6. **Empty/loading/error/success — bốn trạng thái cho mọi data view**.
7. **A11y baseline** — Touch ≥ 44 px, label đi kèm input, focus ring `ring-2 ring-ring/40`, `prefers-reduced-motion`.

Color pairing chuẩn (đã có sẵn trong CSS vars):
- Surface = `card`, divider = `border`, body text = `foreground`, secondary text = `muted-foreground`.
- Brand primary = `primary` (HSL `221.2 83.2% 53.3%` ≈ Stripe blue). Destructive = `destructive` (red 0 84.2% 60.2%).
- **Status tones** (mới — đề xuất, dùng khi cần status pill mềm):
  - success bg `emerald-50` text `emerald-700` border `emerald-200`
  - warning bg `amber-50` text `amber-700` border `amber-200`
  - danger bg `rose-50` text `rose-700` border `rose-200`
  - info bg `blue-50` text `blue-700` border `blue-200`
  - neutral bg `gray-50` text `gray-700` border `gray-200`

---

## 3. Design system delivered

### 3.1 Foundation

- `src/lib/utils.js` — `cn(...inputs)` = `twMerge(clsx(...))` cho mọi component.
- Tokens motion thêm vào `tailwind.config.js`:
  - `animation: { fade-in, slide-up, scale-in }`
  - `keyframes` tương ứng
- Shadow tokens (đề xuất `shadow-card`, `shadow-elevated`) — dùng utility có sẵn `shadow-sm/md/lg/xl` với mapping ngữ cảnh.

### 3.2 Primitives `src/components/ui/*` (đã tạo lần này)

| Component | API | Mục đích |
|---|---|---|
| `Button` | `variant="primary\|secondary\|outline\|ghost\|destructive\|link"`, `size="sm\|md\|lg\|icon"`, `loading`, `leftIcon`, `rightIcon` | thay 100+ button thủ công |
| `Input` | `size="sm\|md\|lg"`, `leftIcon`, `rightIcon`, `error` | mọi text input |
| `Textarea` | `error`, `rows` | mọi textarea |
| `Label` | `required`, `htmlFor` | label chuẩn |
| `Field` | `label`, `hint`, `error`, `required` | wrap `<Label>` + `<Input>` + hint/error |
| `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` | composable | thay `<div className="rounded-2xl bg-white border…">` |
| `Badge` | `tone="neutral\|info\|success\|warning\|danger\|primary"`, `size="sm\|md"` | status pill |
| `Avatar` | `src`, `name`, `size` | header/avatar mọi nơi |
| `Separator` | `orientation` | divider |
| `Skeleton` | `<Skeleton className="h-…">` + `<SkeletonText lines>` + `<SkeletonCard>` | loading state |
| `EmptyState` | `icon`, `title`, `description`, `action` | data-empty |
| `PageHeader` | `title`, `description`, `breadcrumbs`, `actions`, `meta` | header trang chuẩn |
| `Dialog` | controlled `open`/`onOpenChange`, focus trap, escape, animate, backdrop | modal |
| `ConfirmDialog` | wrap `Dialog` cho hành động phá huỷ | xoá/đăng xuất |
| `StatCard` | `label`, `value`, `delta`, `icon`, `tone` | dashboard KPI |
| `Toolbar`, `ToolbarSearch` | filter row có icon + search | list page |
| `Tabs`, `TabList`, `Tab`, `TabPanel` | controlled với `value` | panel switch |
| `Container` | `max="md\|lg\|xl\|2xl\|full"`, `padX` | layout reading-width |

Tất cả export từ `src/components/ui/index.js` để import 1 dòng:

```js
import { Button, Card, CardHeader, CardTitle, CardContent, Field, Input, Badge, EmptyState, PageHeader, Dialog, ConfirmDialog } from "@/components/ui";
```

(Project không có alias `@`; dùng path tương đối hoặc thêm alias nếu cần — không bắt buộc trong audit này.)

### 3.3 Mobile bottom nav

- `src/layouts/navigation/mobile/MobileBottomNav.jsx` — render 4–5 mục chính theo role, dùng `useResolvedMenu`. Hiện chỉ cho `md:hidden`. Có safe-area inset (env safe-area-inset-bottom).
- `AppShell` thêm padding-bottom 64 px khi `md:hidden` để không bị che footer.

### 3.4 Refactor mẫu

- `pages/auth/Login/Login.jsx` — viết lại bằng `<Card>`, `<Field>`, `<Button>`. Trở thành reference cho các form khác.
- `pages/Admin/Students/StudentList.jsx` — header dùng `<PageHeader>` + `<Button>`; status pill dùng `<Badge>`; popover xoá → `<ConfirmDialog>`; empty/loading dùng `<EmptyState>` / Skeleton chuẩn.
- `components/common/NotFoundPage.jsx` — đã có ở P0; cập nhật dùng primitives.

> Các trang còn lại sẽ được refactor dần theo P2 trong `SYSTEM_AUDIT.md` — pattern đã có, mỗi trang ≈ 30 phút.

---

## 4. Roadmap UI tiếp theo

| Sprint | Mục tiêu | Việc cụ thể |
|---|---|---|
| **A — Foundations** (đã xong trong audit này) | Design system + 2 reference screens | tokens, primitives, Login + StudentList header, mobile bottom nav |
| **B — Forms & lists** | Đồng bộ form + list admin | Áp `<PageHeader>` + `<Toolbar>` + `<Card>` + `<DataTable>` cho 8 trang admin lớn (Class/Enrollment/Schedule/Attendance/Finance/Payroll/Notifications/Inquiry) |
| **C — Portal mobile** | Portal teacher/parent/student mobile | Bottom nav hoàn chỉnh + stacked-card list + bottom-sheet filter |
| **D — Public marketing** | Public site polish | SEO meta dynamic, hero responsive, gallery, news SEO; OG image generator |
| **E — Power user** | Command palette + keyboard | Global K shortcut, role-based actions, recent items |
| **F — Polish** | Motion choreography | Page transition, scroll restoration, micro-interactions Stripe-style |

---

## 5. Files affected (lần này)

Mới:
- `fezchess/src/lib/utils.js`
- `fezchess/src/components/ui/Button.jsx`
- `fezchess/src/components/ui/Input.jsx`
- `fezchess/src/components/ui/Textarea.jsx`
- `fezchess/src/components/ui/Label.jsx`
- `fezchess/src/components/ui/Field.jsx`
- `fezchess/src/components/ui/Card.jsx`
- `fezchess/src/components/ui/Badge.jsx`
- `fezchess/src/components/ui/Avatar.jsx`
- `fezchess/src/components/ui/Separator.jsx`
- `fezchess/src/components/ui/Skeleton.jsx`
- `fezchess/src/components/ui/EmptyState.jsx`
- `fezchess/src/components/ui/PageHeader.jsx`
- `fezchess/src/components/ui/Dialog.jsx`
- `fezchess/src/components/ui/ConfirmDialog.jsx`
- `fezchess/src/components/ui/StatCard.jsx`
- `fezchess/src/components/ui/Toolbar.jsx`
- `fezchess/src/components/ui/Tabs.jsx`
- `fezchess/src/components/ui/Container.jsx`
- `fezchess/src/components/ui/index.js`
- `fezchess/src/layouts/navigation/mobile/MobileBottomNav.jsx`

Sửa:
- `fezchess/tailwind.config.js` (motion tokens)
- `fezchess/src/layouts/navigation/shell/AppShell.jsx` (mobile bottom nav + spacing)
- `fezchess/src/pages/auth/Login/Login.jsx` (refactor)
- `fezchess/src/pages/Admin/Students/StudentList.jsx` (refactor delete confirm + header)
- `fezchess/src/components/common/NotFoundPage.jsx` (dùng Button)
