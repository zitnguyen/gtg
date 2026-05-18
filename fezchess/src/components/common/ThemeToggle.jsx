import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { cn } from "../../lib/utils";
import {
  HEADER_TOOLBAR_ICON_SIZE,
  headerToolbarButtonClass,
} from "../layout/headerToolbarStyles";

const ThemeToggle = ({ className }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(headerToolbarButtonClass, className)}
      aria-label={isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
      title={isDark ? "Giao diện sáng" : "Giao diện tối"}
    >
      {isDark ? (
        <Sun size={HEADER_TOOLBAR_ICON_SIZE} aria-hidden />
      ) : (
        <Moon size={HEADER_TOOLBAR_ICON_SIZE} aria-hidden />
      )}
    </button>
  );
};

export default ThemeToggle;
