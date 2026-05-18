import SiteHeader from "../../../components/layout/SiteHeader";

/** Top bar portal — cùng SiteHeader với trang công khai */
export default function PortalTopBar({ role = "admin" }) {
  return <SiteHeader mode="portal" role={role} />;
}
