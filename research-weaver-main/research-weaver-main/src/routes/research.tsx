import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { PageShell } from "@/components/layout";
import { RequireAuth } from "@/components/require-auth";
import ReactMarkdown from "react-markdown";
import {
  getSession,
  deleteSession,
  type ResearchSession,
  getChatHistory,
  chatWithAssistant,
  type ChatMessage,
} from "@/lib/research-store";
import {
  ArrowLeft,
  Copy,
  Download,
  ExternalLink,
  Trash2,
  Share2,
  Loader2,
  Info,
  ChevronLeft,
  ChevronRight,
  Send,
  Bot,
  User,
} from "lucide-react";
import { toast } from "sonner";

export default function ResearchDetailPage() {
  return (
    <RequireAuth>
      <Detail />
    </RequireAuth>
  );
}

type Tab = "report" | "search" | "scraped" | "critique";

function Detail() {
  const { id } = useParams() as { id: string };
  const navigate = useNavigate();
  const [session, setSession] = useState<ResearchSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("report");

  useEffect(() => {
    setLoading(true);
    getSession(id).then((data) => {
      setSession(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <PageShell>
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <Loader2 className="size-6 animate-spin text-brand mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground font-mono">
            Loading research session...
          </p>
        </div>
      </PageShell>
    );
  }

  if (!session) {
    return (
      <PageShell>
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Not found
          </p>
          <h1 className="mt-2 text-2xl font-semibold">
            This research session doesn't exist.
          </h1>
          <Link
            to="/dashboard"
            className="mt-6 inline-block text-brand font-medium hover:underline"
          >
            ← Back to dashboard
          </Link>
        </div>
      </PageShell>
    );
  }

  const c = session.critique;

  const copyReport = () => {
    if (session.reportContent) {
      navigator.clipboard.writeText(session.reportContent);
      toast.success("Report copied to clipboard");
    }
  };

  const downloadMd = () => {
    if (!session.reportContent) return;
    const blob = new Blob([session.reportContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${session.topic.slice(0, 40).replace(/[^a-z0-9]+/gi, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    if (!confirm("Delete this research session? This cannot be undone."))
      return;
    try {
      await deleteSession(session.id);
      toast.success("Session deleted");
      navigate("/history");
    } catch {
      toast.error("Failed to delete session");
    }
  };

  return (
    <PageShell>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
          <button
            onClick={() => navigate("/history")}
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="size-4" /> Back to history
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadMd}
              className="text-sm bg-card text-foreground px-3 py-1.5 rounded-md ring-1 ring-black/5 hover:bg-accent inline-flex items-center gap-2"
            >
              <Download className="size-3.5" /> Markdown
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Link copied");
              }}
              className="text-sm bg-card text-foreground px-3 py-1.5 rounded-md ring-1 ring-black/5 hover:bg-accent inline-flex items-center gap-2"
            >
              <Share2 className="size-3.5" /> Share
            </button>
            <button
              onClick={handleDelete}
              className="text-sm bg-card text-destructive px-3 py-1.5 rounded-md ring-1 ring-black/5 hover:bg-destructive/5 inline-flex items-center gap-2"
            >
              <Trash2 className="size-3.5" /> Delete
            </button>
          </div>
        </div>

        <div className="mb-8">
          <p className="font-mono text-xs uppercase tracking-widest text-brand mb-2">
            {session.status === "completed"
              ? "Completed research"
              : `Status: ${session.status}`}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground text-balance">
            {session.topic}
          </h1>
          <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
            <span>{new Date(session.createdAt).toLocaleString()}</span>
            <span className="size-1 rounded-full bg-muted-foreground/30" />
            {session.overallScore != null && (
              <span className="bg-brand/10 text-brand text-xs font-semibold px-2 py-0.5 rounded">
                {session.overallScore.toFixed(1)} / 10
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            {/* Tabs */}
            <div className="flex gap-6 border-b border-border mb-8 overflow-x-auto">
              {(
                [
                  ["report", "Report"],
                  ["search", "Search results"],
                  ["critique", "Critic review"],
                ] as [Tab, string][]
              ).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  className={`pb-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === k
                    ? "border-brand text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === "report" && (
              <ReportTab s={session} onCopy={copyReport} onDownload={downloadMd} />
            )}
            {tab === "search" && <SearchTab s={session} />}
            {tab === "critique" && c && <CritiqueTab critique={c} />}
          </div>

          <div className="lg:col-span-4 space-y-6 sticky top-6 h-fit">
            {/* Chat Panel */}
            {session.status === "completed" && <ChatPanel sessionId={session.id} />}

            {/* Score sidebar */}
            {c && (
              <div className="bg-card p-6 rounded-2xl ring-1 ring-black/5 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-foreground">
                    Critic assessment
                  </h3>
                  <div className="bg-brand/10 text-brand text-xs font-bold px-2 py-1 rounded">
                    {c.overallScore.toFixed(1)} / 10
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    ["Clarity", c.categories.clarity],
                    ["Research depth", c.categories.depth],
                    ["Accuracy", c.categories.accuracy],
                    ["Analysis & insights", c.categories.analysis],
                    ["Structure", c.categories.structure],
                    ["Source quality", c.categories.sources],
                  ].map(([label, val]) => (
                    <ScoreBar
                      key={label as string}
                      label={label as string}
                      value={val as number}
                    />
                  ))}
                </div>
                <div className="mt-8 pt-6 border-t border-border">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                    Verdict
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed text-pretty">
                    {c.verdict}
                  </p>
                </div>
              </div>
            )}

            {/* Timeline */}
            {session.timings && (
              <div className="bg-brand-dark p-6 rounded-2xl shadow-sm">
                <h3 className="text-white font-medium mb-4">
                  Pipeline timeline
                </h3>
                <ol className="space-y-3 text-xs font-mono text-white/70">
                  <li>
                    <span className="text-white/40">SEARCH ·</span>{" "}
                    {session.timings.search
                      ? new Date(session.timings.search).toLocaleTimeString()
                      : "—"}
                  </li>
                  <li>
                    <span className="text-white/40">READ ·</span>{" "}
                    {session.timings.read
                      ? new Date(session.timings.read).toLocaleTimeString()
                      : "—"}
                  </li>
                  <li>
                    <span className="text-white/40">WRITE ·</span>{" "}
                    {session.timings.write
                      ? new Date(session.timings.write).toLocaleTimeString()
                      : "—"}
                  </li>
                  <li>
                    <span className="text-white/40">CRITIQUE ·</span>{" "}
                    {session.timings.critique
                      ? new Date(
                        session.timings.critique
                      ).toLocaleTimeString()
                      : "—"}
                  </li>
                </ol>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-1.5">
        <span className="text-muted-foreground font-medium uppercase tracking-wider">
          {label}
        </span>
        <span className="text-foreground font-mono">
          {value.toFixed(1)}/10
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-brand transition-all"
          style={{ width: `${value * 10}%` }}
        />
      </div>
    </div>
  );
}

function ReportTab({
  s,
  onCopy,
  onDownload,
}: {
  s: ResearchSession;
  onCopy: () => void;
  onDownload: () => void;
}) {
  const [currentPage, setCurrentPage] = useState(0);

  if (!s.reportContent) {
    return (
      <div className="bg-card p-10 rounded-2xl ring-1 ring-black/5 text-center text-muted-foreground text-sm">
        No report generated yet.
      </div>
    );
  }

  const cleanedReport = s.reportContent.replace(/<think>[\s\S]*?<\/think>\n*/g, "");
  
  // Split the markdown by H2 (##) or H1 (#) to create visual "pages"
  const pages = cleanedReport.split(/(?=\n##? )/).filter(p => p.trim());

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2 mb-2">
        <button
          onClick={onCopy}
          className="text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
        >
          <Copy className="size-3.5" /> Copy Full Report
        </button>
        <button
          onClick={onDownload}
          className="text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
        >
          <Download className="size-3.5" /> Export .md
        </button>
      </div>

      <div className="relative">
        <article className="bg-card p-10 md:p-14 rounded-2xl ring-1 ring-black/5 shadow-md relative overflow-hidden min-h-[400px]">
          {pages.length > 1 && (
            <div className="absolute bottom-6 right-8 text-[10px] font-mono text-muted-foreground/40 font-bold uppercase tracking-widest">
              Page {currentPage + 1} of {pages.length}
            </div>
          )}
          <div className="max-w-[65ch] mx-auto">
            <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
              <ReactMarkdown>{pages[currentPage]}</ReactMarkdown>
            </div>
          </div>
        </article>
      </div>

      {pages.length > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border bg-card text-foreground disabled:opacity-40 hover:bg-muted transition-colors cursor-pointer"
          >
            <ChevronLeft className="size-4" /> Previous
          </button>
          
          <div className="text-xs font-bold text-muted-foreground tracking-widest">
            {currentPage + 1} / {pages.length}
          </div>

          <button
            onClick={() => setCurrentPage(p => Math.min(pages.length - 1, p + 1))}
            disabled={currentPage === pages.length - 1}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border bg-card text-foreground disabled:opacity-40 hover:bg-muted transition-colors cursor-pointer"
          >
            Next <ChevronRight className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function SearchTab({ s }: { s: ResearchSession }) {
  if (!s.searchResults || s.searchResults.length === 0) {
    return (
      <div className="bg-card p-10 rounded-2xl ring-1 ring-black/5 text-center text-muted-foreground text-sm">
        No search results available.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {s.searchResults.map((r, i) => (
        <a
          key={r.id || i}
          href={r.url}
          target="_blank"
          rel="noreferrer"
          className="group flex flex-col bg-card p-6 rounded-2xl ring-1 ring-black/5 hover:ring-brand hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="bg-muted text-muted-foreground group-hover:bg-brand/10 group-hover:text-brand px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors">
              Source {i + 1}
            </div>
            <ExternalLink className="size-3.5 text-muted-foreground group-hover:text-brand transition-colors" />
          </div>
          <h4 className="font-semibold text-foreground group-hover:text-brand mb-2 line-clamp-2">
            {r.title}
          </h4>
          <div className="text-[11px] text-muted-foreground/70 font-mono break-all mb-3 truncate">
            {r.url}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mt-auto">
            {r.content_snippet}
          </p>
        </a>
      ))}
    </div>
  );
}

function CritiqueTab({ critique: c }: { critique: NonNullable<ResearchSession["critique"]> }) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section title="Strengths" items={c.strengths} color="success" icon="✨" />
        <Section title="Weaknesses" items={c.weaknesses} color="warning" icon="⚠️" />
      </div>
      <Section title="Missing Opportunities" items={c.missing} color="muted" icon="🔍" />

      <div className="bg-card p-8 rounded-2xl ring-1 ring-black/5 shadow-sm">
        <h4 className="text-sm font-bold text-foreground mb-6 flex items-center gap-2">
          <span className="bg-brand/10 text-brand p-1.5 rounded-lg">🚀</span> Specific Improvements
        </h4>
        <ol className="space-y-4">
          {c.improvements.map((it, i) => (
            <li key={i} className="flex gap-4 text-sm bg-muted/50 p-4 rounded-xl">
              <div className="font-mono text-brand font-bold text-lg mt-0.5 shrink-0">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="text-foreground/90 leading-relaxed text-pretty pt-1 prose prose-sm dark:prose-invert prose-p:my-0 max-w-none">
                <ReactMarkdown>{it}</ReactMarkdown>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="relative overflow-hidden bg-gradient-to-br from-brand/20 to-brand/5 border border-brand/20 p-8 rounded-2xl shadow-sm">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Info className="size-32" />
        </div>
        <h4 className="text-xs font-bold text-brand uppercase tracking-widest mb-4">
          Final Verdict
        </h4>
        <p className="relative text-base text-foreground font-medium leading-relaxed text-pretty z-10">
          <ReactMarkdown>{c.verdict}</ReactMarkdown>
        </p>
      </div>
    </div>
  );
}

function Section({
  title,
  items,
  color,
  icon,
}: {
  title: string;
  items: string[];
  color: "success" | "warning" | "muted";
  icon: string;
}) {
  const bgColors = {
    success: "bg-success/10 border-success/20",
    warning: "bg-warning/10 border-warning/20",
    muted: "bg-muted/30 border-border",
  };

  const textColors = {
    success: "text-success-foreground",
    warning: "text-warning-foreground",
    muted: "text-muted-foreground",
  };

  const dotColors = {
    success: "bg-success",
    warning: "bg-warning",
    muted: "bg-muted-foreground",
  };

  return (
    <div className={`p-6 rounded-2xl border ${bgColors[color]} shadow-sm`}>
      <h4 className={`text-sm font-bold flex items-center gap-2 mb-4 ${textColors[color]}`}>
        <span>{icon}</span> {title}
      </h4>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">None identified.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((it, i) => (
            <li
              key={i}
              className="flex items-start gap-3 text-sm text-foreground/80 leading-relaxed text-pretty bg-background/40 p-3 rounded-lg"
            >
              <span className={`size-1.5 rounded-full mt-2 shrink-0 ${dotColors[color]}`} />
              <div className="prose prose-sm dark:prose-invert prose-p:my-0 max-w-none text-foreground/80 leading-relaxed text-pretty">
                <ReactMarkdown>{it}</ReactMarkdown>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ChatPanel({ sessionId }: { sessionId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getChatHistory(sessionId).then(setMessages);
  }, [sessionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsLoading(true);

    let assistantContent = "";
    
    chatWithAssistant(
      sessionId,
      userMsg,
      (chunk) => {
        assistantContent += chunk;
        setMessages(prev => {
          const newMsgs = [...prev];
          // If the last message is from assistant and we are loading, we append to it
          const lastMsg = newMsgs[newMsgs.length - 1];
          if (lastMsg.role === "assistant" && lastMsg.id === "streaming") {
            lastMsg.content = assistantContent;
          } else {
            // First chunk: add new assistant message
            newMsgs.push({ id: "streaming", role: "assistant", content: assistantContent });
          }
          return newMsgs;
        });
      },
      (error) => {
        toast.error(error);
        setIsLoading(false);
      },
      () => {
        setMessages(prev => {
          const newMsgs = [...prev];
          const lastMsg = newMsgs[newMsgs.length - 1];
          if (lastMsg.role === "assistant" && lastMsg.id === "streaming") {
            delete lastMsg.id; // remove streaming flag
          }
          return newMsgs;
        });
        setIsLoading(false);
      }
    );
  };

  return (
    <div className="bg-card flex flex-col rounded-2xl ring-1 ring-black/5 shadow-sm overflow-hidden" style={{ height: "500px" }}>
      <div className="bg-brand text-brand-foreground px-4 py-3 flex items-center gap-2 shadow-sm z-10">
        <Bot className="size-4" />
        <h3 className="font-semibold text-sm">Research Assistant</h3>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-6">
            <Bot className="size-10 mb-3 opacity-20" />
            <p className="text-sm font-medium">Ask me anything about this research!</p>
            <p className="text-xs mt-1 opacity-70">I have full context of the report and sources.</p>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`shrink-0 size-8 rounded-full flex items-center justify-center ${m.role === 'user' ? 'bg-brand text-brand-foreground' : 'bg-muted text-muted-foreground'}`}>
                {m.role === 'user' ? <User className="size-4" /> : <Bot className="size-4" />}
              </div>
              <div className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} max-w-[80%]`}>
                <div className={`text-sm px-4 py-2.5 rounded-2xl ${m.role === 'user' ? 'bg-brand text-brand-foreground rounded-tr-sm' : 'bg-card ring-1 ring-black/5 text-foreground rounded-tl-sm'}`}>
                  {m.role === 'user' ? (
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-0 leading-relaxed text-pretty">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex gap-3">
            <div className="shrink-0 size-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
              <Bot className="size-4" />
            </div>
            <div className="bg-card ring-1 ring-black/5 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
              <span className="size-1.5 bg-brand/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="size-1.5 bg-brand/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="size-1.5 bg-brand/40 rounded-full animate-bounce"></span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-3 bg-card border-t border-border flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend(e);
            }
          }}
          placeholder="Ask a question..."
          className="flex-1 max-h-32 min-h-10 bg-muted/50 resize-none rounded-xl border-0 focus:ring-1 focus:ring-brand px-3 py-2.5 text-sm"
          rows={1}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="shrink-0 size-10 flex items-center justify-center rounded-xl bg-brand text-brand-foreground hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="size-4" />
        </button>
      </form>
    </div>
  );
}
