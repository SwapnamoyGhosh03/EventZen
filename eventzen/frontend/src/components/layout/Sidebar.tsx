import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Calendar,
  MapPin,
  Ticket,
  IndianRupee,
  BarChart3,
  Users,
  Package,
  QrCode,
  Settings,
  Bell,
  X,
  ClipboardCheck,
  Briefcase,
  Star,
  ChevronLeft,
  ChevronRight,
  CreditCard,
} from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import Logo, { LogoMark } from "@/components/ui/Logo";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggle: () => void;
}

const customerLinks = [
  { label: "Dashboard", path: "/customer/dashboard", icon: LayoutDashboard },
  { label: "My Tickets", path: "/my/tickets", icon: Ticket },
  { label: "My Reviews", path: "/my/reviews", icon: Star },
  { label: "Become a Vendor", path: "/customer/become-vendor", icon: Briefcase },
];

const vendorLinks = [
  { label: "Dashboard", path: "/vendor/dashboard", icon: LayoutDashboard },
  { label: "Events", path: "/vendor/events", icon: Calendar },
  { label: "Service Vendors", path: "/vendor/services", icon: Package },
  { label: "Reviews", path: "/vendor/reviews", icon: Star },
  { label: "Venues", path: "/vendor/venues", icon: MapPin },
  { label: "Check-In", path: "/vendor/check-in", icon: QrCode },
  { label: "Finance", path: "/vendor/finance", icon: IndianRupee },
  { label: "Reports", path: "/vendor/reports", icon: BarChart3 },
];

const adminLinks = [
  { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Events", path: "/admin/events", icon: Calendar },
  { label: "Reviews", path: "/admin/reviews", icon: Star },
  { label: "Check-In", path: "/admin/check-in", icon: QrCode },
  { label: "Venues", path: "/admin/venues", icon: MapPin },
  { label: "Vendors", path: "/admin/vendors", icon: Package },
  { label: "Applications", path: "/admin/applications", icon: ClipboardCheck },
  { label: "Finance", path: "/admin/finance", icon: IndianRupee },
  { label: "Subscriptions", path: "/admin/subscriptions", icon: CreditCard },
  { label: "Reports", path: "/admin/reports", icon: BarChart3 },
];

const bottomLinks = [
  { label: "Notifications", path: "/account/notifications", icon: Bell },
  { label: "Settings", path: "/account/settings", icon: Settings },
];

function NavLink({
  link,
  isActive,
  collapsed,
  onClick,
}: {
  link: { label: string; path: string; icon: React.ElementType };
  isActive: boolean;
  collapsed: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      to={link.path}
      onClick={onClick}
      title={collapsed ? link.label : undefined}
      className={`
        flex items-center gap-3 rounded-md transition-all duration-200
        font-body text-sm
        ${collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"}
        ${
          isActive
            ? "bg-amber/10 text-amber font-medium"
            : "text-dark-gray hover:bg-cream hover:text-near-black"
        }
      `}
    >
      <link.icon size={18} className="shrink-0" />
      {!collapsed && <span>{link.label}</span>}
    </Link>
  );
}

export default function Sidebar({ isOpen, onClose, collapsed, onToggle }: SidebarProps) {
  const { user } = useAuthContext();
  const location = useLocation();
  const role = user?.role || "CUSTOMER";

  const navLinks =
    role === "ADMIN"
      ? adminLinks
      : role === "ORGANIZER" || role === "VENDOR"
        ? vendorLinks
        : customerLinks;

  const mobileContent = (
    <div className="flex flex-col h-full">
      {/* Logo + Close */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border-light">
        <Link to="/">
          <Logo size={28} showText />
        </Link>
        <button
          onClick={onClose}
          className="p-1 text-muted-gray hover:text-near-black transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Role label */}
      <div className="px-6 py-3">
        <span className="font-accent text-[10px] font-semibold uppercase tracking-[2px] text-muted-gray">
          {role} Portal
        </span>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navLinks.map((link) => (
          <NavLink
            key={link.path}
            link={link}
            isActive={location.pathname === link.path}
            collapsed={false}
            onClick={onClose}
          />
        ))}
      </nav>

      {/* Bottom Links */}
      <div className="px-3 py-4 border-t border-border-light space-y-0.5">
        {bottomLinks.map((link) => (
          <NavLink
            key={link.path}
            link={link}
            isActive={location.pathname === link.path}
            collapsed={false}
            onClick={onClose}
          />
        ))}
      </div>

      {/* User Info */}
      {user && (
        <div className="px-4 py-4 border-t border-border-light">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber text-white flex items-center justify-center font-accent text-sm font-semibold shrink-0">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <div className="min-w-0">
              <p className="font-body text-sm font-medium text-near-black truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="font-body text-xs text-muted-gray truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 256 }}
        transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
        className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 bg-white border-r border-border-light z-30 overflow-hidden"
      >
        {/* Logo + Toggle */}
        <div
          className={`flex items-center border-b border-border-light shrink-0 h-[73px] ${
            collapsed ? "justify-center px-0" : "justify-between px-6"
          }`}
        >
          {!collapsed && (
            <Link to="/">
              <Logo size={28} showText className="whitespace-nowrap" />
            </Link>
          )}
          {collapsed && (
            <Link to="/" className="mb-1">
              <LogoMark size={26} />
            </Link>
          )}
          <button
            onClick={onToggle}
            className="p-1.5 text-muted-gray hover:text-near-black hover:bg-cream rounded-md transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Role label */}
        {!collapsed && (
          <div className="px-6 py-3 shrink-0">
            <span className="font-accent text-[10px] font-semibold uppercase tracking-[2px] text-muted-gray whitespace-nowrap">
              {role} Portal
            </span>
          </div>
        )}
        {collapsed && <div className="py-3" />}

        {/* Nav Links */}
        <nav className={`flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden ${collapsed ? "px-2" : "px-3"}`}>
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              link={link}
              isActive={location.pathname === link.path}
              collapsed={collapsed}
            />
          ))}
        </nav>

        {/* Bottom Links */}
        <div className={`py-4 border-t border-border-light space-y-0.5 ${collapsed ? "px-2" : "px-3"}`}>
          {bottomLinks.map((link) => (
            <NavLink
              key={link.path}
              link={link}
              isActive={location.pathname === link.path}
              collapsed={collapsed}
            />
          ))}
        </div>

        {/* User Info */}
        {user && (
          <div className={`py-4 border-t border-border-light ${collapsed ? "flex justify-center" : "px-4"}`}>
            <div
              className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? `${user.firstName} ${user.lastName}` : undefined}
            >
              <div className="w-9 h-9 rounded-full bg-amber text-white flex items-center justify-center font-accent text-sm font-semibold shrink-0">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <p className="font-body text-sm font-medium text-near-black truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="font-body text-xs text-muted-gray truncate">{user.email}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-near-black/40 z-40 lg:hidden"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] as const }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-white z-50 lg:hidden"
            >
              {mobileContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
