"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface NavItem {
  labelHe: string;
  labelEn: string;
  href: string;
  icon: string;
  external?: boolean;
}

export default function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const [language, setLanguage] = useState<"he" | "en">("he");

  useEffect(() => {
    const applyFromStorage = (): void => {
      const raw = localStorage.getItem("management_ui_settings");
      if (!raw) {
        setLanguage("he");
        return;
      }
      try {
        const parsed = JSON.parse(raw) as { language?: string };
        setLanguage(parsed.language === "en" ? "en" : "he");
      } catch {
        setLanguage("he");
      }
    };

    applyFromStorage();
    window.addEventListener("management-language-changed", applyFromStorage);
    return () => {
      window.removeEventListener("management-language-changed", applyFromStorage);
    };
  }, []);

  return (
    <nav className="sidebar-nav">
      {items.map((item) => {
        const isActive = !item.external && pathname === item.href;
        return (
          <a
            key={item.href}
            href={item.href}
            className={`nav-item ${isActive ? "active" : ""} ${item.external ? "nav-item-external" : ""}`}
            {...(item.external ? { target: "_blank", rel: "noreferrer" } : {})}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{language === "he" ? item.labelHe : item.labelEn}</span>
          </a>
        );
      })}
    </nav>
  );
}
