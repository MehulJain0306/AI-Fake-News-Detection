import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, LogOut, Menu, ShieldCheck, X } from "lucide-react";
import Button from "../common/Button";
import { useAuth } from "../../context/AuthContext";
import type { NavLink as NavLinkType } from "../../types/landing";

const NAV_LINKS: NavLinkType[] = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "About", href: "#how-it-works" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate("/", { replace: true });
  };

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-void/80 backdrop-blur-xl border-b border-border"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <nav className="section-shell flex h-18 items-center justify-between py-4">
        <a href="#home" className="flex items-center gap-2.5 group">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-grad-primary shadow-glow-sm">
            <ShieldCheck className="h-5 w-5 text-white" strokeWidth={2.4} />
          </span>
          <span className="font-display text-[15px] font-semibold text-ink sm:text-base">
            AI Fake News <span className="text-gradient">Detector</span>
          </span>
        </a>

        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <>
              <Button
                variant="secondary"
                size="md"
                icon={<LayoutDashboard className="h-4 w-4" />}
                onClick={() => navigate("/dashboard")}
              >
                Dashboard
              </Button>
              <Button
                variant="ghost"
                size="md"
                icon={<LogOut className="h-4 w-4" />}
                onClick={handleLogout}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="md" onClick={() => navigate("/login")}>
                Log in
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate("/register")}
              >
                Get Started
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-ink md:hidden"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden border-b border-border bg-void/95 backdrop-blur-xl md:hidden"
          >
            <div className="section-shell flex flex-col gap-1 py-4">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-3 text-base font-medium text-ink-muted transition-colors hover:bg-white/[0.04] hover:text-ink"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-2 flex flex-col gap-3 border-t border-border pt-4">
                {isAuthenticated ? (
                  <>
                    <Button
                      variant="secondary"
                      size="md"
                      className="w-full"
                      icon={<LayoutDashboard className="h-4 w-4" />}
                      onClick={() => {
                        setMobileOpen(false);
                        navigate("/dashboard");
                      }}
                    >
                      Dashboard
                    </Button>
                    <Button
                      variant="primary"
                      size="md"
                      className="w-full"
                      icon={<LogOut className="h-4 w-4" />}
                      onClick={handleLogout}
                    >
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="secondary"
                      size="md"
                      className="w-full"
                      onClick={() => {
                        setMobileOpen(false);
                        navigate("/login");
                      }}
                    >
                      Log in
                    </Button>
                    <Button
                      variant="primary"
                      size="md"
                      className="w-full"
                      onClick={() => {
                        setMobileOpen(false);
                        navigate("/register");
                      }}
                    >
                      Get Started
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
