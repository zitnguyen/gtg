import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, LogOut } from "lucide-react";
import { toast } from "sonner";
import authService from "../../services/authService";
import {
  changeMyPassword,
  getMyAccount,
  updateMyAccount,
} from "../../services/accountService";
import { getRoleLabel } from "../../constants/roleLabel";
import Avatar from "../ui/Avatar";
import { Button, Field, Input } from "../ui";
import { cn } from "../../lib/utils";

export default function UserAccountMenu({ className }) {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const cachedUser = authService.getCurrentUser();
  const [fullName, setFullName] = useState(
    cachedUser?.fullName || cachedUser?.username || "",
  );
  const [pwd, setPwd] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const displayName =
    cachedUser?.fullName || cachedUser?.username || "User";
  const roleLabel = getRoleLabel(cachedUser?.role);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMyAccount();
      if (data?.fullName) setFullName(data.fullName);
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

  if (!cachedUser) return null;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
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
        <Avatar name={displayName} size="sm" className="shrink-0" />
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
            className="absolute right-0 mt-2 w-[min(100vw-2rem,20rem)] rounded-xl border border-border bg-popover text-popover-foreground shadow-xl z-[200] overflow-hidden"
            role="dialog"
            aria-label="Cài đặt tài khoản"
          >
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-semibold text-foreground">
                Tài khoản
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {cachedUser.username || cachedUser.email || "—"}
              </p>
            </div>

            <div className="p-4 space-y-4 max-h-[min(70vh,28rem)] overflow-y-auto">
              <form onSubmit={handleSaveName} className="space-y-3">
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

              <div className="border-t border-border pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Đổi mật khẩu
                </p>
                <form onSubmit={handleChangePassword} className="space-y-3">
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
              </div>

              <div className="border-t border-border pt-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut size={16} />
                  Đăng xuất
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
