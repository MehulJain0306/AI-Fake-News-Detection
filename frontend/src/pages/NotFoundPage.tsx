import { Link } from "react-router-dom";
import { AlertTriangle, Home, LayoutDashboard } from "lucide-react";
import Button from "../components/common/Button";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-void px-6">
      <div className="max-w-xl text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
          <AlertTriangle className="h-10 w-10 text-red-400" />
        </div>

        <h1 className="mt-8 text-6xl font-bold text-ink">404</h1>

        <h2 className="mt-4 text-3xl font-semibold text-ink">
          Page Not Found
        </h2>

        <p className="mt-4 text-ink-muted">
          The page you're looking for doesn't exist or may have been moved.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link to="/">
            <Button
              variant="primary"
              size="lg"
              icon={<Home className="h-4 w-4" />}
            >
              Go Home
            </Button>
          </Link>

          <Link to="/dashboard">
            <Button
              variant="secondary"
              size="lg"
              icon={<LayoutDashboard className="h-4 w-4" />}
            >
              Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}