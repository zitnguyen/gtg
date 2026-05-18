# Trang legacy (không gắn router)

Thư mục này chứa component từng tồn tại nhưng **không được import trong `App.jsx`**, gây nhầm lẫn khi bảo trì.

| File | Lý do giữ / không route |
|------|-------------------------|
| `admin/Dashboard.jsx` | Dashboard cũ; thay bằng `MainDashboard` tại `/dashboard` |
| `admin/ProductManager.jsx` | API `/products` không còn trên BE; dùng `AdminCourseList` |
| `public/GalleryPage.jsx` | Gallery mock; ảnh thật qua CMS tin tức / Public CMS |
| `public/TestRegisterPage.jsx` | Form thử nghiệm; luồng chính: Contact + CRM |
| `shared/DailyExercisesPage.jsx` | Luồng puzzle mới: `StudentPuzzleTodayPage` |
| `services/productService.js` | Chỉ phục vụ `ProductManager` legacy |

**Đã gắn route (không nằm đây):** `AdminNotificationCreate` → `/admin/notifications/new`.

Khi cần tái sử dụng: chuyển file ra khỏi `_legacy/`, cập nhật import path, thêm route + menu trong `App.jsx` / `menuConfig.js`.
