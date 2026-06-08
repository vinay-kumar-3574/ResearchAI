import { Link } from "react-router-dom";
import { PageShell } from "@/components/layout";
import { useAuth } from "@/lib/auth";
import { ArrowRight, Brain, CheckCircle2, FileText, Search, ScanLine, Sparkles, ShieldCheck, History as HistoryIcon, Link2 } from "lucide-react";

const stages = [
  { icon: Search, name: "Search Agent", desc: "Autonomous web traversal via Tavily to extract primary sources and datasets." },
  { icon: ScanLine, name: "Reader Agent", desc: "Deep content extraction and sanitization of unstructured technical documentation." },
  { icon: FileText, name: "Writer Agent", desc: "Structured report generation using Qwen3-32B with verifiable citation mapping." },
  { icon: CheckCircle2, name: "Critic Agent", desc: "Multidimensional quality assessment and logical validation of final outputs." },
];

const features = [
  { icon: Brain, title: "Multi-agent intelligence", body: "Four specialized agents — each fine-tuned for one stage — outperform single-model approaches across depth, accuracy, and coherence." },
  { icon: Sparkles, title: "Real-time pipeline tracking", body: "Watch each stage execute live, with intermediate outputs surfaced as the search, scrape, write, and critique steps complete." },
  { icon: FileText, title: "Structured report generation", body: "Every report follows a professional academic structure: introduction, three or more substantiated findings, conclusion, sources." },
  { icon: ShieldCheck, title: "Rigorous AI critique", body: "Calibrated scoring rubric across six dimensions — no inflated scores, no participation trophies." },
  { icon: Link2, title: "Source transparency", body: "Every claim traces back to its source URL. Independent verification is one click away." },
  { icon: HistoryIcon, title: "Research history", body: "Past sessions are saved, searchable, and ready to revisit, compare, or build upon." },
];

const useCases = [
  { title: "Academic research", body: "Quickly survey a topic, gather credible sources, and generate a first-draft literature review that's been pre-critiqued before your advisor sees it." },
  { title: "Content creation", body: "Research trending topics, extract data points across multiple sources, and produce well-structured articles backed by traceable references." },
  { title: "Business intelligence", body: "Brief yourself on competitors, market shifts, or emerging tech with a concise, critically reviewed report in minutes — not days." },
  { title: "Learning & exploration", body: "Explore any topic and receive both a comprehensive summary and an honest quality assessment of how reliable the synthesis is." },
];

export default function Landing() {
  const { user } = useAuth();
  return (
    <PageShell nav="public">
      {/* Hero */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-brand bg-brand/10 px-3 py-1 rounded-full">
              <span className="size-1.5 rounded-full bg-brand animate-pulse" />
              Multi-agent research pipeline
            </div>
            <h1 className="mt-6 text-5xl md:text-6xl font-semibold text-foreground tracking-tight text-balance max-w-[20ch] leading-[1.05]">
              Automated synthesis for technical research
            </h1>
            <p className="mt-8 text-muted-foreground text-lg text-pretty max-w-[52ch]">
              Chain four specialized AI agents to discover, analyze, and critique complex topics with academic rigor and verifiable sources.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                to={user ? "/dashboard" : "/signup"}
                className="inline-flex items-center gap-2 bg-brand text-brand-foreground py-2.5 px-5 rounded-md ring-1 ring-brand shadow-sm font-medium hover:opacity-95"
              >
                Start researching <ArrowRight className="size-4" />
              </Link>
              <a
                href="#how-it-works"
                className="bg-card text-foreground py-2.5 px-5 rounded-md ring-1 ring-black/5 shadow-sm font-medium hover:bg-accent"
              >
                See how it works
              </a>
            </div>
          </div>

          {/* Pipeline visualization */}
          <div className="mt-24 relative">
            <div className="absolute top-1/2 left-0 w-full h-px pipeline-line opacity-30 -z-10 hidden md:block" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {stages.map((s, i) => (
                <div key={s.name} className="bg-card p-6 rounded-xl ring-1 ring-black/5 shadow-sm">
                  <div className={`size-9 rounded-lg flex items-center justify-center mb-4 ${i === 0 ? "bg-brand/10 text-brand" : "bg-accent text-muted-foreground"}`}>
                    <s.icon className="size-4" />
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Stage 0{i + 1}</div>
                  <h3 className="font-semibold text-foreground mb-2">{s.name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed text-pretty">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-widest text-brand mb-3">How it works</p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">From a research topic to a critically reviewed report — in four ordered stages.</h2>
          </div>
          <div className="mt-16 space-y-10">
            {stages.map((s, i) => (
              <div key={s.name} className="grid md:grid-cols-12 gap-6 items-start">
                <div className="md:col-span-3 flex items-center gap-3">
                  <div className="font-mono text-3xl text-brand">0{i + 1}</div>
                  <div className="size-10 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
                    <s.icon className="size-5" />
                  </div>
                </div>
                <div className="md:col-span-9">
                  <h3 className="text-xl font-semibold text-foreground">{s.name}</h3>
                  <p className="mt-2 text-muted-foreground text-pretty leading-relaxed max-w-[72ch]">
                    {i === 0 && "The Search Agent queries Tavily, returning the five most relevant and recent sources for the topic — each with title, URL, and a content preview."}
                    {i === 1 && "The Reader Agent picks the most promising source, navigates to that page, and extracts the full text — stripping scripts, navigation, and footers to keep only the substance."}
                    {i === 2 && "The Writer Agent synthesizes search snippets and scraped content into a structured report: introduction, at least three substantiated findings, conclusion, and a complete source list."}
                    {i === 3 && "The Critic Agent reviews the report across six dimensions, scores each, identifies strengths, weaknesses, and missing opportunities, then issues a final verdict."}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 border-t border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mb-12">
            <p className="font-mono text-xs uppercase tracking-widest text-brand mb-3">Capabilities</p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">Engineered for depth, not just speed.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-card p-6 rounded-xl ring-1 ring-black/5 shadow-sm">
                <div className="size-9 rounded-lg bg-brand/10 text-brand flex items-center justify-center mb-4">
                  <f.icon className="size-4" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed text-pretty">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mb-12">
            <p className="font-mono text-xs uppercase tracking-widest text-brand mb-3">Use cases</p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">Built for anyone who synthesizes information for a living.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {useCases.map((u) => (
              <div key={u.title} className="bg-card p-8 rounded-xl ring-1 ring-black/5 shadow-sm">
                <h3 className="text-lg font-semibold text-foreground mb-2">{u.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-pretty">{u.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-20 border-t border-border bg-brand-dark text-white">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-10 text-center">
          <div>
            <div className="text-4xl font-semibold tracking-tight">Qwen3-32B</div>
            <div className="mt-2 text-sm text-white/60 font-mono uppercase tracking-widest">Powered by Groq</div>
          </div>
          <div>
            <div className="text-4xl font-semibold tracking-tight">5+ sources</div>
            <div className="mt-2 text-sm text-white/60 font-mono uppercase tracking-widest">Per research query</div>
          </div>
          <div>
            <div className="text-4xl font-semibold tracking-tight">6 dimensions</div>
            <div className="mt-2 text-sm text-white/60 font-mono uppercase tracking-widest">Of critical review</div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">Start your first research session.</h2>
          <p className="mt-4 text-muted-foreground">No setup. Enter a topic, watch the agents work.</p>
          <Link
            to={user ? "/dashboard" : "/signup"}
            className="mt-8 inline-flex items-center gap-2 bg-brand text-brand-foreground py-2.5 px-5 rounded-md ring-1 ring-brand shadow-sm font-medium hover:opacity-95"
          >
            {user ? "Open dashboard" : "Create free account"} <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
