import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Home, LifeBuoy } from "lucide-react";
import authService from "../../services/authService";
import { Button } from "../ui";

const ROLE_HOME = {
  Admin: "/dashboard",
  Teacher: "/teacher",
  Parent: "/parent",
  Student: "/student",
};

const NotFoundPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = authService.getCurrentUser?.();
  const home = (user && ROLE_HOME[user.role]) || "/";

  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center px-4 py-12 bg-background text-foreground">
      <div className="max-w-lg w-full text-center space-y-5">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mx-auto">
          <span className="font-display text-2xl font-bold text-primary">404</span>
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">
            Không tìm thấy trang bạn yêu cầu
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Đường dẫn{" "}
            <code className="px-1.5 py-0.5 rounded bg-muted text-xs">
              {location.pathname}
            </code>{" "}
            không tồn tại hoặc đã được di chuyển.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
          <Button
            variant="outline"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate(-1)}
          >
            Quay lại
          </Button>
          <Button
            leftIcon={<Home className="w-4 h-4" />}
            onClick={() => navigate(home)}
          >
            {user ? "Về trang điều khiển" : "Về trang chủ"}
          </Button>
          <Link to="/contact">
            <Button
              variant="ghost"
              leftIcon={<LifeBuoy className="w-4 h-4" />}
            >
              Liên hệ hỗ trợ
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
