"use client";

import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export default function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="sidebar-nav">
      {items.map((item) => {
        const isActive = pathname === item.href;
        return (
          <a key={item.href} href={item.href} className={`nav-item ${isActive ? "active" : ""}`}>
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
}
