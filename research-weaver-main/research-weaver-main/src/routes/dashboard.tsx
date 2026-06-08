import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState, useCallback } from "react";
import { PageShell } from "@/components/layout";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/lib/auth";
import {
  loadSessions,
  startResearch,
  getDashboardStats,
  type ResearchSession,
  type StageUpdate,
  type DashboardStats,
} from "@/lib/research-store";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Loader2,
  Search,
  ScanLine,
  Sparkles,
  AlertCircle,
} from "lucide-react";

export default function DashboardPage() {
  return (
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
  );
}

type StageKey = "search" | "read" | "write" | "critique";
type StageState = "idle" | "running" | "done" | "error";

const STAGE_META: {
  key: StageKey;
  label: string;
  icon: any;
  running: string;
}[] = [
  {
    key: "search",
    label: "Search",
    icon: Search,
    running: "Querying Tavily index...",
  },
  {
    key: "read",
    label: "Read",
    icon: ScanLine,
    running: "Extracting & sanitizing content...",
  },
  {
    key: "write",
    label: "Write",
    icon: FileText,
    running: "Synthesizing structured report...",
  },
  {
    key: "critique",
    label: "Critique",
    icon: CheckCircle2,
    running: "Evaluating against 6-dim rubric...",
  },
];

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [topic, setTopic] = useState("");
  const [depth, setDepth] = useState<"quick" | "deep">("deep");
  const [sessions, setSessions] = useState<ResearchSession[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [running, setRunning] = useState(false);
  const [stages, setStages] = useState<Record<StageKey, StageState>>({
    search: "idle",
    read: "idle",
    write: "idle",
    critique: "idle",
  });
  const [stageDoneMessages, setStageDoneMessages] = useState<
    Record<StageKey, string>
  >({
    search: "",
    read: "",
    write: "",
    critique: "",
  });
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(
    null
  );
  const [pipelineError, setPipelineError] = useState<string | null>(null);

  // Load sessions and stats from Supabase
  const refreshData = useCallback(async () => {
    if (!user) return;
    const [sessionsData, statsData] = await Promise.all([
      loadSessions(user.id),
      getDashboardStats(user.id),
    ]);
    setSessions(sessionsData);
    setStats(statsData);
  }, [user]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleStartResearch = () => {
    if (!topic.trim() || running || !user) return;
    setRunning(true);
    setCompletedSessionId(null);
    setPipelineError(null);
    setStages({ search: "idle", read: "idle", write: "idle", critique: "idle" });
    setStageDoneMessages({ search: "", read: "", write: "", critique: "" });

    startResearch(
      topic,
      depth,
      user.id,
      // onUpdate
      (update: StageUpdate) => {
        const stageMap: Record<string, StageKey> = {
          search: "search",
          read: "read",
          write: "write",
          critique: "critique",
        };
        const stageKey = stageMap[update.stage];

        if (stageKey && update.status === "running") {
          setStages((p) => ({ ...p, [stageKey]: "running" }));
        }
        if (stageKey && update.status === "done") {
          setStages((p) => ({ ...p, [stageKey]: "done" }));

          // Build done message from update data
          let msg = "Completed";
          if (update.stage === "search" && update.result_count) {
            msg = `${update.result_count} sources identified`;
          } else if (update.stage === "read" && update.chars) {
            msg = `Scraped ${update.chars.toLocaleString()} chars`;
          } else if (update.stage === "write") {
            msg = "Report generated";
          } else if (update.stage === "critique" && update.overall_score) {
            msg = `Overall score: ${update.overall_score}/10`;
          }
          setStageDoneMessages((p) => ({ ...p, [stageKey]: msg }));
        }
      },
      // onError
      (error: string) => {
        setPipelineError(error);
        setRunning(false);
      },
      // onComplete
      (sessionId: string) => {
        setCompletedSessionId(sessionId);
        setRunning(false);
        refreshData(); // Reload sessions list
      }
    );
  };

  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <PageShell>
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* Welcome */}
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-brand mb-2">
            New session
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Welcome back, {firstName}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Enter a topic below and let our AI agents research, write, and
            review a report for you.
          </p>
        </div>

        {/* Input + Pipeline card */}
        <div className="bg-card rounded-2xl ring-1 ring-black/5 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-border">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-foreground">
                Active session
              </h2>
              <p className="text-sm text-muted-foreground">
                {running
                  ? `Researching: ${topic}`
                  : "No active research yet"}
              </p>
            </div>
            <div className="mt-6 flex flex-col md:flex-row gap-3 items-end">
              <div className="flex-1 w-full">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Research query
                </label>
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={running}
                  onKeyDown={(e) => e.key === "Enter" && handleStartResearch()}
                  className="auth-input"
                  placeholder="e.g., Latest advancements in quantum error correction 2025"
                />
              </div>
            </div>
            
            <div className="mt-4 flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Research Depth
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDepth("quick")}
                    disabled={running}
                    className={`flex-1 py-3 px-4 rounded-xl border text-left transition-all ${
                      depth === "quick" 
                        ? "bg-brand/10 border-brand/50 ring-1 ring-brand shadow-sm text-brand" 
                        : "bg-card border-border text-muted-foreground hover:border-brand/30"
                    } disabled:opacity-50`}
                  >
                    <div className="font-semibold text-sm">⚡ Quick Overview</div>
                    <div className="text-xs opacity-80 mt-1">Fast summary, no deep reading (~15s)</div>
                  </button>
                  <button
                    onClick={() => setDepth("deep")}
                    disabled={running}
                    className={`flex-1 py-3 px-4 rounded-xl border text-left transition-all ${
                      depth === "deep" 
                        ? "bg-brand/10 border-brand/50 ring-1 ring-brand shadow-sm text-brand" 
                        : "bg-card border-border text-muted-foreground hover:border-brand/30"
                    } disabled:opacity-50`}
                  >
                    <div className="font-semibold text-sm">🔬 Deep Dive</div>
                    <div className="text-xs opacity-80 mt-1">Comprehensive 3-page report (~60s)</div>
                  </button>
                </div>
              </div>
              <button
                onClick={handleStartResearch}
                disabled={!topic.trim() || running}
                className="bg-brand text-brand-foreground h-[68px] text-sm font-medium px-8 rounded-xl ring-1 ring-brand shadow-sm hover:opacity-95 disabled:opacity-50 inline-flex items-center gap-2"
              >
                {running ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                  </>
                ) : (
                  <>
                    <Sparkles className="size-5" /> Start
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Pipeline tracking */}
          <div className="p-8 bg-muted/40">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {STAGE_META.map((s) => {
                const state = stages[s.key];
                const isRunning = state === "running";
                const isDone = state === "done";
                const doneMsg = stageDoneMessages[s.key];
                return (
                  <div
                    key={s.key}
                    className={`p-4 rounded-lg ring-1 transition-all ${
                      isRunning
                        ? "bg-card ring-brand/30 shadow-sm"
                        : isDone
                          ? "bg-card ring-black/5 shadow-sm"
                          : "bg-card/40 ring-black/5"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-tighter font-mono ${isRunning || isDone ? "text-brand" : "text-muted-foreground"}`}
                      >
                        {s.label}
                      </span>
                      {isRunning ? (
                        <Loader2 className="size-3 animate-spin text-brand" />
                      ) : isDone ? (
                        <CheckCircle2 className="size-3 text-brand" />
                      ) : (
                        <div className="size-1.5 rounded-full bg-muted-foreground/30" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-brand transition-all duration-700 ${
                            isDone
                              ? "w-full"
                              : isRunning
                                ? "w-2/3 shimmer"
                                : "w-0"
                          }`}
                        />
                      </div>
                      <p className="text-[11px] font-mono text-muted-foreground truncate">
                        {isDone
                          ? doneMsg || "Completed"
                          : isRunning
                            ? s.running
                            : "Idle"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pipeline error */}
            {pipelineError && (
              <div className="mt-6 flex items-center gap-3 p-4 rounded-lg bg-destructive/10 text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                <div className="text-sm">{pipelineError}</div>
              </div>
            )}

            {/* Pipeline complete */}
            {completedSessionId && stages.critique === "done" && (
              <div className="mt-6 flex items-center justify-between p-4 rounded-lg bg-brand text-brand-foreground">
                <div>
                  <div className="text-sm font-semibold">
                    Research complete
                  </div>
                  <div className="text-xs opacity-80">
                    Open the full report and critic review.
                  </div>
                </div>
                <button
                  onClick={() =>
                    navigate(`/research/${completedSessionId}`)
                  }
                  className="bg-white text-brand text-sm font-medium px-4 py-2 rounded-md inline-flex items-center gap-2"
                >
                  View results <ArrowRight className="size-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total researches"
            value={String(stats?.total_researches ?? 0)}
          />
          <StatCard
            label="Avg. score"
            value={stats?.average_score ? stats.average_score.toFixed(1) : "—"}
            hint="/ 10"
          />
          <StatCard
            label="This month"
            value={String(stats?.this_month_count ?? 0)}
          />
          <StatCard
            label="Last research"
            value={
              stats?.last_research_date
                ? new Date(stats.last_research_date).toLocaleDateString()
                : "—"
            }
          />
        </div>

        {/* Recent research */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">
              Recent research
            </h2>
            <Link
              to="/history"
              className="text-sm text-brand hover:underline"
            >
              View all history →
            </Link>
          </div>
          {sessions.length === 0 ? (
            <div className="bg-card p-10 rounded-2xl ring-1 ring-black/5 text-center text-muted-foreground text-sm">
              No research sessions yet. Start one above.
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.slice(0, 5).map((s) => (
                <SessionRow key={s.id} session={s} />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="bg-card p-5 rounded-xl ring-1 ring-black/5">
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-foreground">
        {value}
        {hint && (
          <span className="text-sm text-muted-foreground ml-1">{hint}</span>
        )}
      </div>
    </div>
  );
}

export function SessionRow({ session }: { session: ResearchSession }) {
  const score = session.overallScore;
  return (
    <Link
      to={`/research/${session.id}`}
      className="group flex items-center justify-between bg-card p-5 rounded-xl ring-1 ring-black/5 hover:ring-brand/30 hover:shadow-sm transition-all"
    >
      <div className="flex items-center gap-5 min-w-0">
        <div className="flex flex-col items-center justify-center rounded-lg bg-muted/60 px-3 py-2 min-w-14">
          <span className="text-lg font-semibold text-foreground">
            {score != null ? score.toFixed(1) : "—"}
          </span>
          <span className="text-[9px] font-mono uppercase text-muted-foreground">
            score
          </span>
        </div>
        <div className="min-w-0">
          <h4 className="font-semibold text-foreground group-hover:text-brand transition-colors truncate">
            {session.topic}
          </h4>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{new Date(session.createdAt).toLocaleString()}</span>
            <span className="size-1 rounded-full bg-muted-foreground/30" />
            <span className="capitalize">{session.status}</span>
          </div>
          {session.reportPreview && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-1">
              {session.reportPreview}
            </p>
          )}
        </div>
      </div>
      <ArrowRight className="size-4 text-muted-foreground group-hover:text-brand shrink-0 ml-4" />
    </Link>
  );
}
