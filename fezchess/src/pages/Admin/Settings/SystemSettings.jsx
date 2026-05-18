import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import settingsService, {
  unwrapSettingsBody,
} from "../../../services/settingsService";
import notificationService from "../../../services/notificationService";
import userService from "../../../services/userService";
import { useSystemSettings } from "../../../context/SystemSettingsContext";

const ROLE_OPTIONS = [
  { value: "Teacher", label: "Giáo viên" },
  { value: "Parent", label: "Phụ huynh" },
  { value: "Student", label: "Học viên" },
];

const SystemSettings = () => {
  const { settings, loading, refreshSettings, setSettingsOptimistic } =
    useSystemSettings();
  const [formData, setFormData] = useState(settings);
  const [logoUploading, setLogoUploading] = useState(false);
  const [qrUploading, setQrUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notifyTitle, setNotifyTitle] = useState("");
  const [notifyContent, setNotifyContent] = useState("");
  const [selectedRoles, setSelectedRoles] = useState([
    "Teacher",
    "Parent",
    "Student",
  ]);
  const [recipientMode, setRecipientMode] = useState("allByRole");
  const [users, setUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [sendingNotification, setSendingNotification] = useState(false);
  const [socialProofSaving, setSocialProofSaving] = useState(false);

  /** Merge — không replace toàn bộ (tránh mất field / checkbox bị “k tick đc”) */
  useEffect(() => {
    setFormData((prev) => ({ ...prev, ...settings }));
  }, [settings]);

  const previewLogo = useMemo(
    () => formData.logoUrl || settings.logoUrl,
    [formData.logoUrl, settings.logoUrl],
  );
  const roleLabelMap = useMemo(
    () =>
      Object.fromEntries(ROLE_OPTIONS.map((item) => [item.value, item.label])),
    [],
  );

  const handleChange = (event) => {
    const t = event.target;
    const { name } = t;
    const value = t.type === "checkbox" ? t.checked : t.value;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /** Task: Lưu cờ toast — switch (không checkbox); sau PATCH refetch để khớp DB khi reload — Author: DucManh-BlueOC */
  const handleSocialProofToggle = async (next) => {
    setFormData((f) => ({ ...f, social_proof_toast_enabled: next }));
    const ac = new AbortController();
    const t = window.setTimeout(() => ac.abort(), 25000);
    try {
      setSocialProofSaving(true);
      const saved = await settingsService.update(
        { social_proof_toast_enabled: next },
        { signal: ac.signal },
      );
      const merged = unwrapSettingsBody(saved) ?? saved;
      const base =
        merged && typeof merged === "object" && !Array.isArray(merged)
          ? merged
          : {};
      setSettingsOptimistic({
        ...base,
        social_proof_toast_enabled: next,
      });
      setFormData((f) => ({ ...f, social_proof_toast_enabled: next }));
      await refreshSettings();
      toast.success(
        next ? "Đã bật toast social proof" : "Đã tắt toast social proof",
        { id: "social-proof-toast-toggle" },
      );
    } catch (error) {
      const aborted =
        error?.name === "CanceledError" ||
        error?.name === "AbortError" ||
        error?.code === "ERR_CANCELED";
      if (aborted) {
        toast.error("Hết thời gian chờ máy chủ. Thử lại sau.");
      } else {
        setFormData((f) => ({ ...f, social_proof_toast_enabled: !next }));
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "Không cập nhật được toast social proof",
        );
      }
    } finally {
      window.clearTimeout(t);
      setSocialProofSaving(false);
    }
  };

  const handleLogoPick = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setLogoUploading(true);
      const logoUrl = await settingsService.uploadLogo(file);
      if (!logoUrl) throw new Error("Không lấy được URL logo");
      setFormData((prev) => ({ ...prev, logoUrl }));
      setSettingsOptimistic({ logoUrl });
      toast.success("Upload logo thành công");
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error.message ||
          "Upload logo thất bại",
      );
    } finally {
      setLogoUploading(false);
      event.target.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        logoUrl: formData.logoUrl || "",
        centerName: formData.centerName || "",
        address: formData.address || "",
        hotline: formData.hotline || "",
        email: formData.email || "",
        workingHours: formData.workingHours || "",
        bankName: formData.bankName || "Techcombank",
        bankAccountNumber: formData.bankAccountNumber || "",
        bankAccountName: formData.bankAccountName || "",
        paymentQrUrl: formData.paymentQrUrl || "",
        paymentTransferPrefix: formData.paymentTransferPrefix || "KHOAHOC",
        announcement_enabled: !!formData.announcement_enabled,
        announcement_text: formData.announcement_text || "",
        announcement_bg_color: formData.announcement_bg_color || "#ff0000",
        announcement_text_color: formData.announcement_text_color || "#ffffff",
        social_proof_toast_enabled: !!formData.social_proof_toast_enabled,
      };
      const saved = await settingsService.update(payload);
      const merged = unwrapSettingsBody(saved) ?? saved;
      const base =
        merged && typeof merged === "object" && !Array.isArray(merged)
          ? merged
          : {};
      setSettingsOptimistic({
        ...base,
        social_proof_toast_enabled: !!formData.social_proof_toast_enabled,
      });
      setFormData((f) => ({
        ...f,
        social_proof_toast_enabled: !!formData.social_proof_toast_enabled,
      }));
      toast.success("Cập nhật thành công", { id: "system-settings-save" });
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Cập nhật cấu hình thất bại",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleQrPick = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setQrUploading(true);
      const qrUrl = await settingsService.uploadPaymentQr(file);
      if (!qrUrl) throw new Error("Không lấy được URL QR");
      setFormData((prev) => ({ ...prev, paymentQrUrl: qrUrl }));
      setSettingsOptimistic({ paymentQrUrl: qrUrl });
      toast.success("Upload QR thành công");
    } catch (error) {
      toast.error(
        error?.response?.data?.message || error.message || "Upload QR thất bại",
      );
    } finally {
      setQrUploading(false);
      event.target.value = "";
    }
  };

  const handleSendParentNotification = async (event) => {
    event.preventDefault();
    if (!notifyTitle.trim() || !notifyContent.trim()) {
      toast.error("Vui lòng nhập tiêu đề và nội dung thông báo");
      return;
    }
    try {
      setSendingNotification(true);
      if (selectedRoles.length === 0) {
        toast.error("Vui lòng chọn ít nhất một nhóm người nhận");
        return;
      }
      if (recipientMode === "selectedUsers" && selectedUserIds.length === 0) {
        toast.error("Vui lòng chọn ít nhất một người nhận");
        return;
      }
      const result = await notificationService.create({
        title: notifyTitle.trim(),
        content: notifyContent.trim(),
        targetRoles: selectedRoles,
        userIds: recipientMode === "selectedUsers" ? selectedUserIds : [],
      });
      toast.success(
        `Đã gửi tới ${Number(result?.recipientsCount || 0)} người dùng`,
      );
      setNotifyTitle("");
      setNotifyContent("");
      setSelectedUserIds([]);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Gửi thông báo thất bại");
    } finally {
      setSendingNotification(false);
    }
  };

  const toggleRole = (role) => {
    setSelectedRoles((prev) =>
      prev.includes(role)
        ? prev.filter((item) => item !== role)
        : [...prev, role],
    );
  };

  const toggleUser = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((item) => item !== userId)
        : [...prev, userId],
    );
  };

  useEffect(() => {
    const loadUsers = async () => {
      if (selectedRoles.length === 0) {
        setUsers([]);
        setSelectedUserIds([]);
        return;
      }
      try {
        setLoadingUsers(true);
        const groups = await Promise.all(
          selectedRoles.map((role) => userService.getAll({ role })),
        );
        const merged = groups.flatMap((group) =>
          Array.isArray(group) ? group : [],
        );
        const uniqueUsers = Array.from(
          new Map(merged.map((user) => [String(user._id), user])).values(),
        );
        setUsers(uniqueUsers);
        setSelectedUserIds((prev) =>
          prev.filter((id) =>
            uniqueUsers.some((user) => String(user._id) === String(id)),
          ),
        );
      } catch {
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };
    loadUsers();
  }, [selectedRoles]);

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center text-gray-500">
        <Loader2 className="mr-2 animate-spin" size={18} />
        Đang tải cấu hình...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Cấu hình hệ thống</h1>
        <p className="text-sm text-gray-500 mt-1">
          Quản lý logo và thông tin trung tâm hiển thị toàn hệ thống.
        </p>
      </div>

      {/* Task: Switch (role=switch) thay checkbox — ngoài <form> — Author: DucManh-BlueOC */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm relative z-[1]">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Toast social proof (đơn / đăng ký gần đây)
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Hiển thị thông báo góc màn hình kiểu “vừa mua” trên trang công khai
          (trừ trang học). Tắt khi không cần minh chứng hoặc đang dùng dữ liệu
          mẫu.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={!!formData.social_proof_toast_enabled}
            aria-label="Bật hoặc tắt toast social proof"
            disabled={socialProofSaving}
            onClick={() => {
              const next = !formData.social_proof_toast_enabled;
              void handleSocialProofToggle(next);
            }}
            className={`relative h-8 w-[3.25rem] shrink-0 rounded-full border border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
              formData.social_proof_toast_enabled
                ? "bg-primary"
                : "bg-gray-200"
            } ${socialProofSaving ? "cursor-wait opacity-60" : "cursor-pointer"}`}
          >
            <span
              aria-hidden
              className={`pointer-events-none absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-[left] duration-200 ease-out ${
                formData.social_proof_toast_enabled
                  ? "left-[calc(100%-1.625rem)]"
                  : "left-1"
              }`}
            />
          </button>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900">
              {socialProofSaving
                ? "Đang lưu lên máy chủ…"
                : formData.social_proof_toast_enabled
                  ? "Đang bật"
                  : "Đang tắt"}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Gạt sang phải để bật. Lưu ngay, không cần nút &quot;Lưu cấu
              hình&quot; bên dưới.
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-6"
      >
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Logo trung tâm
          </label>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
              {previewLogo ? (
                <img
                  src={previewLogo}
                  alt="Logo preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs text-gray-400">No logo</span>
              )}
            </div>
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
              {logoUploading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <ImagePlus size={16} />
              )}
              <span className="text-sm">
                {logoUploading ? "Đang upload..." : "Chọn logo"}
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={handleLogoPick}
              />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên trung tâm
            </label>
            <input
              name="centerName"
              value={formData.centerName || ""}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-200 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hotline tư vấn
            </label>
            <input
              name="hotline"
              value={formData.hotline || ""}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-200 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email liên hệ
            </label>
            <input
              name="email"
              type="email"
              value={formData.email || ""}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-200 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Giờ làm việc
            </label>
            <input
              name="workingHours"
              value={formData.workingHours || ""}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-200 px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Địa chỉ
          </label>
          <textarea
            name="address"
            rows={3}
            value={formData.address || ""}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-200 px-3 py-2"
          />
        </div>

        <div className="border-t pt-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Thông tin chuyển khoản
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngân hàng
              </label>
              <input
                name="bankName"
                value={formData.bankName || ""}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số tài khoản
              </label>
              <input
                name="bankAccountNumber"
                value={formData.bankAccountNumber || ""}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chủ tài khoản
              </label>
              <input
                name="bankAccountName"
                value={formData.bankAccountName || ""}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tiền tố nội dung chuyển khoản
              </label>
              <input
                name="paymentTransferPrefix"
                value={formData.paymentTransferPrefix || ""}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2"
                placeholder="KHOAHOC"
              />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              QR chuyển khoản
            </label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center p-1">
                {formData.paymentQrUrl ? (
                  <img
                    src={formData.paymentQrUrl}
                    alt="QR preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-gray-400">No QR</span>
                )}
              </div>
              <div className="space-y-2">
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                  {qrUploading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ImagePlus size={16} />
                  )}
                  <span className="text-sm">
                    {qrUploading ? "Đang upload..." : "Chọn ảnh QR"}
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={handleQrPick}
                  />
                </label>
                <input
                  name="paymentQrUrl"
                  value={formData.paymentQrUrl || ""}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  placeholder="https://... (ảnh QR, không dùng link logo)"
                />
                {String(formData.paymentQrUrl || "")
                  .toLowerCase()
                  .includes("logo_") ? (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5">
                    Có vẻ đang dán nhầm URL file logo. Hãy bấm «Chọn ảnh QR» hoặc
                    dán link ảnh mã QR ngân hàng/VietQR.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Thanh thông báo (Announcement Bar)
          </h3>
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                name="announcement_enabled"
                checked={!!formData.announcement_enabled}
                onChange={handleChange}
                className="w-4 h-4 text-primary rounded border-gray-300"
              />
              Hiển thị thanh thông báo
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nội dung thông báo
              </label>
              <input
                name="announcement_text"
                value={formData.announcement_text || ""}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2"
                placeholder="Nhập nội dung sẽ chạy chữ trên thanh thông báo..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Màu nền (Background Color)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    name="announcement_bg_color"
                    value={formData.announcement_bg_color || "#ff0000"}
                    onChange={handleChange}
                    className="h-10 w-10 rounded cursor-pointer border-0 p-0"
                  />
                  <input
                    name="announcement_bg_color"
                    value={formData.announcement_bg_color || "#ff0000"}
                    onChange={handleChange}
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 uppercase font-mono text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Màu chữ (Text Color)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    name="announcement_text_color"
                    value={formData.announcement_text_color || "#ffffff"}
                    onChange={handleChange}
                    className="h-10 w-10 rounded cursor-pointer border-0 p-0"
                  />
                  <input
                    name="announcement_text_color"
                    value={formData.announcement_text_color || "#ffffff"}
                    onChange={handleChange}
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 uppercase font-mono text-sm"
                  />
                </div>
              </div>
            </div>
            {formData.announcement_enabled && formData.announcement_text && (
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Xem trước (Preview)
                </label>
                <div
                  className="w-full overflow-hidden whitespace-nowrap text-sm py-2 px-4 rounded-lg flex items-center"
                  style={{
                    backgroundColor: formData.announcement_bg_color,
                    color: formData.announcement_text_color,
                  }}
                >
                  <p>{formData.announcement_text}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg disabled:opacity-70"
        >
          {submitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {submitting ? "Đang lưu..." : "Lưu cấu hình"}
        </button>
      </form>

      <form
        onSubmit={handleSendParentNotification}
        className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4"
      >
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Gửi thông báo người dùng
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Admin có thể gửi đến tất cả user theo role hoặc chọn từng user cụ
            thể.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tiêu đề
          </label>
          <input
            type="text"
            value={notifyTitle}
            onChange={(event) => setNotifyTitle(event.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2"
            placeholder="Ví dụ: Nhắc lịch học tuần này"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nội dung
          </label>
          <textarea
            rows={4}
            value={notifyContent}
            onChange={(event) => setNotifyContent(event.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2"
            placeholder="Nhập nội dung thông báo..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nhóm người nhận
          </label>
          <div className="flex flex-wrap gap-3">
            {ROLE_OPTIONS.map((role) => (
              <label
                key={role.value}
                className="inline-flex items-center gap-2 text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
              >
                <input
                  type="checkbox"
                  checked={selectedRoles.includes(role.value)}
                  onChange={() => toggleRole(role.value)}
                />
                {role.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chế độ chọn người nhận
          </label>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                checked={recipientMode === "allByRole"}
                onChange={() => setRecipientMode("allByRole")}
              />
              Gửi tất cả user theo role đã chọn
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                checked={recipientMode === "selectedUsers"}
                onChange={() => setRecipientMode("selectedUsers")}
              />
              Chọn user cụ thể
            </label>
          </div>
        </div>

        {recipientMode === "selectedUsers" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Danh sách người nhận
            </label>
            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
              {loadingUsers ? (
                <div className="text-sm text-gray-500">Đang tải user...</div>
              ) : users.length === 0 ? (
                <div className="text-sm text-gray-500">
                  Không có user phù hợp role đã chọn.
                </div>
              ) : (
                users.map((user) => (
                  <label
                    key={user._id}
                    className="flex items-center gap-2 text-sm text-gray-700"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(user._id)}
                      onChange={() => toggleUser(user._id)}
                    />
                    <span className="font-medium">
                      {user.fullName || user.username || "N/A"}
                    </span>
                    <span className="text-gray-400">
                      ({roleLabelMap[user.role] || user.role})
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={sendingNotification}
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg disabled:opacity-70"
        >
          {sendingNotification ? (
            <Loader2 size={16} className="animate-spin" />
          ) : null}
          {sendingNotification ? "Đang gửi..." : "Gửi thông báo"}
        </button>
      </form>
    </div>
  );
};

export default SystemSettings;
