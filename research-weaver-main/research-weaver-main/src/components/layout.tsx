import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { Menu, X } from "lucide-react";
import { AppSidebar } from "./sidebar";

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

export function AppSidebarLayout({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on navigation
  const location = useLocation();
  useState(() => {
    setMobileMenuOpen(false);
  });

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <AppSidebar />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative flex w-64 max-w-sm flex-col bg-[#171717]">
            <button
              className="absolute right-[-40px] top-4 p-2 text-white bg-black/50 rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="size-5" />
            </button>
            <AppSidebar />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-background">
          <Logo />
          <button onClick={() => setMobileMenuOpen(true)}>
            <Menu className="size-5" />
          </button>
        </div>
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export function PageShell({ children, nav = "app" }: { children: ReactNode; nav?: "app" | "public" }) {
  if (nav === "app") {
    return <AppSidebarLayout>{children}</AppSidebarLayout>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNav />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
