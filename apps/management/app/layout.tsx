import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import SidebarNav from "./sidebar-nav";
import UiPreferences from "./ui-preferences";
import LanguageToggle from "./language-toggle";

export const metadata: Metadata = {
  title: "מערכת ניהול שליחים אסטרטגית",
  description: "פלטפורמת ניהול ותפעול SCMS"
};

const navItems = [
  { label: "דשבורד", href: "/", icon: "◼" },
  { label: "שליחים", href: "/couriers", icon: "◼" },
  { label: "שיוך מסעדות", href: "/restaurant-assignments", icon: "◼" },
  { label: "לקוחות VIP", href: "/vip-customers", icon: "◼" },
  { label: "הזמנות", href: "/orders", icon: "◼" },
  { label: "יומן נסיעות", href: "/trip-log", icon: "◼" },
  { label: "אנליטיקה", href: "/analytics", icon: "◼" },
  { label: "הגדרות דיספאץ'", href: "/dispatch-config", icon: "◼" },
  { label: "סימולציה", href: "/simulation", icon: "◼" },
  { label: "תרגומים", href: "/translations", icon: "◼" },
  { label: "תור תמיכה", href: "/support-queue", icon: "◼" },
  { label: "יומן ביקורת", href: "/audit-log", icon: "◼" },
  { label: "הגדרות", href: "/settings", icon: "◼" }
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body>
        <UiPreferences />
        <LanguageToggle />
        <div className="layout">
          <aside className="sidebar">
            <div className="brand">
              SCMS <span>בקרה</span>
            </div>
            <SidebarNav items={navItems} />
          </aside>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
