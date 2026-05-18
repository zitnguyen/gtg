import { Link, useLocation } from "react-router-dom";
import {
  PUBLIC_MAIN_NAV_LINKS,
  isPublicMainNavActive,
} from "../../constants/publicMainNav";
import { cn } from "../../lib/utils";

const navLinkClass = (active) =>
  cn(
    "inline-flex items-center justify-center h-9 px-3 text-sm font-medium whitespace-nowrap rounded-md transition-colors",
    "border-b-2 border-transparent -mb-px",
    active
      ? "text-primary border-primary"
      : "text-muted-foreground hover:text-foreground hover:border-border",
  );

/** Menu trang công khai — dùng trong SiteHeader */
export default function PublicMainNav({ className, onNavigate, variant }) {
  const location = useLocation();

  if (variant === "mobile") {
    return (
      <nav className={cn("space-y-1", className)} aria-label="Trang công khai">
        {PUBLIC_MAIN_NAV_LINKS.map((link) => {
          const active = isPublicMainNavActive(link.path, location.pathname);
          return (
            <Link
              key={link.path}
              to={link.path}
              onClick={onNavigate}
              className={cn(
                "block py-3 px-4 rounded-xl font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted",
              )}
            >
              {link.name}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav
      className={cn(
        "flex items-center justify-center gap-1 sm:gap-2 h-full min-h-0",
        className,
      )}
      aria-label="Trang công khai"
    >
      {PUBLIC_MAIN_NAV_LINKS.map((link) => {
        const active = isPublicMainNavActive(link.path, location.pathname);
        return (
          <Link
            key={link.path}
            to={link.path}
            onClick={onNavigate}
            className={navLinkClass(active)}
          >
            {link.name}
          </Link>
        );
      })}
    </nav>
  );
}
