import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";
import NotificationBell from "@/components/layout/NotificationBell";
import { useAuthContext } from "@/context/AuthContext";
import Logo from "@/components/ui/Logo";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "Events", path: "/events", badge: "Live" },
  { label: "Pricing", path: "/pricing" },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { isAuthenticated, portalPath } = useAuthContext();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center pt-4 px-4 pointer-events-none">
      {/* Floating pill */}
      <motion.nav
        initial={{ y: -28, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.25, 1, 0.5, 1] }}
        className={`
          pointer-events-auto w-full max-w-[720px]
          flex items-center gap-1 px-2 py-1.5 rounded-full border
          transition-all duration-500
          ${isScrolled
            ? "bg-cream/95 backdrop-blur-2xl border-border-light shadow-lg"
            : "bg-cream/75 backdrop-blur-xl border-butter/70 shadow-md shadow-near-black/5"
          }
        `}
      >
        {/* Logo capsule */}
        <Link
          to="/"
          className="flex items-center px-2.5 py-1.5 rounded-full bg-near-black shrink-0 hover:bg-near-black/85 transition-all duration-200"
        >
          <Logo size={22} showText={true} dark className="gap-1.5" />
        </Link>

        {/* Divider */}
        <div className="hidden md:block w-px h-4 bg-border-light mx-0.5 shrink-0" />

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
          {navLinks.map((link) => {
            const isActive =
              link.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`
                  flex items-center gap-1.5 px-3.5 py-1.5 rounded-full
                  font-body text-sm font-medium transition-all duration-200
                  ${isActive
                    ? "bg-amber/10 text-amber"
                    : "text-near-black/60 hover:text-near-black hover:bg-near-black/5"
                  }
                `}
              >
                {link.label}
                {link.badge && (
                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-burgundy/10 text-burgundy text-[9px] font-bold uppercase tracking-widest leading-none">
                    <span className="w-1 h-1 rounded-full bg-burgundy animate-pulse" />
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px h-4 bg-border-light mx-0.5 shrink-0" />

        {/* Desktop right actions */}
        <div className="hidden md:flex items-center gap-1 shrink-0">
          {isAuthenticated ? (
            <>
              <NotificationBell />
              <Link to={portalPath}>
                <motion.span
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber text-white text-sm font-body font-medium cursor-pointer hover:bg-amber/90 transition-colors"
                >
                  Dashboard
                  <ArrowRight size={13} />
                </motion.span>
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/auth"
                className="px-3.5 py-1.5 rounded-full font-body text-sm font-medium text-near-black/60 hover:text-near-black hover:bg-near-black/5 transition-all duration-200"
              >
                Sign In
              </Link>
              <Link to="/auth">
                <motion.span
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber text-white text-sm font-body font-medium cursor-pointer hover:bg-amber/90 transition-colors"
                >
                  Get Started
                </motion.span>
              </Link>
            </>
          )}
        </div>

        {/* Mobile: push hamburger right */}
        <div className="flex-1 md:hidden" />

        {/* Mobile hamburger */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          className="md:hidden p-2 rounded-full text-near-black/60 hover:bg-near-black/5 transition-colors mr-0.5"
          onClick={() => setIsMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <AnimatePresence mode="wait" initial={false}>
            {isMobileOpen ? (
              <motion.span
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="block"
              >
                <X size={18} />
              </motion.span>
            ) : (
              <motion.span
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="block"
              >
                <Menu size={18} />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.nav>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
            className="pointer-events-auto mt-2 w-full max-w-[720px] bg-cream/98 backdrop-blur-2xl rounded-2xl border border-border-light shadow-xl overflow-hidden"
          >
            <div className="p-2.5 space-y-0.5">
              {navLinks.map((link, i) => {
                const isActive =
                  link.path === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(link.path);
                return (
                  <motion.div
                    key={link.path}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.2 }}
                  >
                    <Link
                      to={link.path}
                      className={`
                        flex items-center justify-between px-4 py-3 rounded-xl
                        font-body text-sm font-medium transition-colors
                        ${isActive
                          ? "bg-amber/10 text-amber"
                          : "text-near-black hover:bg-near-black/5"
                        }
                      `}
                    >
                      {link.label}
                      {link.badge && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-burgundy/10 text-burgundy text-[9px] font-bold uppercase tracking-widest leading-none">
                          <span className="w-1 h-1 rounded-full bg-burgundy animate-pulse" />
                          {link.badge}
                        </span>
                      )}
                    </Link>
                  </motion.div>
                );
              })}
              <div className="pt-1.5 mt-0.5 border-t border-border-light">
                {isAuthenticated ? (
                  <Link
                    to={portalPath}
                    className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-amber text-white font-body text-sm font-medium hover:bg-amber/90 transition-colors"
                  >
                    Go to Dashboard
                    <ArrowRight size={14} />
                  </Link>
                ) : (
                  <Link
                    to="/auth"
                    className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-amber text-white font-body text-sm font-medium hover:bg-amber/90 transition-colors"
                  >
                    Get Started
                    <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
