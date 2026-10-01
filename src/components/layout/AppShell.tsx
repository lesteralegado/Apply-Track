import { useState, type ReactNode } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  LayoutDashboard,
  LogOut,
  Sprout,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { signOut } from "../../features/auth/api/auth";
export function Logo() {
  return (
    <Link to="/demo" className="brand" aria-label="ApplyTrack home">
      <span className="brand-mark">
        <Sprout size={23} />
      </span>
      ApplyTrack<span className="brand-period">.</span>
    </Link>
  );
}
export function AppShell({
  demo = false,
  children,
}: {
  demo?: boolean;
  children?: ReactNode;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const links = demo
    ? [
        { to: "/demo", label: "Overview", icon: LayoutDashboard },
        {
          to: "/demo?view=applications",
          label: "Applications",
          icon: BriefcaseBusiness,
        },
      ]
    : [
        { to: "/app/dashboard", label: "Overview", icon: LayoutDashboard },
        {
          to: "/app/applications",
          label: "Applications",
          icon: BriefcaseBusiness,
        },
      ];
  async function logout() {
    setBusy(true);
    setError("");
    try {
      await signOut();
      navigate("/sign-in", { replace: true });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const active = (to: string) =>
    demo
      ? location.search.includes("view=applications")
        ? to.includes("?")
        : !to.includes("?")
      : location.pathname.startsWith(to);
  const navigation = (
    <>
      {links.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          className={active(to) ? "nav-link active" : "nav-link"}
          aria-current={active(to) ? "page" : undefined}
        >
          <Icon size={19} />
          {label}
        </Link>
      ))}
    </>
  );
  return (
    <div className="app-layout">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className="sidebar">
        <Logo />
        <p className="nav-label">YOUR WORKSPACE</p>
        <nav aria-label="Main navigation">{navigation}</nav>
        <div className="sidebar-note">
          <span className="note-icon">
            <Sprout size={23} />
          </span>
          <h3>
            A little progress,
            <br />
            every day.
          </h3>
          <p>Your next chapter starts with one small step.</p>
        </div>
        <div className="sidebar-bottom">
          <ShieldCheck size={17} />
          <span>
            {demo
              ? "Fictional data. Real possibilities."
              : "Your applications stay private."}
          </span>
        </div>
      </aside>
      <div className="workspace">
        <header className="app-header">
          <div className="mobile-brand">
            <Logo />
          </div>
          <span className="header-breadcrumb">
            Workspace <span>/</span>{" "}
            {location.pathname.includes("applications") ||
            location.search.includes("applications")
              ? "Applications"
              : "Overview"}
          </span>
          <div className="header-account">
            {demo ? (
              <>
                <span className="demo-pill">DEMO WORKSPACE</span>
                <Link className="text-link" to="/sign-in">
                  Sign in <ArrowUpRight size={15} />
                </Link>
              </>
            ) : (
              <>
                <span
                  className="account-email"
                  title={user?.email ?? undefined}
                >
                  {user?.email}
                </span>
                <span className="avatar">
                  {user?.email?.slice(0, 2).toUpperCase()}
                </span>
                <button
                  className="icon-button"
                  onClick={logout}
                  disabled={busy}
                  aria-label="Sign out"
                >
                  <LogOut size={19} />
                </button>
              </>
            )}
          </div>
        </header>
        {error && (
          <p role="alert" className="error-banner">
            {error}
          </p>
        )}
        <main id="main" className="main-content" tabIndex={-1}>
          {children ?? <Outlet />}
        </main>
        <footer className="workspace-footer">
          <span>ApplyTrack · A little clarity for your next chapter.</span>
          <span>Built for your job search.</span>
        </footer>
      </div>
      <nav className="mobile-navigation" aria-label="Mobile navigation">
        {navigation}
      </nav>
    </div>
  );
}
