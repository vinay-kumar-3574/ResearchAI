import { Link, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { AuthShell, Divider, Field, OAuthButton } from "./login";
import { Eye, EyeOff, Github, Check } from "lucide-react";
import { toast } from "sonner";


export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const checks = useMemo(() => ({
    len: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    num: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  }), [password]);

  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  const nameOk = name.trim().length >= 2;
  const pwOk = Object.values(checks).every(Boolean);
  const matchOk = confirm.length > 0 && confirm === password;
  const valid = nameOk && emailOk && pwOk && matchOk;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setSubmitting(true);
    try {
      await signup(name.trim(), email, password);
      toast.success("Account created");
      navigate("/dashboard");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="Start synthesizing research in minutes.">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Full name" error={name && !nameOk ? "Name must be at least 2 characters" : undefined}>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="auth-input" placeholder="Jane Researcher" />
        </Field>
        <Field label="Email address" error={email && !emailOk ? "Please enter a valid email address" : undefined}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="auth-input" placeholder="you@university.edu" />
        </Field>
        <Field label="Password">
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="auth-input pr-10"
              placeholder="At least 8 characters"
            />
            <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {password && (
            <ul className="mt-3 grid grid-cols-2 gap-1 text-[11px]">
              {[
                ["len", "8+ characters"],
                ["upper", "Uppercase letter"],
                ["lower", "Lowercase letter"],
                ["num", "Number"],
                ["special", "Special character"],
              ].map(([k, label]) => {
                const ok = (checks as Record<string, boolean>)[k];
                return (
                  <li key={k} className={`flex items-center gap-1.5 ${ok ? "text-brand" : "text-muted-foreground"}`}>
                    <Check className={`size-3 ${ok ? "opacity-100" : "opacity-30"}`} />
                    {label}
                  </li>
                );
              })}
            </ul>
          )}
        </Field>
        <Field label="Confirm password" error={confirm && !matchOk ? "Passwords do not match" : undefined}>
          <input
            type={show ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className="auth-input"
            placeholder="Re-enter password"
          />
        </Field>
        <button type="submit" disabled={!valid || submitting} className="w-full bg-brand text-brand-foreground py-2.5 rounded-md font-medium ring-1 ring-brand shadow-sm disabled:opacity-50 hover:opacity-95">
          {submitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <Divider />
      <div className="grid grid-cols-2 gap-3">
        <OAuthButton label="Google" />
        <OAuthButton label="GitHub" icon={<Github className="size-4" />} />
      </div>

      <p className="mt-6 text-sm text-center text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="text-brand font-medium hover:underline">Sign in</Link>
      </p>
    </AuthShell>
  );
}
