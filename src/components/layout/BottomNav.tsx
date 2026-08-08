import { History, LayoutDashboard, Shield, Trophy, Users } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAdminAuth } from "../../auth/AdminAuthContext";
import { cn } from "../../lib/utils";

const publicItems = [
  { to: "/", label: "Rank", icon: Trophy, end: true },
  { to: "/players", label: "Players", icon: Users, end: true },
  { to: "/matches", label: "Matches", icon: History, end: false },
] as const;

export function BottomNav() {
  const { isAuthenticated } = useAdminAuth();
  const items = isAuthenticated
    ? [
        ...publicItems,
        { to: "/admin", label: "Admin", icon: Shield, end: false },
      ]
    : publicItems;

  return (
    <nav
      aria-label="Primary navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_-20px_rgba(9,37,26,0.5)] backdrop-blur md:sticky md:top-0 md:mx-auto md:mt-4 md:max-w-[1100px] md:rounded-2xl md:border md:p-1 md:shadow-card"
    >
      <div className="mx-auto grid max-w-lg grid-flow-col auto-cols-fr md:flex md:max-w-none md:items-center md:justify-start">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex min-h-16 min-w-16 flex-col items-center justify-center gap-1 rounded-xl px-3 text-[0.68rem] font-bold transition md:min-h-11 md:flex-row md:gap-2 md:text-sm",
                isActive
                  ? "bg-fairway-50 text-fairway-900"
                  : "text-slate-500 hover:text-fairway-800",
              )
            }
          >
            <Icon aria-hidden="true" size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
        {!isAuthenticated && (
          <NavLink
            to="/admin/login"
            className="hidden min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-500 transition hover:text-fairway-800 md:ml-auto md:flex"
          >
            <LayoutDashboard aria-hidden="true" size={20} />
            Admin access
          </NavLink>
        )}
      </div>
    </nav>
  );
}
