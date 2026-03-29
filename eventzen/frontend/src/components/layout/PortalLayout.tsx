import { useState } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Menu, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import Sidebar from "./Sidebar";
import Avatar from "@/components/ui/Avatar";
import Dropdown from "@/components/ui/Dropdown";
import { useAuthContext } from "@/context/AuthContext";
import { useAuth } from "@/hooks/useAuth";

export default function PortalLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuthContext();
  const { logout } = useAuth();
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="bg-cream min-h-screen">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
      />

      <motion.div
        animate={{ marginLeft: collapsed ? 64 : 256 }}
        transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
        className="hidden lg:block"
      >
        {/* Desktop Top Bar */}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-border-light">
          <div className="flex items-center justify-between h-14 px-8">
            <Link to="/events" className="font-body text-sm text-muted-gray hover:text-amber transition-colors">
              Browse Events
            </Link>
            <div className="flex items-center gap-3">
              {user && (
                <Dropdown
                  trigger={
                    <div className="flex items-center gap-2 cursor-pointer">
                      <Avatar name={`${user.firstName} ${user.lastName}`} size="sm" />
                      <span className="hidden sm:block font-body text-sm text-near-black">
                        {user.firstName}
                      </span>
                    </div>
                  }
                  items={[
                    { key: "settings", label: "Settings", onClick: () => {} },
                    { key: "logout", label: "Sign Out", icon: <LogOut size={16} />, danger: true, onClick: logout },
                  ]}
                />
              )}
            </div>
          </div>
        </header>
        <main className="p-8">
          <Outlet />
        </main>
      </motion.div>

      {/* Mobile layout (no margin animation needed) */}
      <div className="lg:hidden">
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-border-light">
          <div className="flex items-center justify-between h-14 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-near-black hover:bg-cream rounded-md transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-3">
              {user && (
                <Dropdown
                  trigger={
                    <div className="flex items-center gap-2 cursor-pointer">
                      <Avatar name={`${user.firstName} ${user.lastName}`} size="sm" />
                      <span className="hidden sm:block font-body text-sm text-near-black">
                        {user.firstName}
                      </span>
                    </div>
                  }
                  items={[
                    { key: "settings", label: "Settings", onClick: () => {} },
                    { key: "logout", label: "Sign Out", icon: <LogOut size={16} />, danger: true, onClick: logout },
                  ]}
                />
              )}
            </div>
          </div>
        </header>
        <main className="p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
