import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Compass, LogOut, ShieldCheck } from "lucide-react";
import Button from "../components/common/Button";
import { useAuth } from "../context/AuthContext";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-void">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-[500px] bg-grad-radial-violet opacity-40"
      />

      <header className="section-shell flex items-center justify-between py-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-grad-primary">
            <ShieldCheck className="h-4 w-4 text-white" strokeWidth={2.4} />
          </span>
          <span className="font-display text-sm font-semibold text-ink">
            AI Fake News Detector
          </span>
        </Link>
        <Button
          variant="secondary"
          size="md"
          icon={<LogOut className="h-4 w-4" />}
          onClick={handleLogout}
        >
          Logout
        </Button>
      </header>

      <main className="section-shell flex flex-1 items-center justify-center py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass mx-auto max-w-lg rounded-3xl p-10 text-center"
        >
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-grad-primary shadow-glow">
            <Compass className="h-7 w-7 text-white" strokeWidth={2} />
          </span>
          <h1 className="mt-6 text-2xl font-semibold text-ink sm:text-3xl">
            Dashboard Coming Next
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted sm:text-base">
            {user
              ? `You're logged in as ${user.name}. `
              : "You're logged in. "}
            The detection workspace, scan history, and stats are being
            built in the next milestone.
          </p>
          <p className="mt-6 text-xs text-ink-faint">
            Signed in as {user?.email}
          </p>
        </motion.div>
      </main>
    </div>
  );
}
