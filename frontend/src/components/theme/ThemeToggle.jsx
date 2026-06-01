import { Moon, Sun } from "lucide-react";
import { useAppearance } from "../../roles/shared/AppearanceContext";

function ThemeToggle({ className = "", showLabel = false }) {
  const { theme, toggleTheme } = useAppearance();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`.trim()}
      onClick={toggleTheme}
      aria-label={isDark ? "Chuyển sang light mode" : "Chuyển sang dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        {isDark ? <Moon size={16} /> : <Sun size={16} />}
      </span>
      {showLabel && <span>{isDark ? "Dark" : "Light"}</span>}
    </button>
  );
}

export default ThemeToggle;
