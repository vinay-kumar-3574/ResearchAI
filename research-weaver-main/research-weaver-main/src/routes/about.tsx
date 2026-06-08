import { Link } from "react-router-dom";
import { PageShell } from "@/components/layout";
import { ArrowLeft, BookOpen, Brain, ShieldCheck } from "lucide-react";

const stack = [
  { name: "Frontend", desc: "React 19 + TanStack Start. File-based routing, type-safe data loading, server-rendered." },
  { name: "AI / orchestration", desc: "LangChain coordinates four specialized agents in a sequential pipeline with structured intermediate state." },
  { name: "Language model", desc: "Groq's Qwen3-32B for fast, high-quality synthesis with strong reasoning on technical material." },
  { name: "Web search", desc: "Tavily API surfaces recent, relevant, and reliable web sources scoped to the research query." },
  { name: "Content extraction", desc: "BeautifulSoup intelligently scrapes and sanitizes target pages, removing scripts, nav, and chrome." },
];

export default function About() {
  return (
    <PageShell nav="public">
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6">
          <p className="font-mono text-xs uppercase tracking-widest text-brand mb-3">About</p>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground text-balance">A multi-agent pipeline for serious research.</h1>
          <div className="mt-10 space-y-6 text-muted-foreground text-pretty leading-relaxed">
            <p>
              ResearchAI was built to compress the research workflow that researchers, analysts, and content creators repeat every day: scouring search results, reading dozens of articles, extracting the substantive parts, drafting a coherent report, and reviewing it for quality.
            </p>
            <p>
              Instead of asking a single general-purpose model to do everything, ResearchAI chains four specialized agents — Search, Reader, Writer, and Critic — and passes the structured output of each one to the next. The result is a pipeline where each stage is responsible for what it does best, and the final output is reviewed by a critic with a calibrated rubric.
            </p>
            <p>
              The product is intentionally narrow: take a topic, return a structured, sourced, critically-reviewed report. Everything else — auth, history, exports — exists in service of that single workflow.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 border-t border-border bg-card/50">
        <div className="max-w-5xl mx-auto px-6">
          <p className="font-mono text-xs uppercase tracking-widest text-brand mb-3">Technology stack</p>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-10">Built on production-grade infrastructure.</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {stack.map((s) => (
              <div key={s.name} className="bg-card p-6 rounded-xl ring-1 ring-black/5">
                <h3 className="font-semibold text-foreground mb-2">{s.name}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed text-pretty">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 border-t border-border">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-brand mb-3">Open source</p>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">Built in the open.</h2>
          <p className="mt-4 text-muted-foreground text-pretty">
            ResearchAI is open source. Contributions, bug reports, and forks are welcome.
          </p>
          <a
            href="https://github.com/vinay-kumar-3574/ResearchAI"
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex bg-brand-dark text-white py-2.5 px-5 rounded-md font-medium hover:opacity-95"
          >
            View on GitHub →
          </a>
        </div>
      </section>
    </PageShell>
  );
}
