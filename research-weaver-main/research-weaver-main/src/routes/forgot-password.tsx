import { Link } from "react-router-dom";
import { useState } from "react";
import { AuthShell, Field } from "./login";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <AuthShell title="Check your inbox" subtitle="We've sent reset instructions if an account exists.">
        <p className="text-sm text-muted-foreground">
          If an account exists with <span className="font-mono text-foreground">{email}</span>, you will receive a password reset link shortly.
        </p>
        <Link to="/login" className="mt-6 inline-block text-sm text-brand font-medium hover:underline">
          ← Back to sign in
        </Link>
      </AuthShell>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password/update`,
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset link");
    }
  };

  return (
    <AuthShell title="Reset password" subtitle="Enter your email and we'll send you a reset link.">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Email address">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="auth-input" placeholder="you@university.edu" />
        </Field>
        <button type="submit" className="w-full bg-brand text-brand-foreground py-2.5 rounded-md font-medium ring-1 ring-brand shadow-sm hover:opacity-95">
          Send reset link
        </button>
      </form>
      <Link to="/login" className="mt-6 inline-block text-sm text-brand font-medium hover:underline">
        ← Back to sign in
      </Link>
    </AuthShell>
  );
}
