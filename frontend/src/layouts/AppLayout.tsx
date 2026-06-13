import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, FolderKanban, ListChecks, StickyNote,
  Clock, FileText, Settings as Cog, LogOut, Menu,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { clsx } from "clsx";
import type { Role } from "@/types";

type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }>; roles?: Role[] };
const items: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
  { to: "/notes", label: "Notes", icon: StickyNote },
  { to: "/time", label: "Time", icon: Clock },
  { to: "/documents", label: "Documents", icon: FileText },
  { to: "/users", label: "Users", icon: Users, roles: ["admin"] },
  { to: "/settings", label: "Settings", icon: Cog, roles: ["admin"] },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const visible = items.filter((i) => !i.roles || (user && i.roles.includes(user.role)));

  return (
    <div className="flex h-full">
      <aside className={clsx(
        "w-60 shrink-0 border-r border-slate-200 bg-white flex flex-col",
        open ? "block fixed inset-y-0 left-0 z-40" : "hidden md:flex",
      )}>
        <div className="h-14 flex items-center px-4 border-b border-slate-200">
          <span className="font-semibold tracking-tight text-slate-900">ERP</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {visible.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 px-4 py-2 text-sm",
                  isActive
                    ? "bg-brand-50 text-brand-700 border-r-2 border-brand-600"
                    : "text-slate-700 hover:bg-slate-50",
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-200 text-xs text-slate-500">
          <div className="truncate font-medium text-slate-700">{user?.name}</div>
          <div className="truncate">{user?.email}</div>
          <div className="mt-1 inline-block badge bg-slate-50 text-slate-600 ring-slate-200">{user?.role}</div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 flex items-center justify-between px-4 border-b border-slate-200 bg-white">
          <button className="md:hidden btn-secondary !p-2" onClick={() => setOpen((v) => !v)}>
            <Menu className="h-4 w-4" />
          </button>
          <div className="text-sm text-slate-500">Internal ERP</div>
          <button
            className="btn-secondary"
            onClick={async () => { await logout(); nav("/login"); }}
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
