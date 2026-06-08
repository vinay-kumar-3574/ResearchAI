import { Link } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/layout";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/lib/auth";
import {
  loadSessions,
  deleteSession,
  type ResearchSession,
} from "@/lib/research-store";
import { SessionRow } from "./dashboard";
import { Trash2, Search } from "lucide-react";
import { toast } from "sonner";

export default function HistoryPage() {
  return (
    <RequireAuth>
      <History />
    </RequireAuth>
  );
}

function History() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ResearchSession[]>([]);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<
    "date-desc" | "date-asc" | "score-desc" | "score-asc"
  >("date-desc");
  const [minScore, setMinScore] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refreshData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const data = await loadSessions(user.id);
    setSessions(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const filtered = useMemo(() => {
    let r = sessions.filter(
      (s) =>
        s.topic.toLowerCase().includes(q.toLowerCase()) &&
        (s.overallScore ?? 0) >= minScore
    );
    r = [...r].sort((a, b) => {
      switch (sort) {
        case "date-asc":
          return (
            +new Date(a.createdAt) - +new Date(b.createdAt)
          );
        case "date-desc":
          return (
            +new Date(b.createdAt) - +new Date(a.createdAt)
          );
        case "score-asc":
          return (a.overallScore ?? 0) - (b.overallScore ?? 0);
        case "score-desc":
          return (b.overallScore ?? 0) - (a.overallScore ?? 0);
      }
    });
    return r;
  }, [sessions, q, sort, minScore]);

  const toggle = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const deleteSelected = async () => {
    if (
      !confirm(`Delete ${selected.size} session(s)? This cannot be undone.`)
    )
      return;
    try {
      for (const id of selected) {
        await deleteSession(id);
      }
      setSelected(new Set());
      await refreshData();
      toast.success("Selected sessions deleted");
    } catch {
      toast.error("Failed to delete some sessions");
    }
  };

  return (
    <PageShell>
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-brand mb-2">
              Research library
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              History
            </h1>
            <p className="mt-2 text-muted-foreground">
              All your past research sessions, searchable and filterable.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card p-4 rounded-xl ring-1 ring-black/5 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <div className="relative flex-1">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by topic..."
              className="auth-input pl-9"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-muted-foreground font-mono uppercase tracking-widest">
              Min score
            </label>
            <input
              type="range"
              min={0}
              max={10}
              step={0.5}
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="accent-brand"
            />
            <span className="text-sm font-mono w-8 text-right">
              {minScore}
            </span>
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="auth-input md:w-48"
          >
            <option value="date-desc">Newest first</option>
            <option value="date-asc">Oldest first</option>
            <option value="score-desc">Highest score</option>
            <option value="score-asc">Lowest score</option>
          </select>
        </div>

        {/* Bulk actions */}
        {selected.size > 0 && (
          <div className="flex items-center justify-between bg-brand text-brand-foreground rounded-lg px-4 py-3">
            <div className="text-sm">{selected.size} selected</div>
            <button
              onClick={deleteSelected}
              className="flex items-center gap-2 text-sm bg-white text-brand px-3 py-1.5 rounded-md font-medium"
            >
              <Trash2 className="size-3.5" /> Delete selected
            </button>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="bg-card p-16 rounded-2xl ring-1 ring-black/5 text-center">
            <p className="text-muted-foreground font-mono text-sm">
              Loading sessions...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card p-16 rounded-2xl ring-1 ring-black/5 text-center">
            <p className="text-muted-foreground">
              No research sessions match your filters.
            </p>
            <Link
              to="/dashboard"
              className="mt-4 inline-block text-brand font-medium hover:underline"
            >
              Start your first research →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((s) => (
              <div key={s.id} className="relative">
                <input
                  type="checkbox"
                  checked={selected.has(s.id)}
                  onChange={() => toggle(s.id)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 accent-brand"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="pl-9">
                  <SessionRow session={s} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
