import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Megaphone } from "lucide-react";
import notificationApiService from "../services/notificationApiService";
import userService from "../../../services/userService";

const ROLE_OPTIONS = [
  { value: "Teacher", label: "Giáo viên" },
  { value: "Parent", label: "Phụ huynh" },
  { value: "Student", label: "Học viên" },
];

const AdminNotificationCreatePage = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedRoles, setSelectedRoles] = useState(["Teacher"]);
  const [recipientMode, setRecipientMode] = useState("allByRole");
  const [users, setUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const roleLabelMap = useMemo(
    () => Object.fromEntries(ROLE_OPTIONS.map((role) => [role.value, role.label])),
    [],
  );

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        setError("");
        const userGroups = await Promise.all(
          selectedRoles.map((role) => userService.getAll({ role })),
        );
        const merged = userGroups.flatMap((group) =>
          Array.isArray(group) ? group : [],
        );
        const unique = Array.from(
          new Map(merged.map((user) => [String(user._id), user])).values(),
        );
        setUsers(unique);
      } catch {
        setError("Không thể tải danh sách người nhận.");
      } finally {
        setLoadingUsers(false);
      }
    };

    if (selectedRoles.length > 0) {
      loadUsers();
    } else {
      setUsers([]);
      setSelectedUserIds([]);
    }
  }, [selectedRoles]);

  useEffect(() => {
    setSelectedUserIds((prev) => prev.filter((id) => users.some((u) => u._id === id)));
  }, [users]);

  const toggleRole = (role) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  const toggleUser = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSending(true);
      setError("");
      setMessage("");
      if (!title.trim() || !content.trim()) {
        setError("Vui lòng nhập tiêu đề và nội dung.");
        return;
      }
      if (selectedRoles.length === 0) {
        setError("Vui lòng chọn ít nhất một role nhận.");
        return;
      }
      if (recipientMode === "selectedUsers" && selectedUserIds.length === 0) {
        setError("Vui lòng chọn ít nhất một người nhận.");
        return;
      }

      const payload = {
        title: title.trim(),
        content: content.trim(),
        targetRoles: selectedRoles,
        userIds: recipientMode === "selectedUsers" ? selectedUserIds : [],
      };

      const result = await notificationApiService.create(payload);
      if (result?.skipped) {
        setMessage("Thông báo trùng với một broadcast vừa được gửi nên đã bỏ qua để tránh spam.");
      } else {
        setMessage(
          `Đã gửi thông báo thành công tới ${result?.recipientsCount || 0} người nhận.`,
        );
        setTitle("");
        setContent("");
        setSelectedUserIds([]);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Gửi thông báo thất bại.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-3xl mx-auto">
      <Link
        to="/admin/notifications"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={16} />
        Quay lại danh sách
      </Link>
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Megaphone size={20} />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tạo Notification</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Admin gửi thông báo cho Teacher / Parent / Student theo role hoặc theo user cụ thể.
            Hệ thống tự động khử trùng lặp trong 5 giây.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-background border border-border rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm"
      >
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Tiêu đề
          </label>
          <input
            type="text"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Nhập tiêu đề thông báo"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Nội dung
          </label>
          <textarea
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm min-h-[120px]"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Nhập nội dung thông báo"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Role nhận thông báo
          </label>
          <div className="flex flex-wrap gap-2">
            {ROLE_OPTIONS.map((role) => {
              const active = selectedRoles.includes(role.value);
              return (
                <button
                  type="button"
                  key={role.value}
                  onClick={() => toggleRole(role.value)}
                  className={`inline-flex items-center gap-2 text-xs font-medium border rounded-full px-3 py-1.5 transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/30 text-foreground border-border"
                  }`}
                >
                  {role.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Chế độ chọn người nhận
          </label>
          <div className="flex flex-wrap gap-3 text-sm">
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                checked={recipientMode === "allByRole"}
                onChange={() => setRecipientMode("allByRole")}
              />
              Tất cả user theo role đã chọn
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
            <label className="block text-sm font-medium text-foreground mb-2">
              Danh sách người nhận
            </label>
            <div className="max-h-64 overflow-y-auto border border-border rounded-lg p-3 space-y-2">
              {loadingUsers ? (
                <div className="text-sm text-muted-foreground">Đang tải user...</div>
              ) : users.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  Không có user phù hợp role đã chọn.
                </div>
              ) : (
                users.map((user) => (
                  <label
                    key={user._id}
                    className="flex items-center gap-2 text-sm text-foreground"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(user._id)}
                      onChange={() => toggleUser(user._id)}
                    />
                    <span className="font-medium">
                      {user.fullName || user.username || "N/A"}
                    </span>
                    <span className="text-muted-foreground">
                      ({roleLabelMap[user.role] || user.role})
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-sm rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        {message && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-sm rounded-lg px-3 py-2">
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={sending}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-60 text-sm font-medium"
        >
          {sending ? "Đang gửi..." : "Gửi Notification"}
        </button>
      </form>
    </div>
  );
};

export default AdminNotificationCreatePage;
