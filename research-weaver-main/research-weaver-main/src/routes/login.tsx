import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Eye, EyeOff, Github } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) && password.length >= 1;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setSubmitting(true);
    setErr(null);
    try {
      await login(email, password);
      toast.success("Welcome back");
      navigate("/dashboard");
    } catch (e) {
      setErr("Unable to sign in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue your research.">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Email address">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="auth-input"
            placeholder="you@university.edu"
          />
        </Field>
        <Field label="Password">
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="auth-input pr-10"
              placeholder="••••••••"
            />
            <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-muted-foreground">
            <input type="checkbox" className="rounded" /> Remember me
          </label>
          <Link to="/forgot-password" className="text-brand hover:underline">Forgot password?</Link>
        </div>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <button
          type="submit"
          disabled={!valid || submitting}
          className="w-full bg-brand text-brand-foreground py-2.5 rounded-md font-medium ring-1 ring-brand shadow-sm disabled:opacity-50 hover:opacity-95"
        >
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <Divider />

      <div className="grid grid-cols-2 gap-3">
        <OAuthButton label="Google" />
        <OAuthButton label="GitHub" icon={<Github className="size-4" />} />
      </div>

      <p className="mt-6 text-sm text-center text-muted-foreground">
        Don't have an account?{" "}
        <Link to="/signup" className="text-brand font-medium hover:underline">Sign up</Link>
      </p>
    </AuthShell>
  );
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="px-6 py-5 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <Link to="/" className="flex items-center gap-2 font-semibold text-brand-dark">
            <span className="inline-flex size-6 items-center justify-center rounded bg-brand-dark text-[10px] font-bold text-white font-mono">R</span>
            ResearchAI
          </Link>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8 bg-card p-6 rounded-2xl ring-1 ring-black/5 shadow-sm">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Field({ label, children, hint, error }: { label: string; children: React.ReactNode; hint?: string; error?: string }) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">{label}</label>
      {children}
      {error ? (
        <p className="text-xs text-destructive mt-1.5">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground mt-1.5">{hint}</p>
      ) : null}
    </div>
  );
}

export function Divider() {
  return (
    <div className="my-6 flex items-center gap-3">
      <div className="flex-1 h-px bg-border" />
      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">or</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

export function OAuthButton({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => toast.info(`${label} OAuth not yet wired in this frontend demo`)}
      className="flex items-center justify-center gap-2 bg-background py-2 rounded-md text-sm font-medium ring-1 ring-black/5 hover:bg-accent transition-colors"
    >
      {icon}
      {label}
    </button>
  );
}

// Tailwind shorthand styles via class composition
// Used by all auth forms
const _styles = `.auth-input { width: 100%; }`;
void _styles;
