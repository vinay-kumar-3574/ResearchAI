import { Link, useNavigate, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { AuthShell, Field } from "./login";
import { supabase } from "@/lib/supabase";
import { Check, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);

  const checks = useMemo(() => ({
    len: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    num: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  }), [password]);
  const pwOk = Object.values(checks).every(Boolean);
  const matchOk = confirm.length > 0 && confirm === password;

  const expired = token === "expired";

  if (expired) {
    return (
      <AuthShell title="Link expired" subtitle="This reset link has expired or is invalid.">
        <Link to="/forgot-password" className="text-brand font-medium hover:underline text-sm">
          Request a new reset link
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Set a new password" subtitle="Choose a strong password to secure your account.">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!pwOk || !matchOk) return;
          try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            toast.success("Password reset successfully. You are now logged in.");
            navigate("/dashboard");
          } catch (err: any) {
            toast.error(err.message || "Failed to reset password");
          }
        }}
        className="space-y-4"
      >
        <Field label="New password">
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input pr-10"
            />
            <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {password && (
            <ul className="mt-3 grid grid-cols-2 gap-1 text-[11px]">
              {[["len","8+ characters"],["upper","Uppercase"],["lower","Lowercase"],["num","Number"],["special","Special character"]].map(([k,label]) => {
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
        <Field label="Confirm new password" error={confirm && !matchOk ? "Passwords do not match" : undefined}>
          <input type={show ? "text" : "password"} required value={confirm} onChange={(e) => setConfirm(e.target.value)} className="auth-input" />
        </Field>
        <button type="submit" disabled={!pwOk || !matchOk} className="w-full bg-brand text-brand-foreground py-2.5 rounded-md font-medium ring-1 ring-brand shadow-sm disabled:opacity-50 hover:opacity-95">
          Reset password
        </button>
      </form>
    </AuthShell>
  );
}
