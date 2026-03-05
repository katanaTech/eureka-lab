import { Button } from '@/components/ui/button';

/**
 * Landing page for Eureka Lab.
 * Public page — no auth required. Links users to sign up or log in.
 */
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* ── Nav bar ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-background px-4 md:px-6">
        <span className="text-xl font-bold tracking-tight text-foreground">
          Eureka Lab
        </span>
        <div className="flex items-center gap-2">
          <a href="/login">
            <Button variant="ghost" size="sm">Log In</Button>
          </a>
          <a href="/signup">
            <Button variant="default" size="sm">Sign Up</Button>
          </a>
        </div>
      </header>

      {/* ── Hero section ─────────────────────────────────────── */}
      <section className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-20 text-center">
        <div className="space-y-4">
          <h1 className="text-5xl font-extrabold tracking-tight text-foreground md:text-6xl">
            Learn to <span className="text-primary">Build</span> with AI
          </h1>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground">
            Eureka Lab teaches kids aged 8–16 to be AI builders, not just consumers.
            Master prompts, automate workflows, create apps, and design AI agents.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <a href="/signup">
            <Button size="lg" className="px-8 text-base">
              Get Started Free
            </Button>
          </a>
          <a href="#levels">
            <Button variant="outline" size="lg" className="px-8 text-base">
              See the Levels
            </Button>
          </a>
        </div>
      </section>

      {/* ── 4 Levels overview ────────────────────────────────── */}
      <section id="levels" className="border-t border-border bg-muted/30 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-foreground">
            4 Levels of AI Mastery
          </h2>
          <p className="mt-2 text-center text-muted-foreground">
            A step-by-step journey from writing your first prompt to creating your own AI agent.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <LevelCard
              level={1}
              title="AI Conversation"
              description="Learn prompt engineering — write clear, specific prompts and evaluate AI output."
              output="Prompt Portfolio"
              color="bg-blue-500"
              available
            />
            <LevelCard
              level={2}
              title="Workflow Automation"
              description="Build AI-powered personal workflows for homework, study plans, and summaries."
              output="Working Workflow"
              color="bg-emerald-500"
            />
            <LevelCard
              level={3}
              title="Vibe Coding"
              description="Create mini-apps and games with AI as your coding co-pilot."
              output="Deployed Mini-App"
              color="bg-violet-500"
            />
            <LevelCard
              level={4}
              title="Buddy Agents"
              description="Design your own AI agent with a persona, memory, tools, and goals."
              output="Shareable AI Agent"
              color="bg-amber-500"
            />
          </div>
        </div>
      </section>

      {/* ── CTA section ──────────────────────────────────────── */}
      <section className="px-6 py-20 text-center">
        <h2 className="text-3xl font-bold text-foreground">
          Ready to start building?
        </h2>
        <p className="mt-2 text-muted-foreground">
          Level 1 is free. No credit card required.
        </p>
        <a href="/signup">
          <Button size="lg" className="mt-6 px-10 text-base">
            Create Free Account
          </Button>
        </a>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-border bg-muted/20 px-6 py-8 text-center text-sm text-muted-foreground">
        <p>Eureka Lab — AI Literacy Platform for Kids</p>
        <p className="mt-1">Built for learners aged 8–16. Safe, moderated, and fun.</p>
      </footer>
    </main>
  );
}

/* ── Level Card ──────────────────────────────────────────────── */

interface LevelCardProps {
  /** Level number (1–4) */
  level: number;
  /** Level title */
  title: string;
  /** Level description */
  description: string;
  /** What the child produces */
  output: string;
  /** Accent color class */
  color: string;
  /** Whether this level is currently available */
  available?: boolean;
}

/**
 * Card displaying one of the 4 learning levels.
 *
 * @param level - Level number
 * @param title - Level title
 * @param description - What the child learns
 * @param output - What the child produces
 * @param color - Accent color
 * @param available - Whether the level is live
 */
function LevelCard({ level, title, description, output, color, available }: LevelCardProps) {
  return (
    <div className="flex flex-col rounded-lg border border-border bg-background p-5 transition-shadow hover:shadow-md">
      <div className="flex items-center gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white ${color}`}>
          {level}
        </span>
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>
      <p className="mt-3 flex-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-4 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Output: {output}</span>
        {available ? (
          <span className="rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
            Available
          </span>
        ) : (
          <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground">
            Coming Soon
          </span>
        )}
      </div>
    </div>
  );
}
