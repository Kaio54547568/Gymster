import { Globe } from "lucide-react";
import { useLanguage } from "../../roles/shared/LanguageContext";

function LanguageToggle({ className = "", showLabel = false }) {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === "vi" ? "en" : "vi");
  };

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`.trim()}
      onClick={toggleLanguage}
      aria-label={language === "vi" ? "Switch to English" : "Chuyển sang Tiếng Việt"}
      title={language === "vi" ? "English" : "Tiếng Việt"}
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        <Globe size={16} />
      </span>
      {showLabel && <span>{language === "vi" ? "Tiếng Việt" : "English"}</span>}
      {!showLabel && <span style={{ marginLeft: "4px", fontSize: "12px", fontWeight: "bold" }}>{language.toUpperCase()}</span>}
    </button>
  );
}

export default LanguageToggle;
