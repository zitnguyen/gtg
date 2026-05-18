import SiteHeader from "./SiteHeader";

/** @deprecated Dùng SiteHeader — giữ export để tương thích import cũ */
export default function Header() {
  return <SiteHeader mode="public" />;
}
