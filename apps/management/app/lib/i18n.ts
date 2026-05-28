"use client";

import { useEffect, useState } from "react";

export type ManagementLanguage = "he" | "en" | "ru" | "ar";

const settingsKey = "management_ui_settings";

export function readManagementLanguage(): ManagementLanguage {
  if (typeof window === "undefined") return "he";
  try {
    const raw = localStorage.getItem(settingsKey);
    if (!raw) return "he";
    const parsed = JSON.parse(raw) as { language?: string };
    if (parsed.language === "en" || parsed.language === "he" || parsed.language === "ru" || parsed.language === "ar") {
      return parsed.language;
    }
    return "he";
  } catch {
    return "he";
  }
}

export function useManagementLanguage(): ManagementLanguage {
  const [language, setLanguage] = useState<ManagementLanguage>("he");
  useEffect(() => {
    const apply = (): void => setLanguage(readManagementLanguage());
    apply();
    window.addEventListener("management-language-changed", apply);
    window.addEventListener("storage", apply);
    return () => {
      window.removeEventListener("management-language-changed", apply);
      window.removeEventListener("storage", apply);
    };
  }, []);
  return language;
}

const he = {
  // common
  save: "שמירה",
  saving: "שומר...",
  add: "הוספה",
  refresh: "רענון נתונים",
  loading: "טוען...",
  optional: "אופציונלי",
  none: "לא הוגדר",
  search: "חיפוש",
  export: "ייצוא",
  status: "סטטוס",
  city: "עיר",
  phone: "טלפון",
  // dashboard
  dashboard_active_couriers: "שליחים פעילים",
  dashboard_in_progress: "משלוחים בביצוע",
  dashboard_current_ptod: "PToD נוכחי",
  dashboard_utilization: "ניצול צי",
  dashboard_on_run: "שליחים בנסיעה",
  dashboard_waiting: "שליחים ממתינים לשיוך",
  dashboard_map_title: "מפה חיה - שליחים, מסעדות ולקוחות VIP",
  dashboard_map_legend_courier: "שליחים",
  dashboard_map_legend_restaurant: "מסעדות",
  dashboard_map_legend_vip: "לקוחות VIP",
  dashboard_jobs_title: "משימות פעילות",
  dashboard_jobs_empty: "אין משימות פעילות כרגע.",
  dashboard_col_courier: "שליח",
  dashboard_col_restaurant: "מסעדה",
  dashboard_col_destination: "יעד",
  dashboard_col_time: "זמן במשימה",
  open_courier_app: "פתח את אפליקציית השליחים",
  minutes: "דקות",
  // restaurants
  restaurants_title: "שיוך מסעדות",
  restaurants_add: "הוספת מסעדה חדשה",
  restaurants_name: "שם מסעדה",
  restaurants_code: "קוד מסעדה",
  restaurants_street: "רחוב",
  restaurants_number: "מספר",
  restaurants_directions: "הוראות מיוחדות",
  restaurants_zone: "אזור",
  restaurants_vip_status: "סטטוס VIP",
  restaurants_matrix: "מטריצת שיוך שליחים",
  restaurants_compliance: "תאימות שיוך יומית",
  restaurants_required: "נדרש",
  restaurants_assigned: "משויך",
  restaurants_alert: "חוסר בשיוך מול סטטוס VIP",
  vip_half: "0.5 שליח (משרה חלקית)",
  vip_one: "שליח אחד במשרה מלאה",
  vip_two: "שני שליחים במשרה מלאה",
  // vip customers
  vip_title: "לקוחות VIP",
  vip_add: "הוספת לקוח VIP",
  vip_name: "שם לקוח",
  vip_contact: "איש קשר",
  vip_contact_phone: "טלפון איש קשר",
  // couriers
  couriers_title: "שליחים",
  couriers_add: "הוספת שליח",
  couriers_name: "שם מלא",
  couriers_list: "רשימת שליחים",
  couriers_deliveries: "משלוחים",
  couriers_issues: "בעיות",
  // orders
  orders_title: "הזמנות במצב עצמאי",
  // trip log
  triplog_title: "יומן נסיעות",
  triplog_mode_specific: "תאריך ספציפי",
  triplog_mode_range: "טווח תאריכים",
  triplog_from: "מתאריך",
  triplog_to: "עד תאריך",
  triplog_date: "תאריך",
  triplog_apply: "הצג",
  triplog_export_csv: "ייצוא ל-CSV",
  triplog_empty: "אין נסיעות בטווח שנבחר.",
  // settings
  settings_title: "הגדרות",
  settings_mode: "מצב תפעול",
  settings_language: "שפה",
  settings_appearance: "תצוגה",
  // support / audit
  support_title: "תור תמיכה",
  audit_title: "יומן ביקורת"
};

type MessageKey = keyof typeof he;
type Messages = Record<MessageKey, string>;

const en: Messages = {
  save: "Save",
  saving: "Saving...",
  add: "Add",
  refresh: "Refresh Data",
  loading: "Loading...",
  optional: "optional",
  none: "Not set",
  search: "Search",
  export: "Export",
  status: "Status",
  city: "City",
  phone: "Phone",
  dashboard_active_couriers: "Active Couriers",
  dashboard_in_progress: "Deliveries In Progress",
  dashboard_current_ptod: "Current PToD",
  dashboard_utilization: "Fleet Utilization",
  dashboard_on_run: "Couriers On Run",
  dashboard_waiting: "Couriers Waiting For Assignment",
  dashboard_map_title: "Live Map - Couriers, Restaurants and VIP Customers",
  dashboard_map_legend_courier: "Couriers",
  dashboard_map_legend_restaurant: "Restaurants",
  dashboard_map_legend_vip: "VIP Customers",
  dashboard_jobs_title: "Active Jobs",
  dashboard_jobs_empty: "No active jobs right now.",
  dashboard_col_courier: "Courier",
  dashboard_col_restaurant: "Restaurant",
  dashboard_col_destination: "Destination",
  dashboard_col_time: "Time On Job",
  open_courier_app: "Open Courier App",
  minutes: "min",
  restaurants_title: "Restaurant Assignments",
  restaurants_add: "Add New Restaurant",
  restaurants_name: "Restaurant Name",
  restaurants_code: "Restaurant Code",
  restaurants_street: "Street",
  restaurants_number: "Number",
  restaurants_directions: "Special Directions",
  restaurants_zone: "Zone",
  restaurants_vip_status: "VIP Status",
  restaurants_matrix: "Courier Assignment Matrix",
  restaurants_compliance: "Daily Assignment Compliance",
  restaurants_required: "Required",
  restaurants_assigned: "Assigned",
  restaurants_alert: "Assignment below VIP status",
  vip_half: "0.5 courier (part-time)",
  vip_one: "1 full-time courier",
  vip_two: "2 full-time couriers",
  vip_title: "VIP Customers",
  vip_add: "Add VIP Customer",
  vip_name: "Customer Name",
  vip_contact: "Contact Name",
  vip_contact_phone: "Contact Phone",
  couriers_title: "Couriers",
  couriers_add: "Add Courier",
  couriers_name: "Full Name",
  couriers_list: "Courier List",
  couriers_deliveries: "Deliveries",
  couriers_issues: "Issues",
  orders_title: "Standalone Orders",
  triplog_title: "Trip Log",
  triplog_mode_specific: "Specific date",
  triplog_mode_range: "Date range",
  triplog_from: "From",
  triplog_to: "To",
  triplog_date: "Date",
  triplog_apply: "Show",
  triplog_export_csv: "Export CSV",
  triplog_empty: "No trips in the selected range.",
  settings_title: "Settings",
  settings_mode: "Operation Mode",
  settings_language: "Language",
  settings_appearance: "Appearance",
  support_title: "Support Queue",
  audit_title: "Audit Log"
};

export function getMessages(language: ManagementLanguage): Messages {
  if (language === "he") return he;
  return en;
}

export function useMessages(): { language: ManagementLanguage; t: Messages } {
  const language = useManagementLanguage();
  return { language, t: getMessages(language) };
}
