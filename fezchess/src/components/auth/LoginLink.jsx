import { Link, useLocation } from "react-router-dom";
import { loginNavigationState } from "../../utils/loginRedirect";

/** Link /login kèm state quay lại trang hiện tại sau đăng nhập */
export default function LoginLink({ to = "/login", state, ...props }) {
  const location = useLocation();
  const mergedState = state ?? loginNavigationState(location);
  return <Link to={to} state={mergedState} {...props} />;
}
