"use client";

import { Languages } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  variant?: "icon" | "text" | "full";
  className?: string;
}

export function LanguageSwitcher({
  variant = "full",
  className,
}: LanguageSwitcherProps) {
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === "ar" ? "en" : "ar");
  };

  if (variant === "icon") {
    return (
      <button
        onClick={toggleLanguage}
        className={cn(
          "p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors",
          className
        )}
        title={t("language", "switchLanguage")}
        aria-label={t("language", "switchLanguage")}
      >
        <Languages size={20} className="text-(--text-muted)" />
      </button>
    );
  }

  if (variant === "text") {
    return (
      <button
        onClick={toggleLanguage}
        className={cn(
          "text-sm font-medium text-(--text-muted) hover:text-(--text) transition-colors",
          className
        )}
      >
        {t("language", "switchLanguage")}
      </button>
    );
  }

  return (
    <button
      onClick={toggleLanguage}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors",
        className
      )}
    >
      <Languages size={18} className="text-(--text-muted)" />
      <span className="text-sm font-medium text-(--text)">
        {t("language", "switchLanguage")}
      </span>
    </button>
  );
}
