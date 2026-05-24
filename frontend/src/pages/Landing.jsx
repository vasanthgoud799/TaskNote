import React from "react";
import { Link } from "react-router-dom";
import {
  FiActivity,
  FiArchive,
  FiBarChart2,
  FiBell,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiGrid,
  FiPenTool,
  FiSmartphone,
} from "react-icons/fi";

const features = [
  { icon: FiPenTool, title: "Smart notes", text: "Capture structured ideas, categories, stars, pins, and reminders." },
  { icon: FiCheckCircle, title: "Task management", text: "Plan priority, due dates, status, and daily momentum in one place." },
  { icon: FiGrid, title: "Kanban board", text: "Drag work from todo to doing to done with immediate reconciliation." },
  { icon: FiCalendar, title: "Calendar planning", text: "See task deadlines in a calm month view with selected-day focus." },
  { icon: FiClock, title: "Pomodoro focus", text: "Run focused sessions and save real focus minutes to your analytics." },
  { icon: FiActivity, title: "Habit tracking", text: "Build streaks, toggle completions, and keep consistency visible." },
  { icon: FiBarChart2, title: "Analytics", text: "Understand tasks, reminders, habits, notes, and focus patterns." },
  { icon: FiSmartphone, title: "Offline PWA", text: "Install TaskNote and keep the app shell available after first visit." },
  { icon: FiBell, title: "Email/SMS reminders", text: "Provider-based reminder architecture with opt-in notification settings." },
];

const Landing = () => (
  <main className="min-h-screen overflow-hidden bg-[#080807] text-[#f5f5f5]">
    <div className="particle-field" aria-hidden="true">
      {Array.from({ length: 28 }, (_, index) => <span key={index} />)}
    </div>

    <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
      <Link className="inline-flex items-center gap-3 text-2xl font-black text-[#e5b85c]" to="/">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e5b85c] text-[#171107]">
          <FiArchive />
        </span>
        TaskNote
      </Link>
      <div className="flex items-center gap-3">
        <Link className="rounded-2xl border border-[#242424] px-4 py-2 font-bold text-[#a3a3a3] transition hover:border-[#e5b85c]/50 hover:text-[#f5f5f5]" to="/sign-in">
          Login
        </Link>
        <Link className="rounded-2xl bg-[#e5b85c] px-4 py-2 font-black text-[#171107] transition hover:bg-[#f0c96a]" to="/sign-up">
          Get Started
        </Link>
      </div>
    </nav>

    <section className="relative z-10 mx-auto grid min-h-[calc(100vh-84px)] max-w-7xl items-center gap-12 px-5 py-12 lg:grid-cols-[1fr_0.9fr]">
      <div>
        <p className="mb-5 inline-flex rounded-full border border-[#e5b85c]/30 bg-[#e5b85c]/10 px-4 py-2 text-sm font-black uppercase tracking-[0.22em] text-[#e5b85c]">
          Premium productivity workspace
        </p>
        <h1 className="max-w-4xl text-5xl font-black leading-tight tracking-tight sm:text-6xl lg:text-7xl">
          Organize your notes, tasks, habits, and focus — beautifully.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-[#a3a3a3]">
          TaskNote brings notes, priorities, boards, calendar planning, focus sessions, habits, analytics, offline PWA behavior, and reminders into one elegant workspace.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link className="inline-flex items-center justify-center rounded-2xl bg-[#e5b85c] px-6 py-4 font-black text-[#171107] transition hover:-translate-y-0.5 hover:bg-[#f0c96a]" to="/sign-up">
            Get Started
          </Link>
          <Link className="inline-flex items-center justify-center rounded-2xl border border-[#242424] bg-[#121212] px-6 py-4 font-black text-[#f5f5f5] transition hover:-translate-y-0.5 hover:border-[#e5b85c]/50" to="/sign-in">
            Login
          </Link>
        </div>
      </div>

      <div className="relative">
        <div className="absolute -inset-8 rounded-[3rem] bg-[#e5b85c]/10 blur-3xl" />
        <div className="relative overflow-hidden rounded-[2rem] border border-[#242424] bg-[#0b0b0b]/90 p-4 shadow-2xl shadow-black/50 backdrop-blur">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#e5b85c]">Dashboard</p>
              <h2 className="text-2xl font-black">Good evening.</h2>
            </div>
            <span className="rounded-full bg-[#e5b85c]/10 px-3 py-1 text-sm font-black text-[#e5b85c]">0-day streak</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {["Due Today", "Overdue", "Completed", "Focus"].map((item, index) => (
              <div key={item} className="rounded-3xl border border-[#242424] bg-[#121212] p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a3a3a3]">{item}</p>
                <strong className="mt-3 block text-4xl font-black">{index === 3 ? "25m" : index}</strong>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-3xl border border-[#242424] bg-[#121212] p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-black">This week</h3>
              <span className="text-sm text-[#a3a3a3]">Gold trend</span>
            </div>
            <div className="flex h-36 items-end gap-3">
              {[24, 18, 42, 22, 60, 45, 78].map((height, index) => (
                <span key={index} className="flex-1 rounded-t-xl bg-[#e5b85c]" style={{ height: `${height}%`, opacity: 0.45 + index * 0.07 }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="relative z-10 mx-auto max-w-7xl px-5 py-20">
      <div className="mb-10 max-w-3xl">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-[#e5b85c]">Everything in one workspace</p>
        <h2 className="mt-3 text-4xl font-black">Less app switching. More clear execution.</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <article key={feature.title} className="rounded-3xl border border-[#242424] bg-[#0b0b0b] p-5 transition hover:-translate-y-1 hover:border-[#e5b85c]/50 hover:shadow-2xl hover:shadow-black/30">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e5b85c]/12 text-[#e5b85c]">
                <Icon />
              </span>
              <h3 className="mt-5 text-xl font-black">{feature.title}</h3>
              <p className="mt-2 leading-7 text-[#a3a3a3]">{feature.text}</p>
            </article>
          );
        })}
      </div>
    </section>

    <section className="relative z-10 mx-auto grid max-w-7xl gap-5 px-5 py-20 lg:grid-cols-3">
      {[
        ["Why TaskNote?", "A serious workspace for people who want notes, tasks, habits, focus, and analytics to cooperate instead of compete."],
        ["PWA-ready", "Install it, launch it like a native app, and keep the shell available offline after your first visit."],
        ["Reminder-aware", "Email and SMS providers stay behind environment variables, so reminders can scale without hardcoded secrets."],
      ].map(([title, text]) => (
        <article key={title} className="rounded-3xl border border-[#242424] bg-[#121212] p-6">
          <h2 className="text-2xl font-black">{title}</h2>
          <p className="mt-3 leading-7 text-[#a3a3a3]">{text}</p>
        </article>
      ))}
    </section>

    <section className="relative z-10 mx-auto max-w-4xl px-5 py-24 text-center">
      <h2 className="text-4xl font-black sm:text-5xl">Ready to build a calmer productivity system?</h2>
      <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-[#a3a3a3]">
        Start with one note, one task, one focus block. TaskNote keeps the system beautiful as it grows.
      </p>
      <Link className="mt-8 inline-flex rounded-2xl bg-[#e5b85c] px-6 py-4 font-black text-[#171107] transition hover:bg-[#f0c96a]" to="/sign-up">
        Get Started
      </Link>
    </section>

    <footer className="relative z-10 border-t border-[#242424] px-5 py-8 text-center text-sm text-[#737373]">
      TaskNote. Notes, tasks, habits, focus, and planning in one premium workspace.
    </footer>
  </main>
);

export default Landing;
