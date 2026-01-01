"use client";

import { useEffect, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import BillingPanel from "../components/BillingPanel";
import LoginPanel from "../components/LoginPanel";
import FolderTreeUI from "../views/FolderTreeUI";

export default function Home() {
  const [apiStatus, setApiStatus] = useState<"checking" | "ok" | "fail">("checking");
  const { data: session } = useSession();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:5000") + "/graphql";
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: "{ hello }" }),
        });
        const json = await res.json();
        if (!cancelled && json?.data?.hello) setApiStatus("ok");
        else if (!cancelled) setApiStatus("fail");
      } catch (err) {
        console.log("Backend not available, running in demo mode");
        if (!cancelled) setApiStatus("fail");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const heroStats = [
    { label: "Folders normalized", value: "+58k" },
    { label: "Automation rules", value: "1.2k" },
    { label: "Audit savings", value: "72%" },
    { label: "SLA compliance", value: "99.4%" },
  ];

  const capabilityDeck = [
    {
      title: "Adaptive taxonomies",
      description:
        "Draft blueprints, simulate the impact, and deploy AI guardians that evolve with each workspace.",
    },
    {
      title: "Policy intelligence",
      description:
        "Blend retention, sensitivity, and ownership policies into one decision layer with explainable outcomes.",
    },
    {
      title: "Governed collaboration",
      description:
        "Surface risks to legal and compliance teams in real time with auto-generated remediation tasks.",
    },
    {
      title: "Ops command center",
      description:
        "Timeline views, anomaly alerts, and weekly business reviews ready for exec reporting in minutes.",
    },
  ];

  const operationsTimeline = [
    {
      phase: "Kickoff",
      title: "Connect repos & drives",
      copy: "Secure OAuth connectors federate Google Drive, OneDrive, S3, and on-prem DFS with zero scripting.",
    },
    {
      phase: "Week 1",
      title: "Blueprint your taxonomy",
      copy: "Co-create with our AI assistant and benchmark against industry templates to launch with confidence.",
    },
    {
      phase: "Week 2",
      title: "Automate governance",
      copy: "Deploy continuous monitors, stakeholder workflows, and notifications directly into Slack or Teams.",
    },
    {
      phase: "Week 4",
      title: "Executive roll-up",
      copy: "Trust dashboards deliver cost savings, compliance posture, and change velocity in one consolidated view.",
    },
  ];

  const partnerBadges = ["Orbit Finance", "Zephyr Labs", "Waypoint Legal", "Atlas Medical", "Northwind", "Lumina Ops"];

  const testimonials = [
    {
      name: "Priya Chen",
      role: "Director of Business Systems, Orbit Finance",
      quote:
        "FolderTree became our operating fabric. The audit prep timeline shrank from six weeks to four days, and our teams finally trust shared spaces again.",
    },
    {
      name: "Jon Reed",
      role: "VP Operations, Lumina Ops",
      quote:
        "The automation builder let us codify retention policies with no scripting. We redeployed 2 FTEs from manual cleanup to strategic projects.",
    },
  ];

  const pricingPlans = [
    {
      name: "Scale",
      price: "$39",
      cadence: "per seat / month",
      bullets: ["Unlimited automations", "Live storage map", "SOC 2 export"],
      badge: "Most adopted",
    },
    {
      name: "Control",
      price: "$89",
      cadence: "per seat / month",
      bullets: ["Advanced delegation", "Legal hold center", "AI redaction"],
      badge: "Enterprise ready",
    },
  ];

  const faqs = [
    {
      question: "How does FolderTree connect to storage?",
      answer:
        "We ship native connectors and SCIM provisioning. Bring your own IAM or leverage ours with least-privilege defaults.",
    },
    {
      question: "Can we keep sensitive data on-prem?",
      answer:
        "Yes. Deploy the governance engine in your VPC and use our control plane for orchestration without data egress.",
    },
    {
      question: "What does onboarding look like?",
      answer:
        "A solutions engineer co-designs taxonomy pilots, and you get weekly business reviews for the first 60 days.",
    },
  ];

  const dashboardInsights = [
    {
      title: "Automation throughput",
      trend: "+18%",
      detail: "Workflow median completion",
    },
    {
      title: "Policy exceptions",
      trend: "-42%",
      detail: "Week-over-week variance",
    },
    {
      title: "Review cycle",
      trend: "3.2d",
      detail: "Average SLA to resolution",
    },
  ];

  const activityFeed = [
    {
      title: "Monthly taxonomy sync",
      description: "12 collections aligned with Finance Blueprint",
      time: "12m ago",
    },
    {
      title: "Automation deployed",
      description: "Governance bot activated for Legal - Shared",
      time: "47m ago",
    },
    {
      title: "Exception resolved",
      description: "Retention breach addressed by Ops Analyst team",
      time: "2h ago",
    },
  ];

  if (!session) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16)_0%,_rgba(15,23,42,0)_60%)]" />
        <div className="pointer-events-none absolute left-[-25%] top-[-10%] h-80 w-80 rounded-full bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute right-[-10%] bottom-[-20%] h-96 w-96 rounded-full bg-gradient-to-tl from-sky-400/10 via-indigo-500/10 to-transparent blur-3xl" />
        <div className="relative z-10">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-7">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-lg font-bold text-white shadow-lg">
                FT
              </div>
              <div>
                <p className="text-base font-semibold tracking-wide text-slate-100">FolderTree</p>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Pro</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
              <a href="#capabilities" className="transition hover:text-white">
                Platform
              </a>
              <a href="#playbook" className="transition hover:text-white">
                Playbook
              </a>
              <a href="#pricing" className="transition hover:text-white">
                Pricing
              </a>
            </div>
            <div className="flex items-center gap-4">
              <span
                className={`hidden items-center gap-2 rounded-full px-3 py-1 text-xs font-medium sm:flex ${
                  apiStatus === "ok"
                    ? "bg-emerald-500/10 text-emerald-300"
                    : apiStatus === "checking"
                    ? "bg-amber-500/10 text-amber-300"
                    : "bg-slate-700/60 text-slate-300"
                }`}
                aria-live="polite"
              >
                <span className={`h-1.5 w-1.5 rounded-full ${
                  apiStatus === "ok"
                    ? "bg-emerald-400"
                    : apiStatus === "checking"
                    ? "bg-amber-300"
                    : "bg-slate-400"
                }`} />
                {apiStatus === "ok" ? "API Online" : apiStatus === "checking" ? "Checking API" : "Demo mode"}
              </span>
              <button
                onClick={() => signIn("github")}
                className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                Sign in with GitHub
              </button>
            </div>
          </nav>

          <main className="mx-auto max-w-6xl px-6 pb-24">
            <section className="grid grid-cols-1 gap-16 pt-8 lg:grid-cols-[minmax(0,_1.1fr)_minmax(0,_0.9fr)] lg:items-center">
              <div className="space-y-10">
                <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-slate-300">
                  Operating system for knowledge ops
                </div>
                <div className="space-y-6">
                  <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl xl:text-6xl">
                    Command shared workspaces with live AI governance
                  </h1>
                  <p className="text-lg leading-relaxed text-slate-300">
                    FolderTree PRO unifies folder intelligence, automation, and compliance workflows. Replace the weekly clean-up sprint with a continuous, auditable engine designed for fast-moving operations teams.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    onClick={() => signIn("github")}
                    className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 px-6 py-3 text-sm font-semibold text-white shadow-2xl transition hover:-translate-y-0.5 hover:shadow-[0_20px_45px_-15px_rgba(59,130,246,0.7)]"
                  >
                    Launch interactive demo
                  </button>
                  <a
                    href="#playbook"
                    className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
                  >
                    Browse onboarding playbook
                  </a>
                </div>
                <div className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-4">
                  {heroStats.map((item) => (
                    <div
                      key={item.label}
                      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_25px_55px_-45px_rgba(59,130,246,0.9)] transition hover:-translate-y-1 hover:border-white/20"
                    >
                      <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-transparent" />
                      </div>
                      <p className="text-2xl font-semibold text-white">{item.value}</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-300">{item.label}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-slate-500">
                  <span className="text-slate-400">Validated by teams at</span>
                  {partnerBadges.map((badge) => (
                    <span key={badge} className="rounded-full border border-white/10 px-3 py-1 text-slate-300">
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="absolute -inset-8 rounded-[36px] bg-gradient-to-br from-blue-500/40 via-indigo-500/20 to-purple-500/10 blur-2xl" />
                <div className="relative space-y-6 rounded-[32px] border border-white/10 bg-slate-900/80 p-6 shadow-[0_20px_45px_-25px_rgba(15,23,42,1)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white/80">Workspace access</p>
                      <p className="text-xs text-slate-400">Authenticate to continue</p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
                        apiStatus === "ok"
                          ? "bg-emerald-500/10 text-emerald-300"
                          : apiStatus === "checking"
                          ? "bg-amber-500/10 text-amber-300"
                          : "bg-slate-700/60 text-slate-300"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        apiStatus === "ok"
                          ? "bg-emerald-400"
                          : apiStatus === "checking"
                          ? "bg-amber-300"
                          : "bg-slate-400"
                      }`} />
                      {apiStatus === "ok" ? "Backend live" : apiStatus === "checking" ? "Checking" : "Demo"}
                    </span>
                  </div>
                  <LoginPanel />
                  <div className="grid gap-4 rounded-3xl bg-slate-950/70 p-4 border border-white/5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Governance score</span>
                      <span>96 / 100</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10">
                      <div className="h-full w-[87%] rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Data refreshed 14 minutes ago · Continuous monitoring active
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section id="capabilities" className="mt-24 grid gap-8 lg:grid-cols-4">
              {capabilityDeck.map((card) => (
                <div
                  key={card.title}
                  className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-7 shadow-[0_25px_55px_-35px_rgba(30,64,175,0.6)] backdrop-blur"
                >
                  <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-transparent" />
                  </div>
                  <div className="relative space-y-4">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 text-sm font-semibold text-white">
                      FT
                    </div>
                    <h3 className="text-xl font-semibold text-white">{card.title}</h3>
                    <p className="text-sm leading-relaxed text-slate-300">{card.description}</p>
                    <button className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-200 transition hover:text-blue-100">
                      View blueprint →
                    </button>
                  </div>
                </div>
              ))}
            </section>

            <section id="playbook" className="mt-24 rounded-[32px] border border-white/10 bg-white/5 p-8">
              <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:gap-16">
                <div className="max-w-md space-y-5">
                  <h2 className="text-3xl font-bold text-white">Implementation playbook</h2>
                  <p className="text-sm leading-relaxed text-slate-300">
                    From the first connector to exec-ready scorecards, FolderTree pilots are structured around outcome-based checkpoints. No loose ends, no side spreadsheets.
                  </p>
                  <a href="#" className="inline-flex text-sm font-semibold text-blue-300 transition hover:text-blue-200">
                    Download the onboarding checklist →
                  </a>
                </div>
                <div className="grid flex-1 gap-6">
                  {operationsTimeline.map((event) => (
                    <div
                      key={event.title}
                      className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-[0_25px_55px_-45px_rgba(56,189,248,0.6)]"
                    >
                      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-blue-500 via-indigo-500 to-purple-500" />
                      <div className="flex items-center justify-between pl-4 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                        <span>{event.phase}</span>
                        <span>Milestone</span>
                      </div>
                      <h3 className="mt-3 pl-4 text-lg font-semibold text-white">{event.title}</h3>
                      <p className="mt-2 pl-4 text-sm leading-relaxed text-slate-300">{event.copy}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="mt-24 grid gap-8 lg:grid-cols-[minmax(0,_1.1fr)_minmax(0,_0.9fr)]">
              <div className="rounded-[32px] border border-white/10 bg-gradient-to-br from-blue-600/20 via-indigo-500/20 to-purple-500/20 p-8">
                <h2 className="text-3xl font-bold text-white">Revenue-grade reporting without spreadsheets</h2>
                <p className="mt-4 text-sm leading-relaxed text-slate-100/80">
                  Every FolderTree workspace ships with configurable scorecards for compliance, automation velocity, and alignment. Export ready-to-present decks or stream the widgets into your BI stack.
                </p>
                <div className="mt-8 grid gap-6 md:grid-cols-2">
                  {dashboardInsights.map((insight) => (
                    <div key={insight.title} className="rounded-3xl border border-white/20 bg-slate-900/60 p-6">
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{insight.detail}</p>
                      <p className="mt-3 text-3xl font-bold text-white">{insight.trend}</p>
                      <p className="mt-2 text-sm text-slate-300">{insight.title}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                {testimonials.map((item) => (
                  <div
                    key={item.name}
                    className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_30px_60px_-45px_rgba(59,130,246,0.9)]"
                  >
                    <p className="text-sm leading-relaxed text-slate-200">“{item.quote}”</p>
                    <div className="mt-4">
                      <p className="text-sm font-semibold text-white">{item.name}</p>
                      <p className="text-xs text-slate-400">{item.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section id="pricing" className="mt-24 grid gap-8 lg:grid-cols-2">
              {pricingPlans.map((plan) => (
                <div
                  key={plan.name}
                  className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 via-white/5 to-white/0 p-8 shadow-[0_30px_70px_-55px_rgba(79,70,229,0.9)]"
                >
                  {plan.badge && (
                    <span className="absolute right-6 top-6 inline-flex rounded-full bg-gradient-to-r from-blue-500 to-purple-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-white">
                      {plan.badge}
                    </span>
                  )}
                  <h3 className="text-2xl font-semibold text-white">{plan.name}</h3>
                  <p className="mt-2 text-sm text-slate-300">{plan.cadence}</p>
                  <p className="mt-6 text-4xl font-bold text-white">{plan.price}</p>
                  <ul className="mt-6 space-y-3 text-sm text-slate-200">
                    {plan.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-center gap-3">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[12px] text-blue-200">
                          ✓
                        </span>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => signIn("github")}
                    className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-white/90 px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-white"
                  >
                    Access plan
                  </button>
                </div>
              ))}
            </section>

            <section className="mt-24 grid gap-10 rounded-[32px] border border-white/10 bg-white/5 p-8 lg:grid-cols-[minmax(0,_0.8fr)_minmax(0,_1.2fr)]">
              <div className="space-y-5">
                <h2 className="text-3xl font-bold text-white">Frequently asked</h2>
                <p className="text-sm leading-relaxed text-slate-300">
                  Not seeing your question? Join our weekly product clinics or chat with success engineers directly inside the app.
                </p>
                <a href="#" className="inline-flex text-sm font-semibold text-blue-300 transition hover:text-blue-200">
                  Open the knowledge base →
                </a>
              </div>
              <div className="space-y-4">
                {faqs.map((faq) => (
                  <div
                    key={faq.question}
                    className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-[0_25px_55px_-45px_rgba(15,23,42,1)]"
                  >
                    <h3 className="text-sm font-semibold text-white">{faq.question}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-300">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          </main>

          <footer className="border-t border-white/10 bg-slate-950/70">
            <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-12 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-semibold text-white">
                    FT
                  </div>
                  <div className="text-lg font-semibold text-white">FolderTree PRO</div>
                </div>
                <p className="text-sm leading-relaxed text-slate-400">
                  The operating fabric for structured knowledge work. Deliver precision governance, measurable savings, and effortless audits across every shared workspace.
                </p>
              </div>
              <div className="grid flex-1 grid-cols-2 gap-8 text-sm text-slate-300 md:grid-cols-3">
                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Product</h4>
                  <ul className="mt-4 space-y-2">
                    <li><a href="#capabilities" className="transition hover:text-white">Feature map</a></li>
                    <li><a href="#pricing" className="transition hover:text-white">Pricing</a></li>
                    <li><a href="#" className="transition hover:text-white">Platform status</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Resources</h4>
                  <ul className="mt-4 space-y-2">
                    <li><a href="#" className="transition hover:text-white">Launch kit</a></li>
                    <li><a href="#" className="transition hover:text-white">Security portal</a></li>
                    <li><a href="#" className="transition hover:text-white">API docs</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Company</h4>
                  <ul className="mt-4 space-y-2">
                    <li><a href="#" className="transition hover:text-white">Our story</a></li>
                    <li><a href="#" className="transition hover:text-white">Careers</a></li>
                    <li><a href="#" className="transition hover:text-white">Press</a></li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="border-t border-white/10">
              <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                <p>© 2025 FolderTree Pro. All rights reserved.</p>
                <div className="flex gap-6">
                  <a href="#" className="transition hover:text-white/80">
                    Privacy
                  </a>
                  <a href="#" className="transition hover:text-white/80">
                    Terms
                  </a>
                  <a href="#" className="transition hover:text-white/80">
                    Cookies
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,_rgba(56,189,248,0.15)_0%,_rgba(15,23,42,0)_60%)]" />
      <div className="pointer-events-none absolute bottom-[-30%] left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-gradient-to-tr from-purple-500/20 via-indigo-500/10 to-transparent blur-[140px]" />
      <div className="relative z-10">
        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 pt-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-lg font-bold text-white shadow-lg">
              FT
            </div>
            <div>
              <p className="text-base font-semibold tracking-wide text-slate-50">FolderTree</p>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Pro</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
            <a href="#overview" className="transition hover:text-white">
              Overview
            </a>
            <a href="#analytics" className="transition hover:text-white">
              Analytics
            </a>
            <a href="#automation" className="transition hover:text-white">
              Automations
            </a>
          </div>
          <div className="flex items-center gap-4">
            <span
              className={`hidden items-center gap-2 rounded-full px-3 py-1 text-xs font-medium sm:flex ${
                apiStatus === "ok"
                  ? "bg-emerald-500/10 text-emerald-300"
                  : apiStatus === "checking"
                  ? "bg-amber-500/10 text-amber-300"
                  : "bg-slate-700/60 text-slate-300"
              }`}
              aria-live="polite"
            >
              <span className={`h-1.5 w-1.5 rounded-full ${
                apiStatus === "ok"
                  ? "bg-emerald-400"
                  : apiStatus === "checking"
                  ? "bg-amber-300"
                  : "bg-slate-400"
              }`} />
              {apiStatus === "ok" ? "API Online" : apiStatus === "checking" ? "Checking API" : "Demo mode"}
            </span>
            <div className="hidden flex-col text-right sm:flex">
              <span className="text-sm font-semibold text-white">{session.user?.name}</span>
              <span className="text-xs text-slate-400">{session.user?.email}</span>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-sm font-semibold text-white shadow-lg">
              {session.user?.name?.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={() => signOut()}
              className="inline-flex items-center justify-center rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
            >
              Sign out
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-6 pb-16 pt-12">
          <section id="overview" className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,_1.2fr)_minmax(0,_0.8fr)]">
            <div className="overflow-hidden rounded-[32px] border border-white/10 bg-slate-900/80 shadow-[0_30px_60px_-40px_rgba(15,23,42,1)]">
              <div className="flex flex-col gap-6 border-b border-white/10 bg-gradient-to-r from-blue-500/20 via-indigo-500/10 to-purple-500/10 px-8 py-8 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-5">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-2xl font-semibold text-white shadow-xl">
                    FT
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white">Operational cockpit</h2>
                    <p className="text-sm text-slate-300">
                      Cross-workspace visibility, live anomalies, and automation health in one glass dashboard.
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold ${
                    apiStatus === "ok"
                      ? "bg-emerald-500/10 text-emerald-300"
                      : apiStatus === "checking"
                      ? "bg-amber-500/10 text-amber-300"
                      : "bg-red-500/10 text-red-300"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    apiStatus === "ok"
                      ? "bg-emerald-400"
                      : apiStatus === "checking"
                      ? "bg-amber-300"
                      : "bg-red-300"
                  }`} />
                  {apiStatus === "ok" ? "Backend healthy" : apiStatus === "checking" ? "Checking connectivity" : "Backend issue"}
                </span>
              </div>
              <div className="px-6 pb-8 pt-6">
                <FolderTreeUI />
              </div>
            </div>
            <aside className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-[0_20px_45px_-30px_rgba(37,99,235,1)]">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white/80">Account overview</p>
                    <p className="text-xs text-slate-400">You are on the Premium plan</p>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
                    Premium
                  </span>
                </div>
                <div className="space-y-2 text-sm text-slate-300">
                  <p className="font-semibold text-white">{session.user?.name}</p>
                  <p>{session.user?.email}</p>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-3 text-center text-xs text-slate-400">
                  {dashboardInsights.map((insight) => (
                    <div key={insight.title} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <p className="text-sm font-semibold text-white">{insight.trend}</p>
                      <p className="mt-1 text-[11px] leading-tight">{insight.title}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div id="billing" className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-[0_20px_45px_-30px_rgba(76,29,149,1)]">
                <BillingPanel />
              </div>
            </aside>
          </section>

          <section id="analytics" className="mt-16 grid gap-6 rounded-[32px] border border-white/10 bg-white/5 p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white">Analytics snapshot</h3>
                <p className="text-sm text-slate-300">
                  Weekly digest derived from automations, compliance monitors, and workspace telemetry.
                </p>
              </div>
              <button className="inline-flex items-center justify-center rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:border-white/40 hover:text-white">
                Export as PDF
              </button>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Automation volume</p>
                <p className="mt-4 text-3xl font-bold text-white">3,482 runs</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">↑ 18% vs last week · 12 automations flagged for review</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Exception backlog</p>
                <p className="mt-4 text-3xl font-bold text-white">14 open cases</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">7 aging &gt;48h · SLA burn rate trending down by 12%</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Data residency</p>
                <p className="mt-4 text-3xl font-bold text-white">100% compliant</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">All mapped storage locations meet policy · 3 new controls deployed</p>
              </div>
            </div>
          </section>

          <section id="automation" className="mt-16 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,_0.9fr)_minmax(0,_1.1fr)]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h3 className="text-lg font-semibold text-white">Live automation center</h3>
                <p className="mt-2 text-sm text-slate-300">
                  Track rollouts, observe queue health, and drill into remediation playbooks without leaving the dashboard.
                </p>
                <div className="mt-6 space-y-4">
                  {activityFeed.map((activity) => (
                    <div key={activity.title} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>{activity.time}</span>
                        <span>Live</span>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-white">{activity.title}</p>
                      <p className="text-sm text-slate-300">{activity.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid gap-6">
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
                <h3 className="text-lg font-semibold text-white">Workspace scorecard</h3>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Governance</p>
                    <p className="mt-2 text-3xl font-bold text-white">96</p>
                    <p className="text-sm text-slate-300">Benchmark +9</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Automation health</p>
                    <p className="mt-2 text-3xl font-bold text-white">92%</p>
                    <p className="text-sm text-slate-300">Error budget 12%</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Adoption</p>
                    <p className="mt-2 text-3xl font-bold text-white">87%</p>
                    <p className="text-sm text-slate-300">Active teams 24</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Retention</p>
                    <p className="mt-2 text-3xl font-bold text-white">99.4%</p>
                    <p className="text-sm text-slate-300">Aligned with policy</p>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h3 className="text-lg font-semibold text-white">Strategic programs</h3>
                <ul className="mt-4 space-y-3 text-sm text-slate-200">
                  <li className="flex items-center justify-between">
                    <span>Finance modernization initiative</span>
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">On track</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Real-time retention rules</span>
                    <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs text-amber-300">Monitoring</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Legal archive migration</span>
                    <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-200">Planning</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-white/10 bg-slate-950/70">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2025 FolderTree Pro. Built for operational excellence.</p>
            <div className="flex gap-6">
              <a href="#" className="transition hover:text-white/80">
                Status
              </a>
              <a href="#" className="transition hover:text-white/80">
                Support
              </a>
              <a href="#" className="transition hover:text-white/80">
                Changelog
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}