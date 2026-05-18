# Z CHESS — Operations & Workflow Audit

> Audit time: 2026-05-11
> Góc nhìn: chủ học viện cờ vua đang vận hành thật.
> Phạm vi: tất cả workflow nghiệp vụ hàng ngày.

Tài liệu này chỉ mô tả workflow & gap. Audit hệ thống chung xem `SYSTEM_AUDIT.md`. Audit UI/UX xem `UI_UX_AUDIT.md`.

Mỗi scenario dưới đây có 4 phần: **Quy trình thật ngoài đời** → **Hệ thống hiện tại** → **Khoảng trống & rủi ro** → **Thiết kế đề xuất + đã triển khai gì trong audit này**.

---

## Tổng kết hiện trạng (đã đọc trực tiếp code)

| Domain | Hiện tại | Khoảng trống |
|---|---|---|
| Enrollment | `Active/Completed/Dropped/Reserved` + `paymentStatus unpaid/paid/partial`. Không có `Waitlist`, không có `transferLog`, không lưu `paidAmount`, không soft-delete. | Chuyển lớp, waitlist, công nợ, refund |
| Class | `Pending/Active/Finished` + `currentStudents` đếm tay từ `studentIds`. Không trạng thái `Cancelled`. Không có sự kiện huỷ buổi/bù buổi. | Huỷ buổi, bù buổi, đầy lớp, hold/maintenance |
| Attendance | `present/absent` + ghi chú; không unique key → có thể double-mark. Mark present cộng `Student.totalSessions/completedLessons`; thay đổi 2 lần liên tiếp gây sai. | `excused/late/makeup`, idempotent, conflict detection |
| Schedule | Lưu trên `Class.scheduleSlots` thuần (day/time/duration). Không IANA timezone, không recurrence rules, không exception list. | Conflict GV/phòng, đổi lịch, holiday |
| Order | `pending/completed/cancelled/refunded`; có flow duyệt → `CourseAccess`. Refund chỉ là gán status, không lưu số tiền hoàn. | Refund partial, voucher, bằng chứng |
| Tuition | `Enrollment.paymentStatus` 3 trạng thái + `feeAmount`. Không có lịch sử thanh toán theo enrollment. | Công nợ, partial pay, gia hạn, lịch sử |
| Teacher absence | Không có model nào. | GV nghỉ, GV thay |
| Student lifecycle | `isDeleted/deletedAt`. Không có "tạm dừng/inactive/trial/active/quit". | State machine trọn vẹn |
| Audit | Không có collection `AuditLog`. Chỉ payroll log JSON stdout. | Mọi mutation quan trọng cần log |

---

## 1. Học viên chuyển lớp (Class transfer)

### Quy trình thật
Phụ huynh xin chuyển con từ lớp A → lớp B (khác giờ/khác giáo viên/khác trình độ). Học viện thường xử lý:
1. Xác nhận đủ điều kiện (đã thanh toán A, lớp B còn slot, level phù hợp).
2. Tạm tính: số buổi đã học ở A → trừ vào B; phần học phí thừa/thiếu chuyển sang B.
3. Cập nhật danh sách lớp + lịch + ghi chú phụ huynh + ghi nhận lý do.
4. Thông báo phụ huynh + giáo viên 2 lớp.

### Hệ thống hiện tại
- Chỉ có `enrollStudent` + `withdrawStudent` (xoá hoàn toàn enrollment cũ). Không có "transfer".
- Mất thông tin lớp cũ → không tra được lịch sử chuyển lớp của học viên.
- Học phí không cập nhật, sessionsUsed không chuyển.

### Khoảng trống & rủi ro
- Phụ huynh khiếu nại "đã chuyển lớp tại sao bị tính lại học phí"? Không có chứng cứ.
- Giáo viên không biết bé này đến từ lớp nào, đã học gì.
- Báo cáo sai (cộng đôi lượt vào danh sách lớp).

### Thiết kế đã triển khai
- `Enrollment.transferLog[]` lưu mọi sự kiện chuyển lớp (`from`, `to`, `transferredAt`, `transferredBy`, `reason`, `sessionsCarriedOver`, `feeCarriedOver`).
- Endpoint mới: `POST /api/enrollments/:id/transfer` (Admin/Teacher) — atomic:
  - Kiểm tra enrollment cũ thuộc Admin/Teacher hợp lệ.
  - Kiểm tra `targetClassId` còn slot (`maxStudents`).
  - Tạo enrollment mới (status `Active`, `feeAmount` được điều chỉnh, `sessionsUsed=carriedOver`).
  - Đánh dấu enrollment cũ `Dropped` + thêm `transferLog` ở enrollment mới.
  - `Class.studentIds`: pull khỏi cũ, addToSet vào mới.
  - Notify phụ huynh + giáo viên 2 lớp.
  - Ghi `AuditLog`.
- UI flow đề xuất: từ trang chi tiết enrollment → nút "Chuyển lớp" → dialog chọn lớp đích + nhập lý do + slider "Số buổi mang sang" + preview phí.

---

## 2. Công nợ học phí (Tuition debt)

### Quy trình thật
Cuối tháng kế toán cần: ai chưa đóng học phí, đóng được bao nhiêu/còn nợ bao nhiêu, nợ bao nhiêu ngày, tổng công nợ học viện.

### Hệ thống hiện tại
- Có `paymentStatus = unpaid|paid|partial` nhưng không lưu số tiền đã đóng.
- `payTuition` trong `financeController` cập nhật `paymentStatus="paid"` + tạo `Revenue` — nhưng không có `paidAmount`/`paidAt` ở enrollment.
- `partial` về cơ bản là dummy.

### Khoảng trống
- Không tính được "nợ bao nhiêu".
- Phụ huynh đóng dần không lưu được lịch sử.
- Không có ageing (nợ 30/60/90 ngày).

### Thiết kế đã triển khai
- `Enrollment` thêm: `paidAmount` (number), `lastPaidAt` (date), `paymentDueDate` (date, default = enrollmentDate + 7 ngày), `paymentHistory` (array: `amount`, `paidAt`, `method`, `transactionId`, `recordedBy`, `note`).
- `paymentStatus` được tính lại dựa trên `paidAmount` vs `feeAmount`:
  - `paidAmount === 0` → `unpaid`
  - `paidAmount >= feeAmount` → `paid`
  - 0 < `paidAmount` < `feeAmount` → `partial`
- Endpoint mới: `GET /api/finance/tuition-debts?ageing=30,60,90&status=overdue|partial|unpaid` — trả về:
  - Total debt (sum `feeAmount - paidAmount`).
  - Buckets ageing.
  - Per-parent rollup (nhiều con cùng lớp).
- Endpoint cập nhật: `payTuition` body chấp nhận `amount` (partial), tự push vào `paymentHistory`, tự recompute `paymentStatus`.
- UI flow đề xuất: trang Finance có tab "Công nợ" + bảng + filter age + nút "Ghi nhận thu" trên từng dòng.

---

## 3. Phụ huynh xin nghỉ (Parent leave request)

### Quy trình thật
Phụ huynh: "Bé Minh nghỉ học từ 12-15/05 vì đi du lịch". Học viện ghi nhận → khi điểm danh không trừ bé, sắp xếp buổi bù.

### Hệ thống hiện tại
- Không có khái niệm "leave request". Khi điểm danh chỉ có `present|absent` — bé không đi sẽ bị `absent` mặc định.

### Khoảng trống
- Không phân biệt "vắng có phép" vs "vắng không phép".
- Không track buổi bù.

### Thiết kế đã triển khai
- `Attendance.status` mở rộng enum: `present | absent | excused | late | makeup`.
- `Attendance.isMakeup` (bool), `Attendance.originalDate` (date) — buổi bù trỏ về ngày gốc.
- Endpoint cũ `markAttendance` chấp nhận status mới + idempotent unique key (xem mục 4).
- Endpoint mới: `POST /api/operations/leave-requests` — tạo "leave" cho học viên qua khoảng ngày → tự sinh `Attendance excused` cho mỗi buổi rơi vào dải đó.
- UI flow đề xuất: portal Phụ huynh có nút "Xin nghỉ" → form chọn con + dải ngày + lý do → submit → admin/teacher thấy ở danh sách.

---

## 4. Điểm danh trùng (Duplicate attendance)

### Quy trình thật
Trong giờ học, GV có thể lỡ tay nhấn 2 lần "có mặt" cho cùng 1 học viên. Hoặc 2 thiết bị chấm cùng lúc. Hệ thống không được phép tạo 2 record.

### Hệ thống hiện tại
- `Attendance` không có unique key. Logic `findOne` rồi update — nhưng giữa `findOne` và `save` là race window.
- Khi GV bấm 2 lần liên tiếp, `Student.totalSessions` cộng 2 lần.

### Thiết kế đã triển khai
- `Attendance` unique compound index: `{ studentId: 1, classId: 1, date: 1 }`.
- Logic cập nhật chuyển sang `findOneAndUpdate({ ..., $inc: ... }, { upsert: true, new: true })` với guard `prevStatus !== nextStatus` quyết định có `$inc` Student counter hay không.
- Idempotency-Key (header optional) trên endpoint `POST /api/attendance` — nếu trùng key trong 60s → trả lại record cũ.

---

## 5. Giáo viên vắng (Teacher absent / substitute)

### Quy trình thật
Thứ 7 lúc 19:00, GV An báo nghỉ vì bệnh. Học viện cần:
1. Sắp GV B dạy thay (substitute), hoặc huỷ buổi.
2. Thông báo phụ huynh.
3. Cập nhật bảng công GV An (không tính ca dạy đó), cộng cho GV B.

### Hệ thống hiện tại
- Không có flow GV vắng. `TeachingLog` ghi sau khi GV dạy xong, không phòng ngừa.

### Khoảng trống
- Phụ huynh đến lớp mới biết GV nghỉ → khiếu nại.
- Bảng lương GV An vẫn tính dù không dạy nếu admin quên cập nhật.

### Thiết kế đã triển khai
- Model mới `ClassEvent` với type `cancelled | substituted | rescheduled | makeup`. Mỗi sự kiện gắn `classId`, `originalDate`, `newDate?`, `originalTeacherId`, `substituteTeacherId?`, `reason`, `createdBy`, `notifiedAt`.
- Endpoint mới: `POST /api/operations/classes/:id/cancel-session`, `POST /api/operations/classes/:id/substitute-teacher`, `POST /api/operations/classes/:id/reschedule-session`.
- Khi `substituted`: `TeachingLog` cho GV thay, không tính cho GV gốc.
- Notify Parent (phụ huynh các bé thuộc lớp).
- UI flow đề xuất: trang Class detail có nút "Báo huỷ buổi / Sắp GV thay" với form ngày + lý do.

---

## 6. Huỷ buổi học (Class session cancellation)

### Quy trình thật
Bão lụt, mất điện, GV ốm đột xuất → huỷ 1 buổi. Cần thông báo + hứa bù.

### Hệ thống hiện tại
- Không có endpoint nào.

### Thiết kế đã triển khai
- Cùng `ClassEvent` với type `cancelled`. Tự bắn notification tới phụ huynh.
- Sau khi cancel, admin có thể tạo `makeup` (buổi bù): chọn ngày mới, optional thay GV.
- Báo cáo: lớp X có Y buổi cancel, Z buổi bù chưa thực hiện.

---

## 7. Lớp đầy & danh sách chờ (Class full & waitlist)

### Quy trình thật
Lớp Kids 7-9 tuổi sáng T7 đầy 12/12. Học viện vẫn nhận đăng ký dạng "chờ" — khi có chỗ trống sẽ ưu tiên gọi theo thứ tự.

### Hệ thống hiện tại
- `enrollStudent` không kiểm `maxStudents`; nếu phụ huynh tự đăng ký qua API có thể vượt giới hạn.
- Không có "chờ".

### Thiết kế đã triển khai
- Endpoint `enrollStudent` thêm guard: nếu `currentStudents >= maxStudents` → trả 409 với code `CLASS_FULL` và gợi ý waitlist.
- Model mới `ClassWaitlist` = (`classId`, `studentId`, `position`, `joinedAt`, `status: waiting|promoted|cancelled|expired`, `expiresAt?`, `notes`).
- Endpoint:
  - `POST /api/operations/classes/:id/waitlist` — đăng ký waitlist (Parent/Admin).
  - `GET /api/operations/classes/:id/waitlist` — list (Admin).
  - `POST /api/operations/classes/:id/waitlist/:waitlistId/promote` — đẩy lên enrollment thật.
  - Khi `withdrawStudent` thành công, gợi ý FE tự promote người đầu trong waitlist.

---

## 8. Đăng ký giải đấu (Tournament registration)

### Quy trình thật
Học viện tổ chức "Giải cờ Mùa hè" — phụ huynh đăng ký con tham gia, đóng phí, nhận lịch thi đấu, kết quả.

### Hệ thống hiện tại
- Hoàn toàn không có. Audit này không triển khai (xem SYSTEM_AUDIT P1-9).

### Thiết kế đề xuất (chưa triển khai)
- Model `Tournament`, `TournamentRegistration`, `TournamentRound`, `TournamentResult`.
- Pairing engine Swiss/Round-robin tách thành module riêng.
- Audit doc tham khảo cho sprint sau.

---

## 9. Hết hạn thanh toán & quá hạn (Overdue payment)

### Quy trình thật
Học phí phải đóng trước ngày 5 hằng tháng. Quá 7 ngày là quá hạn → cảnh báo, quá 30 ngày tạm khoá quyền học.

### Hệ thống hiện tại
- Không có cron, không có cảnh báo, không có gating.

### Thiết kế đã triển khai
- `Enrollment.paymentDueDate` (date), tự gán = enrollmentDate + 7 ngày khi tạo.
- Endpoint `GET /api/finance/tuition-debts?ageing=...` (mục 2) — báo cáo hiện trạng.
- Đề xuất sprint sau: cron job ngày 1 hằng tháng quét enrollment quá hạn → notify phụ huynh + admin (P1-5 trong SYSTEM_AUDIT).

---

## 10. Hoàn tiền (Refund)

### Quy trình thật
Phụ huynh đăng ký rồi đổi ý sau 1 buổi. Học viện hoàn 80% theo policy.

### Hệ thống hiện tại
- `Order.status` có `refunded` nhưng:
  - Không lưu số tiền hoàn.
  - Không lưu lý do.
  - Không revoke `CourseAccess`.

### Thiết kế đã triển khai
- `Order` thêm: `refundAmount`, `refundReason`, `refundedAt`, `refundedBy`.
- Endpoint mới: `POST /api/orders/:id/refund` (Admin) — body `{ amount?, reason }`. Mặc định full-refund. Khi gọi:
  - Validate amount ≤ totalAmount.
  - Set `status = refunded` (full) hoặc `partially_refunded` (partial). Status enum mở rộng.
  - Revoke `CourseAccess` cho user trên các course trong order.
  - Tạo `Expense` (chi phí) tương ứng số tiền hoàn.
  - Notify user.
  - Ghi `AuditLog`.

---

## 11. Tính lương (Salary calculation)

### Quy trình thật
Mỗi tháng tính tổng giờ dạy thực tế × hệ số + phụ cấp - phạt. Có phụ thuộc:
- Buổi `cancelled` (không tính cho GV gốc).
- Buổi `substituted` (tính cho GV thay).
- Buổi `makeup` (tính bình thường, đánh dấu makeup).

### Hệ thống hiện tại
- Module `payroll` đã có (calculator/repository/service/audit). Đọc qua: nhận TeachingLog làm input.
- Vấn đề: TeachingLog hiện tại không hiểu khái niệm `cancelled/substituted/makeup` → cần thêm field hoặc derive từ `ClassEvent`.

### Thiết kế đã triển khai
- `TeachingLog` thêm: `eventId` (ref `ClassEvent`, optional), `originalTeacherId` (substitute case), `category` enum `regular | makeup | substituted`.
- Cập nhật `payrollService` để filter theo category — đã có comment `TODO` để áp ở sprint tới (không sửa logic tính lương trong audit này để tránh phá payroll đang chạy).

---

## 12. Học viên không hoạt động (Student inactive / lifecycle)

### Quy trình thật
Một học viên đã 60 ngày không có buổi nào học (không attendance) → coi như "ngủ". 90 ngày → "rời lớp". 180 ngày → archive.

### Hệ thống hiện tại
- Chỉ `isDeleted` + `deletedAt`. Không có lifecycle ngầm.

### Thiết kế đã triển khai
- `Student` thêm: `lifecycleStatus` enum `trial | active | inactive | dropped | archived`, default `active`. `lastActiveAt` (date) — cập nhật mỗi lần `markAttendance` status=present.
- Endpoint `GET /api/students/inactive?days=60` (Admin) — danh sách học viên `lastActiveAt` cách hôm nay > N ngày, để admin gọi điện chăm sóc.
- Đề xuất sprint sau: cron daily tự cập nhật `lifecycleStatus` dựa trên `lastActiveAt`.

---

## 13. Nhật ký vận hành (Audit log)

### Quy trình thật
Khi có khiếu nại, học viện cần biết "ai sửa số buổi của bé Minh từ 8 lên 12 lúc nào". Hiện tại không truy được.

### Thiết kế đã triển khai
- Model mới `AuditLog`:
  - `actorId`, `actorRole`, `action` (string, vd `enrollment.transfer`, `order.refund`, `attendance.update`), `entity` (collection name), `entityId`, `before` (object), `after` (object), `ip`, `userAgent`, `requestId`, `createdAt`.
  - Indexes: `{ actorId: 1, createdAt: -1 }`, `{ entity: 1, entityId: 1, createdAt: -1 }`.
- Helper `services/auditLogger.js` exposes `logAction({ req, action, entity, entityId, before, after })`.
- Đã wire vào: `enrollment.transfer`, `order.refund`, `class.cancel-session`, `class.substitute`, `class.makeup`, `student.mark-inactive`.

---

## 14. Hot indexes đã thêm (theo SYSTEM_AUDIT P2)

- `Order { userId: 1, status: 1, createdAt: -1 }`, `{ status: 1, createdAt: -1 }`.
- `Enrollment { studentId: 1, status: 1 }`, `{ classId: 1, status: 1 }`, `{ paymentStatus: 1, paymentDueDate: 1 }`.
- `Attendance { classId: 1, date: -1 }`, `{ studentId: 1, date: -1 }`, unique `{ studentId: 1, classId: 1, date: 1 }`.
- `TeachingLog { teacherId: 1, date: -1, status: 1 }`.
- `Class { teacherId: 1, status: 1 }`, `{ status: 1, startDate: 1 }`.
- `ClassEvent { classId: 1, originalDate: -1, type: 1 }`.
- `ClassWaitlist { classId: 1, status: 1, position: 1 }`, unique `{ classId: 1, studentId: 1, status: 1 }`.

---

## 15. State machine tóm tắt

### Enrollment

```
                          ┌──────────────┐
        register ───►     │  Reserved    │  ◄─── waitlist promote
                          └──────┬───────┘
                                 │ pay
                                 ▼
   transfer ──┬──►  ┌─────────────────────────────┐  ──complete──► Completed
   (new enr)  │     │  Active                     │  ──drop────►   Dropped
              │     │  paymentStatus: paid|partial│
              │     │     |unpaid → overdue cron   │
              ▼     └─────────────────────────────┘
       transferLog[]
```

### Class session lifecycle

```
   Scheduled (slot in scheduleSlots)
       │
       ├──► held (tạo Attendance)
       │
       ├──► cancelled  (ClassEvent type=cancelled)
       │       └──► makeup  (ClassEvent type=makeup, isMakeup=true Attendance)
       │
       └──► substituted (ClassEvent type=substituted, TeachingLog cho GV thay)
```

### Order

```
   pending ─pay─► completed ─refund(full)──► refunded
                          ─refund(partial)─► partially_refunded ─more refund──► refunded
   pending ─cancel─► cancelled
```

---

## 16. Files affected (lần này)

### Mới
- `zchess-be/models/AuditLog.js`
- `zchess-be/models/ClassEvent.js`
- `zchess-be/models/ClassWaitlist.js`
- `zchess-be/services/auditLogger.js`
- `zchess-be/modules/operations/services/classLifecycleService.js`
- `zchess-be/modules/operations/services/enrollmentTransferService.js`
- `zchess-be/modules/operations/services/waitlistService.js`
- `zchess-be/controllers/operationsController.js`
- `zchess-be/routes/operationsRoutes.js`

### Sửa
- `zchess-be/models/Enrollment.js` (waitlist status, transferLog, paidAmount, paymentHistory, paymentDueDate, indexes)
- `zchess-be/models/Attendance.js` (statuses mở rộng, isMakeup, originalDate, unique compound index)
- `zchess-be/models/Class.js` (status `Cancelled`, indexes)
- `zchess-be/models/Order.js` (refundAmount/refundReason/refundedAt/refundedBy, status `partially_refunded`, indexes)
- `zchess-be/models/Student.js` (lifecycleStatus, lastActiveAt, indexes)
- `zchess-be/models/TeachingLog.js` (eventId, originalTeacherId, category)
- `zchess-be/controllers/enrollmentController.js` (waitlist gating + payment recompute)
- `zchess-be/controllers/attendanceController.js` (idempotent + statuses mở rộng + lastActiveAt)
- `zchess-be/controllers/orderController.js` (refund endpoint)
- `zchess-be/controllers/financeController.js` (tuition-debts endpoint, payTuition partial)
- `zchess-be/app.js` (mount `/api/operations`)

---

## 17. Outstanding (chưa triển khai trong audit này — defer sprint sau)

- Cron job: overdue check (P1-5), inactive student auto-mark, waitlist expire.
- Tournament module (P1-9).
- Substitute teacher full payroll integration (cần test kỹ trên dữ liệu thật).
- Leave request UI (BE đã sẵn sàng, FE chưa).
- Refund partial UI.
