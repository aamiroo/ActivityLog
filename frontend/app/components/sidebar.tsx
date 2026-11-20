"use client";

import {
  Activity,
  LayoutDashboard,
  Users,
  Utensils,
  History,
  Clock3,
  PanelRightClose,
} from "lucide-react";

export type PageId =
  | "dashboard"
  | "people"
  | "foods"
  | "history"
  | "record";

const items: {
  id: PageId;
  label: string;
  icon: typeof Activity;
}[] = [
  { id: "dashboard", label: "داشبورد", icon: LayoutDashboard },
  { id: "record", label: "ثبت فعالیت", icon: Clock3 },
  { id: "people", label: "مدیریت افراد", icon: Users },
  { id: "foods", label: "مدیریت غذاها", icon: Utensils },
  { id: "history", label: "تاریخچه", icon: History },
];

interface SidebarProps {
  active: PageId;
  onNavigate: (page: PageId) => void;
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({
  active,
  onNavigate,
  collapsed,
  onToggle,
}: SidebarProps) {
  return (
    <aside
      className={`flex h-full flex-col border-l border-[var(--border)] bg-[var(--surface)] transition-all ${
        collapsed ? "w-[76px]" : "w-[250px]"
      }`}
    >
      <div className="flex h-[76px] items-center justify-between border-b border-[var(--border)] px-5">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Activity size={22} />
            </div>
            <div>
              <h1 className="font-bold">ActivityLog</h1>
              <p className="mt-1 text-xs text-[var(--muted)]">
                مدیریت فعالیت‌ها
              </p>
            </div>
          </div>
        )}

        <button
          onClick={onToggle}
          className="rounded-lg p-2 hover:bg-[var(--background)]"
          aria-label="جمع کردن منو"
        >
          <PanelRightClose size={19} />
        </button>
      </div>

      <nav className="flex-1 space-y-2 p-3 pt-6">
        {!collapsed && (
          <p className="mb-4 px-3 text-xs text-[var(--muted)]">
            منوی اصلی
          </p>
        )}

        {items.map(({ id, label, icon: Icon }) => {
          const selected = active === id;

          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              title={collapsed ? label : undefined}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
                selected
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-[var(--muted)] hover:bg-[var(--background)] hover:text-[var(--foreground)]"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <Icon size={19} />
              {!collapsed && <span>{label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-[var(--border)] p-4">
        {!collapsed && (
          <div className="rounded-xl bg-[var(--background)] p-3">
            <p className="text-xs font-semibold">ActivityLog</p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              نسخه محلی
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}