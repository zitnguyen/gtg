import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  KeyRound,
  LogOut,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import authService from "../../services/authService";
import {
  changeMyPassword,
  getMyAccount,
  updateMyAccount,
  uploadMyAvatar,
} from "../../services/accountService";
import { getRoleLabel } from "../../constants/roleLabel";
import Avatar from "../ui/Avatar";
import { Button, Field, Input } from "../ui";
import { cn } from "../../lib/utils";

const MENU_ITEMS = [
  { id: "avatar", label: "Ảnh đại diện", icon: ImageIcon },
  { id: "name", label: "Họ và tên", icon: UserRound },
  { id: "password", label: "Đổi mật khẩu", icon: KeyRound },
];

function MenuRow({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
    >
      <Icon size={16} className="text-muted-foreground shrink-0" />
      <span className="flex-1 text-left font-medium">{label}</span>
      <ChevronRight size={16} className="text-muted-foreground shrink-0" />
    </button>
  );
}

export default function UserAccountMenu({ className }) {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const avatarInputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const cachedUser = authService.getCurrentUser();
  const [fullName, setFullName] = useState(
    cachedUser?.fullName || cachedUser?.username || "",
  );
  const [avatarUrl, setAvatarUrl] = useState(cachedUser?.avatarUrl || "");
  const [pwd, setPwd] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const displayName =
    fullName.trim() || cachedUser?.fullName || cachedUser?.username || "User";
  const roleLabel = getRoleLabel(cachedUser?.role);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMyAccount();
      if (data?.fullName) setFullName(data.fullName);
      if (typeof data?.avatarUrl === "string") setAvatarUrl(data.avatarUrl);
    } catch (err) {
      toast.error(
        err?.apiMessage ||
          err?.response?.data?.message ||
          err?.message ||
          "Không tải được thông tin tài khoản",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    loadProfile();
    const onPointerDown = (e) => {
      if (containerRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, loadProfile]);

  useEffect(() => {
    if (!open) {
      setActiveSection(null);
      setPwd({ currentPassword: "", newPassword: "", confirmPassword: "" });
    }
  }, [open]);

  const handleToggle = () => {
    setOpen((v) => {
      if (v) setActiveSection(null);
      return !v;
    });
  };

  const handleSaveName = async (e) => {
    e.preventDefault();
    const trimmed = fullName.trim();
    if (!trimmed) {
      toast.error("Họ tên không được để trống");
      return;
    }
    try {
      setSavingName(true);
      await updateMyAccount({ fullName: trimmed });
      toast.success("Đã cập nhật họ tên");
      setActiveSection(null);
    } catch (err) {
      toast.error(
        err?.apiMessage ||
          err?.response?.data?.message ||
          err?.message ||
          "Cập nhật họ tên thất bại",
      );
    } finally {
      setSavingName(false);
    }
  };

  const handleAvatarPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!/^image\/(jpeg|jpg|png)$/i.test(file.type)) {
      toast.error("Chỉ hỗ trợ ảnh JPG hoặc PNG");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Kích thước ảnh tối đa 2MB");
      return;
    }
    try {
      setUploadingAvatar(true);
      const res = await uploadMyAvatar(file);
      const url = res?.url || res?.data?.url;
      if (!url) throw new Error("Thiếu URL ảnh từ server");
      await updateMyAccount({ avatarUrl: url });
      setAvatarUrl(url);
      toast.success("Đã cập nhật ảnh đại diện");
      setActiveSection(null);
    } catch (err) {
      toast.error(
        err?.apiMessage ||
          err?.response?.data?.message ||
          err?.message ||
          "Cập nhật ảnh thất bại",
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwd.newPassword !== pwd.confirmPassword) {
      toast.error("Xác nhận mật khẩu không khớp");
      return;
    }
    if (pwd.newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }
    try {
      setSavingPassword(true);
      await changeMyPassword({
        currentPassword: pwd.currentPassword,
        newPassword: pwd.newPassword,
      });
      toast.success("Đổi mật khẩu thành công");
      setPwd({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setActiveSection(null);
    } catch (err) {
      toast.error(
        err?.apiMessage ||
          err?.response?.data?.message ||
          err?.message ||
          "Đổi mật khẩu thất bại",
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = () => {
    setOpen(false);
    authService.logout();
    navigate("/login");
  };

  const sectionTitle =
    MENU_ITEMS.find((item) => item.id === activeSection)?.label || "";

  if (!cachedUser) return null;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          "flex items-center gap-2 min-w-0 rounded-lg py-1 pl-2 pr-1.5",
          "hover:bg-muted transition-colors",
          open && "bg-muted",
        )}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Tài khoản"
      >
        <div className="text-right min-w-0 hidden sm:block">
          <p className="text-sm font-medium text-foreground truncate max-w-[7rem] lg:max-w-[9rem]">
            {displayName}
          </p>
          <p className="text-xs text-muted-foreground truncate max-w-[7rem] lg:max-w-[9rem]">
            {roleLabel}
          </p>
        </div>
        <Avatar
          src={avatarUrl || undefined}
          name={displayName}
          size="sm"
          className="shrink-0"
        />
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground shrink-0 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 mt-2 w-[min(100vw-2rem,18rem)] rounded-xl border border-border bg-popover text-popover-foreground shadow-xl z-[200] overflow-hidden"
            role="dialog"
            aria-label="Cài đặt tài khoản"
          >
            <div className="px-4 py-3 border-b border-border">
              {activeSection ? (
                <button
                  type="button"
                  onClick={() => setActiveSection(null)}
                  className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary transition-colors"
                >
                  <ChevronLeft size={16} />
                  Quay lại
                </button>
              ) : (
                <>
                  <p className="text-sm font-semibold text-foreground">
                    Tài khoản
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {cachedUser.username || cachedUser.email || "—"}
                  </p>
                </>
              )}
            </div>

            <div className="p-2">
              {!activeSection ? (
                <div className="space-y-0.5">
                  {MENU_ITEMS.map((item) => (
                    <MenuRow
                      key={item.id}
                      icon={item.icon}
                      label={item.label}
                      onClick={() => setActiveSection(item.id)}
                    />
                  ))}
                  <div className="my-1 border-t border-border" />
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut size={16} className="shrink-0" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              ) : null}

              {activeSection === "avatar" ? (
                <div className="px-2 py-3 space-y-4">
                  <p className="text-sm font-semibold text-foreground px-1">
                    {sectionTitle}
                  </p>
                  <div className="flex flex-col items-center gap-3">
                    <Avatar
                      src={avatarUrl || undefined}
                      name={displayName}
                      size="lg"
                    />
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      className="hidden"
                      onChange={handleAvatarPick}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="w-full"
                      loading={uploadingAvatar}
                      disabled={loading}
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      Chọn ảnh mới
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      JPG hoặc PNG, tối đa 2MB
                    </p>
                  </div>
                </div>
              ) : null}

              {activeSection === "name" ? (
                <form
                  onSubmit={handleSaveName}
                  className="px-2 py-3 space-y-3"
                >
                  <p className="text-sm font-semibold text-foreground px-1">
                    {sectionTitle}
                  </p>
                  <Field label="Họ và tên" required>
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={loading || savingName}
                      placeholder="Nhập họ tên"
                      autoComplete="name"
                    />
                  </Field>
                  <Button
                    type="submit"
                    size="sm"
                    className="w-full"
                    loading={savingName}
                    disabled={loading}
                  >
                    Lưu họ tên
                  </Button>
                </form>
              ) : null}

              {activeSection === "password" ? (
                <form
                  onSubmit={handleChangePassword}
                  className="px-2 py-3 space-y-3"
                >
                  <p className="text-sm font-semibold text-foreground px-1">
                    {sectionTitle}
                  </p>
                  <Field label="Mật khẩu hiện tại" required>
                    <Input
                      type="password"
                      value={pwd.currentPassword}
                      onChange={(e) =>
                        setPwd((p) => ({
                          ...p,
                          currentPassword: e.target.value,
                        }))
                      }
                      autoComplete="current-password"
                      disabled={savingPassword}
                    />
                  </Field>
                  <Field label="Mật khẩu mới" required>
                    <Input
                      type="password"
                      value={pwd.newPassword}
                      onChange={(e) =>
                        setPwd((p) => ({ ...p, newPassword: e.target.value }))
                      }
                      autoComplete="new-password"
                      disabled={savingPassword}
                    />
                  </Field>
                  <Field label="Xác nhận mật khẩu mới" required>
                    <Input
                      type="password"
                      value={pwd.confirmPassword}
                      onChange={(e) =>
                        setPwd((p) => ({
                          ...p,
                          confirmPassword: e.target.value,
                        }))
                      }
                      autoComplete="new-password"
                      disabled={savingPassword}
                    />
                  </Field>
                  <Button
                    type="submit"
                    size="sm"
                    variant="outline"
                    className="w-full"
                    loading={savingPassword}
                  >
                    Đổi mật khẩu
                  </Button>
                </form>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
