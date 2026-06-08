import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { ChevronDown, LogOut, Menu, Settings, User as UserIcon, X } from "lucide-react";

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 text-brand-dark font-semibold tracking-tight text-lg">
      <span className="inline-flex size-6 items-center justify-center rounded bg-brand-dark text-[10px] font-bold text-white font-mono">R</span>
      ResearchAI
    </Link>
  );
}

export function PublicNav() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Logo />
          <div className="hidden md:flex items-center gap-6">
            <a href="/#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-brand transition-colors">How it works</a>
            <a href="/#features" className="text-sm font-medium text-muted-foreground hover:text-brand transition-colors">Features</a>
            <Link to="/about" className="text-sm font-medium text-muted-foreground hover:text-brand transition-colors">About</Link>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <Link to="/dashboard" className="bg-brand text-brand-foreground text-sm font-medium py-2 px-4 rounded-md ring-1 ring-brand shadow-sm hover:opacity-95">
              Open dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-muted-foreground px-3 py-2 hover:text-foreground">Sign in</Link>
              <Link to="/signup" className="bg-brand text-brand-foreground text-sm font-medium py-2 px-4 rounded-md ring-1 ring-brand shadow-sm hover:opacity-95">
                Get started
              </Link>
            </>
          )}
        </div>
        <button className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="px-6 py-4 flex flex-col gap-3">
            <a href="/#how-it-works" className="text-sm text-muted-foreground">How it works</a>
            <a href="/#features" className="text-sm text-muted-foreground">Features</a>
            <Link to="/about" className="text-sm text-muted-foreground">About</Link>
            {user ? (
              <Link to="/dashboard" className="bg-brand text-brand-foreground text-sm font-medium py-2 px-4 rounded-md text-center">Open dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium">Sign in</Link>
                <Link to="/signup" className="bg-brand text-brand-foreground text-sm font-medium py-2 px-4 rounded-md text-center">Get started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export function AppNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobile, setMobile] = useState(false);

  const initials = (user?.name ?? "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const navLink = (to: string, label: string) => {
    const active = path === to || (to !== "/dashboard" && path.startsWith(to));
    return (
      <Link
        to={to}
        className={`text-sm font-medium transition-colors ${active ? "text-brand" : "text-muted-foreground hover:text-foreground"}`}
      >
        {label}
      </Link>
    );
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Logo />
          <div className="hidden md:flex items-center gap-6">
            {navLink("/dashboard", "Dashboard")}
            {navLink("/history", "History")}
            {navLink("/settings", "Settings")}
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3 relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent transition-colors"
          >
            <div className="size-8 rounded-full bg-brand-dark text-white flex items-center justify-center text-xs font-semibold font-mono">
              {initials}
            </div>
            <div className="text-left leading-tight">
              <div className="text-xs font-medium text-foreground">{user?.name ?? "Guest"}</div>
              <div className="text-[10px] text-muted-foreground font-mono uppercase">Researcher</div>
            </div>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-12 w-52 rounded-lg bg-card ring-1 ring-black/5 shadow-lg p-1 z-50">
              <Link
                to="/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-accent"
              >
                <UserIcon className="size-3.5" /> Profile
              </Link>
              <Link
                to="/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-accent"
              >
                <Settings className="size-3.5" /> Settings
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-accent text-destructive"
              >
                <LogOut className="size-3.5" /> Log out
              </button>
            </div>
          )}
        </div>
        <button className="md:hidden" onClick={() => setMobile((v) => !v)} aria-label="Menu">
          {mobile ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {mobile && (
        <div className="md:hidden border-t border-border bg-background px-6 py-4 flex flex-col gap-3">
          <Link to="/dashboard" className="text-sm">Dashboard</Link>
          <Link to="/history" className="text-sm">History</Link>
          <Link to="/settings" className="text-sm">Settings</Link>
          <button onClick={handleLogout} className="text-sm text-destructive text-left">Log out</button>
        </div>
      )}
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="bg-card border-t border-border py-16 mt-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <Logo />
            <p className="mt-4 text-sm text-muted-foreground max-w-[30ch] text-pretty">
              Accelerating the path from query to intelligence through multi-agent orchestration.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 col-span-2">
            <div>
              <h4 className="text-xs font-bold text-foreground uppercase tracking-widest mb-6">Product</h4>
              <ul className="space-y-4">
                <li><a href="/#how-it-works" className="text-sm text-muted-foreground hover:text-brand transition-colors">How it works</a></li>
                <li><a href="/#features" className="text-sm text-muted-foreground hover:text-brand transition-colors">Features</a></li>
                <li><Link to="/about" className="text-sm text-muted-foreground hover:text-brand transition-colors">About</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground uppercase tracking-widest mb-6">Legal</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-sm text-muted-foreground hover:text-brand transition-colors">Privacy policy</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-brand transition-colors">Terms of service</a></li>
                <li><a href="https://github.com/vinay-kumar-3574/ResearchAI" target="_blank" rel="noreferrer" className="text-sm text-muted-foreground hover:text-brand transition-colors">GitHub</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} ResearchAI. All rights reserved.</p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Back to top ↑
          </button>
        </div>
      </div>
    </footer>
  );
}

export function PageShell({ children, nav = "app" }: { children: ReactNode; nav?: "app" | "public" }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {nav === "app" ? <AppNav /> : <PublicNav />}
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
