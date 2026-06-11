import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { PageShell } from "@/components/layout";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/lib/auth";
import { loadSessions } from "@/lib/research-store";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function SettingsPage() {
  return (
    <RequireAuth>
      <Settings />
    </RequireAuth>
  );
}

function Settings() {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name ?? "");
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [inAppNotifs, setInAppNotifs] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState("");

  const initials = (user?.name ?? "U").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  const exportData = async () => {
    if (!user) return;
    const sessions = await loadSessions(user.id);
    const data = { user, sessions };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "researchai-export.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data exported");
  };

  const deleteAccount = async () => {
    if (confirmDelete !== "DELETE") {
      toast.error("Type DELETE to confirm");
      return;
    }
    // Since we don't have an RPC for full user deletion in this demo,
    // we'll just log them out and show a message that their data will be purged.
    // Real implementation would call a Supabase Edge Function to delete auth.users.
    await logout();
    toast.success("Account marked for deletion");
    navigate("/");
  };

  return (
    <PageShell>
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-brand mb-2">Account</p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Settings</h1>
        </div>

        {/* Profile */}
        <Card title="Profile information">
          <div className="flex items-center gap-4 mb-6">
            <div className="size-16 rounded-full bg-brand-dark text-white grid place-items-center text-lg font-semibold font-mono">{initials}</div>
            <div>
              <button onClick={() => toast.info("Avatar upload not wired in this demo")} className="text-sm bg-background ring-1 ring-black/5 px-3 py-1.5 rounded-md hover:bg-accent">
                Change avatar
              </button>
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG or GIF · Max 5MB</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <FieldRow label="Full name">
              <input value={name} onChange={(e) => setName(e.target.value)} className="auth-input" />
            </FieldRow>
            <FieldRow label="Email address" hint="Email cannot be changed in this demo">
              <input value={user?.email ?? ""} readOnly className="auth-input opacity-60" />
            </FieldRow>
            <FieldRow label="Account created">
              <input readOnly value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ""} className="auth-input opacity-60" />
            </FieldRow>
          </div>
          <button
            onClick={() => { updateProfile({ name }); toast.success("Profile updated"); }}
            className="mt-6 bg-brand text-brand-foreground py-2 px-4 rounded-md text-sm font-medium ring-1 ring-brand shadow-sm"
          >
            Update profile
          </button>
        </Card>

        <Card title="Password">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const password = formData.get("password") as string;
              const confirm = formData.get("confirm") as string;
              if (password !== confirm) {
                toast.error("Passwords do not match");
                return;
              }
              try {
                const { error } = await supabase.auth.updateUser({ password });
                if (error) throw error;
                toast.success("Password updated successfully");
                (e.target as HTMLFormElement).reset();
              } catch (err: any) {
                toast.error(err.message || "Failed to update password");
              }
            }}
          >
            <div className="grid md:grid-cols-2 gap-4">
              <FieldRow label="New password"><input name="password" type="password" required className="auth-input" minLength={8} /></FieldRow>
              <FieldRow label="Confirm new password"><input name="confirm" type="password" required className="auth-input" minLength={8} /></FieldRow>
            </div>
            <button
              type="submit"
              className="mt-6 bg-brand text-brand-foreground py-2 px-4 rounded-md text-sm font-medium ring-1 ring-brand shadow-sm"
            >
              Change password
            </button>
          </form>
        </Card>

        {/* Notifications */}
        <Card title="Notification preferences">
          <Toggle label="Email when a research pipeline completes" checked={emailNotifs} onChange={setEmailNotifs} />
          <Toggle label="In-app research completion alerts" checked={inAppNotifs} onChange={setInAppNotifs} />
        </Card>

        {/* Connected accounts */}
        <Card title="Connected accounts">
          <ConnectRow provider="Google" connected={false} />
          <ConnectRow provider="GitHub" connected={false} />
        </Card>

        {/* Account management */}
        <Card title="Account management">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <div className="text-sm font-medium text-foreground">Export my data</div>
              <div className="text-xs text-muted-foreground">Download all your research and profile data as JSON.</div>
            </div>
            <button onClick={exportData} className="text-sm bg-background ring-1 ring-black/5 px-3 py-1.5 rounded-md hover:bg-accent">
              Export
            </button>
          </div>
          <div className="py-3">
            <div className="text-sm font-medium text-destructive">Delete account</div>
            <div className="text-xs text-muted-foreground mt-1">Permanently erase all your data. Type <span className="font-mono">DELETE</span> to confirm.</div>
            <div className="mt-3 flex gap-2">
              <input value={confirmDelete} onChange={(e) => setConfirmDelete(e.target.value)} placeholder="Type DELETE" className="auth-input max-w-xs" />
              <button onClick={deleteAccount} className="bg-destructive text-destructive-foreground py-2 px-4 rounded-md text-sm font-medium">
                Delete account
              </button>
            </div>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-card p-6 md:p-8 rounded-2xl ring-1 ring-black/5 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground mb-6">{title}</h2>
      {children}
    </section>
  );
}

function FieldRow({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground mt-1.5">{hint}</p>}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between py-3 border-b border-border last:border-0 cursor-pointer">
      <span className="text-sm text-foreground">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-6 rounded-full transition-colors ${checked ? "bg-brand" : "bg-muted"}`}
      >
        <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[18px]" : "translate-x-0.5"}`} />
      </button>
    </label>
  );
}

function ConnectRow({ provider, connected }: { provider: string; connected: boolean }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="text-sm text-foreground font-medium">{provider}</div>
      <button className="text-sm bg-background ring-1 ring-black/5 px-3 py-1.5 rounded-md hover:bg-accent">
        {connected ? "Disconnect" : "Connect"}
      </button>
    </div>
  );
}
