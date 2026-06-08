import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Building2,
  BedDouble,
  Users,
  CreditCard,
  Wrench,
  UserCog,
  Settings,
  Hotel,
  ChevronLeft,
  X,
} from "lucide-react";
import { useAuth } from "../../stores/authStore";
import { cn } from "../../lib/utils";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const { user } = useAuth();
  if (!user) return null;

  const isSuperAdmin = user.role === "super_admin";
  const isManager = user.role === "manager";
  const perms = user.permissions ?? [];
  const canManage = (p: string) => !isManager || perms.includes(p as never);

  const items = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard", show: true },
    { to: "/hostels", icon: Building2, label: "Hostels", show: isSuperAdmin },
    {
      to: "/rooms",
      icon: BedDouble,
      label: "Rooms & Beds",
      show: !isSuperAdmin && canManage("manage_rooms"),
    },
    {
      to: "/tenants",
      icon: Users,
      label: "Tenants",
      show: !isSuperAdmin && canManage("manage_tenants"),
    },
    {
      to: "/payments",
      icon: CreditCard,
      label: "Payments",
      show: !isSuperAdmin && canManage("manage_payments"),
    },
    {
      to: "/maintenance",
      icon: Wrench,
      label: "Maintenance",
      show: !isSuperAdmin && canManage("manage_maintenance"),
    },
    {
      to: "/staff",
      icon: UserCog,
      label: "Staff",
      show: user.role === "owner" || isSuperAdmin,
    },
    { to: "/settings", icon: Settings, label: "Settings", show: true },
  ].filter((i) => i.show);

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onMobileClose}
            className="md:hidden fixed inset-0 bg-black/50 z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 76 : 248 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "h-screen sticky top-0 bg-white border-r border-ink-100 flex-col z-30",
          "hidden md:flex",
        )}
      >
        <div className="h-16 px-4 flex items-center gap-3 border-b border-ink-100">
          <div className="h-9 w-9 shrink-0 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-sm">
            <Hotel size={18} />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="font-bold text-ink-900 leading-tight">
                HostelHub
              </div>
              <div className="text-[11px] text-ink-500 truncate">
                Management Suite
              </div>
            </div>
          )}
          <button
            onClick={onToggle}
            className={cn(
              "p-1.5 rounded-lg hover:bg-ink-100 text-ink-500 transition-all",
              collapsed && "rotate-180",
            )}
          >
            <ChevronLeft size={16} />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={onMobileClose}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative group",
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-ink-600 hover:bg-ink-50 hover:text-ink-900",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="active-pill"
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-brand-600 rounded-r-full"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}
                  <item.icon size={18} className="shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {collapsed && (
                    <span className="absolute left-full ml-3 px-2 py-1 bg-ink-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                      {item.label}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        {!collapsed && (
          <div className="p-3 border-t border-ink-100">
            <div className="rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 p-4 text-white">
              <div className="text-xs font-semibold uppercase tracking-wider opacity-80">
                {user.role === "super_admin"
                  ? "Super Admin"
                  : user.role === "owner"
                    ? "Hostel Owner"
                    : "Manager"}
              </div>
              <div className="text-sm mt-1 font-medium">{user.name}</div>
            </div>
          </div>
        )}
      </motion.aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="md:hidden fixed inset-y-0 left-0 w-72 bg-white border-r border-ink-100 flex flex-col z-50"
          >
            <div className="h-16 px-4 flex items-center gap-3 border-b border-ink-100">
              <div className="h-9 w-9 shrink-0 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-sm">
                <Hotel size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-ink-900 leading-tight">
                  HostelHub
                </div>
                <div className="text-[11px] text-ink-500 truncate">
                  Management Suite
                </div>
              </div>
              <button
                onClick={onMobileClose}
                className="p-1.5 rounded-lg hover:bg-ink-100 text-ink-500"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  onClick={onMobileClose}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative group",
                      isActive
                        ? "bg-brand-50 text-brand-700"
                        : "text-ink-600 hover:bg-ink-50 hover:text-ink-900",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.span
                          layoutId="active-pill-mobile"
                          className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-brand-600 rounded-r-full"
                        />
                      )}
                      <item.icon size={18} className="shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
            <div className="p-3 border-t border-ink-100">
              <div className="rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 p-4 text-white">
                <div className="text-xs font-semibold uppercase tracking-wider opacity-80">
                  {user.role === "super_admin"
                    ? "Super Admin"
                    : user.role === "owner"
                      ? "Hostel Owner"
                      : "Manager"}
                </div>
                <div className="text-sm mt-1 font-medium">{user.name}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
