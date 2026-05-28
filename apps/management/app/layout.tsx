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
  { labelHe: "דשבורד", labelEn: "Dashboard", href: "/", icon: "◼" },
  { labelHe: "שליחים", labelEn: "Couriers", href: "/couriers", icon: "◼" },
  { labelHe: "שיוך מסעדות", labelEn: "Restaurant Assignments", href: "/restaurant-assignments", icon: "◼" },
  { labelHe: "לקוחות VIP", labelEn: "VIP Customers", href: "/vip-customers", icon: "◼" },
  { labelHe: "הזמנות", labelEn: "Orders", href: "/orders", icon: "◼" },
  { labelHe: "יומן נסיעות", labelEn: "Trip Log", href: "/trip-log", icon: "◼" },
  { labelHe: "אנליטיקה", labelEn: "Analytics", href: "/analytics", icon: "◼" },
  { labelHe: "הגדרות דיספאץ'", labelEn: "Dispatch Config", href: "/dispatch-config", icon: "◼" },
  { labelHe: "סימולציה", labelEn: "Simulation", href: "/simulation", icon: "◼" },
  { labelHe: "תרגומים", labelEn: "Translations", href: "/translations", icon: "◼" },
  { labelHe: "תור תמיכה", labelEn: "Support Queue", href: "/support-queue", icon: "◼" },
  { labelHe: "יומן ביקורת", labelEn: "Audit Log", href: "/audit-log", icon: "◼" },
  { labelHe: "הגדרות", labelEn: "Settings", href: "/settings", icon: "◼" }
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body>
        <div className="layout">
          <aside className="sidebar">
            <div className="brand">
              SCMS <span>בקרה</span>
            </div>
            <SidebarNav items={navItems} />
          </aside>
          <main className="main">
            <UiPreferences />
            <div className="main-toolbar">
              <LanguageToggle />
            </div>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
