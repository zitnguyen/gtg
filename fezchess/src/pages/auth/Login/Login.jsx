import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Lock, User } from "lucide-react";
import authService from "../../../services/authService";
import {
  Button,
  Card,
  Field,
  Input,
} from "../../../components/ui";
import { useSystemSettings } from "../../../context/SystemSettingsContext";
import { resolvePostLoginPath } from "../../../utils/loginRedirect";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { settings, refreshSettings } = useSystemSettings();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await authService.login({ username, password });
      const role = result?.role || authService.getCurrentUser()?.role;
      const target = resolvePostLoginPath(location.state, role);
      // Task: Tải lại settings kèm Bearer — tránh giữ bản public khiến Admin lưu sai / toast không bật
      try {
        await refreshSettings();
      } catch {
        /* ignore */
      }
      navigate(target, { replace: true });
    } catch (err) {
      console.error("Login failed", err);
      setError("Tên đăng nhập hoặc mật khẩu không đúng");
    } finally {
      setLoading(false);
    }
  };

  const centerName = settings?.centerName || "Z CHESS";
  const logoUrl = settings?.logoUrl;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-muted/40 via-background to-muted/30 flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-md animate-slide-up">
        <Card padded={false} className="overflow-hidden">
          <div className="px-6 md:px-8 pt-8 md:pt-10 pb-6 md:pb-8">
            <div className="text-center space-y-3 mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mx-auto">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={centerName}
                    className="w-10 h-10 rounded-xl object-cover"
                  />
                ) : (
                  <span className="text-3xl">♟️</span>
                )}
              </div>
              <div className="space-y-1.5">
                <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
                  Đăng nhập
                </h1>
                <p className="text-sm text-muted-foreground">
                  Truy cập hệ thống {centerName}
                </p>
              </div>
            </div>

            {error ? (
              <div
                role="alert"
                className="mb-5 rounded-lg border border-destructive/20 bg-destructive/5 px-3.5 py-3 text-sm text-destructive flex items-start gap-2 animate-fade-in"
              >
                <span className="mt-1 inline-block w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            <form onSubmit={handleLogin} className="space-y-4">
              <Field label="Tên đăng nhập" required>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  placeholder="username"
                  leftIcon={<User className="w-4 h-4" />}
                  required
                />
              </Field>

              <Field label="Mật khẩu" required>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  leftIcon={<Lock className="w-4 h-4" />}
                  required
                />
              </Field>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                loading={loading}
              >
                Đăng nhập
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Chưa có tài khoản?{" "}
              <Link
                to="/signup"
                state={
                  location.state?.from
                    ? { from: location.state.from }
                    : undefined
                }
                className="text-primary font-medium hover:underline"
              >
                Đăng ký
              </Link>
            </div>
            <div className="mt-2 text-center text-xs text-muted-foreground">
              <Link to="/" className="hover:text-foreground transition-colors">
                ← Quay lại trang chủ
              </Link>
            </div>
          </div>

          <div
            aria-hidden="true"
            className="h-1 w-full bg-gradient-to-r from-primary via-blue-500 to-indigo-500"
          />
        </Card>
      </div>
    </div>
  );
};

export default Login;
