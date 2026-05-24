import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { apiClient, setApiToken } from "../api/apiClient.js";
import { useAuth } from "../auth/AuthProvider.jsx";
import {
  FiActivity,
  FiBarChart2,
  FiCalendar,
  FiCheck,
  FiCheckSquare,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiFileText,
  FiGrid,
  FiHome,
  FiLogOut,
  FiPlus,
  FiSearch,
  FiSettings,
  FiTag,
  FiTrash2,
  FiX,
  FiZap,
} from "react-icons/fi";

const gold = "#e6b957";
const todayKey = () => new Date().toISOString().slice(0, 10);
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const cls = (...parts) => parts.filter(Boolean).join(" ");
const dateOnly = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "");
const focusModes = { pomodoro: 25, deep: 50, quick: 15 };

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: FiHome },
  { to: "/notes", label: "Notes", icon: FiFileText },
  { to: "/tasks", label: "Tasks", icon: FiCheckSquare },
  { to: "/board", label: "Board", icon: FiGrid },
  { to: "/calendar", label: "Calendar", icon: FiCalendar },
  { to: "/focus", label: "Focus", icon: FiClock },
  { to: "/analytics", label: "Analytics", icon: FiBarChart2 },
  { to: "/habits", label: "Habits", icon: FiActivity },
  { to: "/tags", label: "Tags", icon: FiTag },
];

const colors = [
  "#ef5350",
  "#f47b2b",
  "#f5a932",
  "#e7bf3e",
  "#95d346",
  "#56bf68",
  "#54b883",
  "#53b7a9",
  "#55b9d4",
  "#4fa7e8",
  "#5d86e9",
  "#6661e8",
  "#8159e8",
  "#9a50e5",
  "#c24edc",
  "#dc5290",
  "#64748b",
  "#475569",
];

const seed = {
  notes: [
    {
      id: "note-features",
      title: "Features",
      content: "4. Conversation Replay Mode\n\nReplay chat like a timeline\n\nSee how discussion evolved...",
      pinned: true,
      color: "",
      tags: [],
      createdAt: new Date(Date.now() - 19 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 19 * 86400000).toISOString(),
    },
    {
      id: "note-security",
      title: "GitHub Security",
      content: "Hi evointel4-pixel,\n\nWe're writing to let you know that between September 2025 and January 2026, webhook secrets for webhooks you are ...",
      pinned: false,
      color: "",
      tags: [],
      createdAt: new Date(Date.now() - 21 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 21 * 86400000).toISOString(),
    },
  ],
  tasks: [
    {
      id: "task-karcher",
      title: "Karcher",
      description: "Need to complete the documentation",
      status: "done",
      priority: "urgent",
      dueDate: "2026-04-23",
      important: true,
      urgent: true,
      tags: [],
      createdAt: new Date(Date.now() - 22 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 15 * 3600000).toISOString(),
    },
  ],
  habits: [],
  tags: [],
  sessions: [],
  reminders: [],
  settings: null,
};

const normalizeTask = (task) => ({
  ...task,
  dueDate: dateOnly(task.dueDate),
  startDate: dateOnly(task.startDate),
  important: Boolean(task.important),
  urgent: Boolean(task.urgent || task.priority === "urgent"),
  reminderAt: task.reminderAt ? new Date(task.reminderAt).toISOString().slice(0, 16) : "",
  reminderOffsets: task.reminderOffsets || [],
  reminderChannels: task.reminderChannels || [],
  subtasks: task.subtasks || [],
  dependencies: task.dependencies || task.blockedBy || [],
  estimatedMinutes: task.estimatedMinutes || 25,
  actualMinutes: task.actualMinutes || 0,
});

const normalizeNote = (note) => ({
  ...note,
  reminderAt: note.reminderAt ? new Date(note.reminderAt).toISOString().slice(0, 16) : "",
  reminderOffsets: note.reminderOffsets || [],
  reminderChannels: note.reminderChannels || [],
  backlinks: note.backlinks || [],
  linkedTaskIds: note.linkedTaskIds || [],
});

const normalizeHabit = (habit) => ({
  ...habit,
  completions: (habit.completions || []).map((entry) => (typeof entry === "string" ? entry : entry.date)).filter(Boolean),
  reminderOffsets: habit.reminderOffsets || [],
  reminderChannels: habit.reminderChannels || [],
});

const normalizeSession = (session) => ({
  ...session,
  minutes: session.minutes || session.durationMinutes || 0,
});

async function unwrap(request) {
  const response = await request;
  return response.data?.data || {};
}

function useWorkspaceData(user) {
  const userId = user?.id;
  const key = `tasknote.workspace.${userId || "guest"}`;
  const [data, setData] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(key)) || seed;
    } catch {
      return seed;
    }
  });
  const [onlineApi, setOnlineApi] = useState(false);

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(data));
  }, [data, key]);

  useEffect(() => {
    let cancelled = false;

    async function loadWorkspace() {
      if (!userId) return;
      try {
        setApiToken(null);
        await unwrap(apiClient.patch("/api/settings", {
          email: user?.email || "",
          name: user?.name || "",
        }));
        const [notes, tasks, habits, tags, focus, reminders, settings] = await Promise.all([
          unwrap(apiClient.get("/api/notes")),
          unwrap(apiClient.get("/api/tasks")),
          unwrap(apiClient.get("/api/habits")),
          unwrap(apiClient.get("/api/tags")),
          unwrap(apiClient.get("/api/focus-sessions")),
          unwrap(apiClient.get("/api/reminders")),
          unwrap(apiClient.get("/api/settings")),
        ]);
        if (cancelled) return;
        setOnlineApi(true);
        setData((current) => ({
          notes: (notes.notes || current.notes || []).map(normalizeNote),
          tasks: (tasks.tasks || current.tasks || []).map(normalizeTask),
          habits: (habits.habits || current.habits || []).map(normalizeHabit),
          tags: tags.tags || current.tags || [],
          sessions: (focus.sessions || current.sessions || []).map(normalizeSession),
          reminders: reminders.reminders || current.reminders || [],
          settings: settings.settings || current.settings || null,
        }));
      } catch (error) {
        setOnlineApi(false);
        console.warn("TaskNote API unavailable, using local cache:", error.message);
      }
    }

    loadWorkspace();
    return () => {
      cancelled = true;
    };
  }, [key, userId, user?.email, user?.name]);

  const update = (recipe) => setData((current) => (typeof recipe === "function" ? recipe(current) : recipe));
  const ensureApiToken = async () => {
    setApiToken(null);
  };
  const withApi = async (fallback, work, success) => {
    try {
      await ensureApiToken();
      const result = await work();
      if (success) toast.success(success);
      return result;
    } catch (error) {
      setOnlineApi(false);
      fallback?.();
      toast.error(error?.response?.data?.message || error.message || "Saved locally. Backend is unavailable.");
      return null;
    }
  };

  return {
    ...data,
    onlineApi,
    async createNote(note) {
      const next = {
        id: uid(),
        title: note.title.trim(),
        content: note.content?.trim() || "",
        pinned: Boolean(note.pinned),
        color: note.color || "",
        tags: note.tags || [],
        reminderAt: note.reminderAt || "",
        reminderOffsets: note.reminderOffsets || [],
        reminderChannels: note.reminderChannels || [],
        backlinks: extractBacklinks(note.content || ""),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await withApi(
        () => update((d) => ({ ...d, notes: [next, ...d.notes] })),
        async () => {
          const result = await unwrap(apiClient.post("/api/notes", next));
          update((d) => ({ ...d, notes: [normalizeNote(result.note), ...d.notes] }));
        },
        "Note created"
      );
    },
    async updateNote(id, patch) {
      const payload = { ...patch, backlinks: extractBacklinks(patch.content || "") };
      await withApi(
        () => update((d) => ({ ...d, notes: d.notes.map((note) => (note.id === id ? { ...note, ...payload, updatedAt: new Date().toISOString() } : note)) })),
        async () => {
          const result = await unwrap(apiClient.put(`/api/notes/${id}`, payload));
          update((d) => ({ ...d, notes: d.notes.map((note) => (note.id === id ? normalizeNote(result.note) : note)) }));
        },
        "Note updated"
      );
    },
    async deleteNote(id) {
      await withApi(
        () => update((d) => ({ ...d, notes: d.notes.filter((note) => note.id !== id) })),
        async () => {
          await unwrap(apiClient.delete(`/api/notes/${id}`));
          update((d) => ({ ...d, notes: d.notes.filter((note) => note.id !== id), reminders: d.reminders.filter((r) => r.targetId !== id) }));
        },
        "Note deleted"
      );
    },
    async createTask(task) {
      const next = {
        id: uid(),
        title: task.title.trim(),
        description: task.description?.trim() || "",
        status: task.status || "todo",
        priority: task.priority || "medium",
        dueDate: task.dueDate || "",
        important: Boolean(task.important),
        urgent: task.priority === "urgent" || Boolean(task.urgent),
        tags: task.tags || [],
        subtasks: task.subtasks || [],
        dependencies: task.dependencies || [],
        estimatedMinutes: Number(task.estimatedMinutes || 25),
        actualMinutes: Number(task.actualMinutes || 0),
        recurringRule: task.recurringRule || "",
        reminderAt: task.reminderAt || "",
        reminderOffsets: task.reminderOffsets || [],
        reminderChannels: task.reminderChannels || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await withApi(
        () => update((d) => ({ ...d, tasks: [next, ...d.tasks] })),
        async () => {
          const result = await unwrap(apiClient.post("/api/tasks", next));
          update((d) => ({ ...d, tasks: [normalizeTask(result.task), ...d.tasks] }));
        },
        "Task created"
      );
    },
    async updateTask(id, patch) {
      const payload = {
        ...patch,
        urgent: patch.urgent ?? (patch.priority === "urgent" ? true : undefined),
      };
      await withApi(
        () => update((d) => ({ ...d, tasks: d.tasks.map((task) => (task.id === id ? { ...task, ...payload, updatedAt: new Date().toISOString() } : task)) })),
        async () => {
          const result = await unwrap(apiClient.patch(`/api/tasks/${id}`, payload));
          update((d) => ({ ...d, tasks: d.tasks.map((task) => (task.id === id ? normalizeTask(result.task) : task)) }));
        }
      );
    },
    async deleteTask(id) {
      await withApi(
        () => update((d) => ({ ...d, tasks: d.tasks.filter((task) => task.id !== id) })),
        async () => {
          await unwrap(apiClient.delete(`/api/tasks/${id}`));
          update((d) => ({ ...d, tasks: d.tasks.filter((task) => task.id !== id), reminders: d.reminders.filter((r) => r.targetId !== id) }));
        },
        "Task deleted"
      );
    },
    async createHabit(habit) {
      const next = { id: uid(), name: habit.name.trim(), color: habit.color || gold, completions: [], archived: false, reminderAt: habit.reminderAt || "", reminderOffsets: habit.reminderOffsets || [], reminderChannels: habit.reminderChannels || [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      await withApi(
        () => update((d) => ({ ...d, habits: [next, ...d.habits] })),
        async () => {
          const result = await unwrap(apiClient.post("/api/habits", next));
          update((d) => ({ ...d, habits: [normalizeHabit(result.habit), ...d.habits] }));
        },
        "Habit created"
      );
    },
    async toggleHabit(id, date = todayKey()) {
      await withApi(
        () => update((d) => ({
          ...d,
          habits: d.habits.map((habit) => {
            if (habit.id !== id) return habit;
            const exists = habit.completions.includes(date);
            return { ...habit, completions: exists ? habit.completions.filter((item) => item !== date) : [...habit.completions, date], updatedAt: new Date().toISOString() };
          }),
        })),
        async () => {
          const result = await unwrap(apiClient.post(`/api/habits/${id}/toggle-today`));
          update((d) => ({ ...d, habits: d.habits.map((habit) => (habit.id === id ? normalizeHabit(result.habit) : habit)) }));
        }
      );
    },
    async deleteHabit(id) {
      await withApi(
        () => update((d) => ({ ...d, habits: d.habits.filter((habit) => habit.id !== id) })),
        async () => {
          await unwrap(apiClient.delete(`/api/habits/${id}`));
          update((d) => ({ ...d, habits: d.habits.filter((habit) => habit.id !== id), reminders: d.reminders.filter((r) => r.targetId !== id) }));
        },
        "Habit deleted"
      );
    },
    async createTag(tag) {
      const next = { id: uid(), name: tag.name.trim(), color: tag.color || gold, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      await withApi(
        () => update((d) => ({ ...d, tags: [next, ...d.tags] })),
        async () => {
          const result = await unwrap(apiClient.post("/api/tags", next));
          update((d) => ({ ...d, tags: [result.tag, ...d.tags] }));
        },
        "Tag created"
      );
    },
    async deleteTag(id) {
      await withApi(
        () => update((d) => ({ ...d, tags: d.tags.filter((tag) => tag.id !== id) })),
        async () => {
          await unwrap(apiClient.delete(`/api/tags/${id}`));
          update((d) => ({ ...d, tags: d.tags.filter((tag) => tag.id !== id) }));
        },
        "Tag deleted"
      );
    },
    async createSession(session) {
      const next = { id: uid(), ...session, completedAt: new Date().toISOString(), createdAt: new Date().toISOString() };
      await withApi(
        () => update((d) => ({ ...d, sessions: [next, ...d.sessions] })),
        async () => {
          const result = await unwrap(apiClient.post("/api/focus-sessions", { ...session, durationMinutes: session.minutes || session.durationMinutes }));
          update((d) => ({ ...d, sessions: [normalizeSession(result.session), ...d.sessions] }));
        },
        "Focus session saved"
      );
    },
    async updateSettings(patch) {
      await withApi(
        () => update((d) => ({ ...d, settings: { ...(d.settings || {}), ...patch } })),
        async () => {
          const result = await unwrap(apiClient.patch("/api/settings", patch));
          update((d) => ({ ...d, settings: result.settings }));
        },
        "Settings saved"
      );
    },
    async createReminder(payload) {
      await withApi(
        null,
        async () => {
          const result = await unwrap(apiClient.post("/api/reminders", payload));
          update((d) => ({ ...d, reminders: [result.reminder, ...(d.reminders || []).filter((r) => r.id !== result.reminder.id)] }));
        },
        "Reminder saved"
      );
    },
    async testEmail() {
      await withApi(null, () => unwrap(apiClient.post("/api/reminders/test-email", data.settings || {})), "Test email sent");
    },
    async testPush(subscription) {
      if (subscription) {
        await withApi(null, () => unwrap(apiClient.post("/api/push/subscribe", subscription)), "Push notifications enabled");
      }
      await withApi(null, () => unwrap(apiClient.post("/api/push/test")), "Test push sent");
    },
    async disablePush(endpoint) {
      await withApi(null, () => unwrap(apiClient.delete("/api/push/unsubscribe", { data: { endpoint } })), "Push notifications disabled");
    },
  };
}

function extractBacklinks(content) {
  return [...content.matchAll(/\[\[([^\]]+)\]\]/g)].map((match) => match[1].trim()).filter(Boolean);
}

function Button({ children, variant = "primary", className = "", ...props }) {
  return (
    <button
      className={cls(
        "inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-bold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-[var(--gold)] text-[#111] hover:bg-[var(--gold-hover)]",
        variant === "secondary" && "border border-[var(--border)] bg-[var(--card)] text-[var(--text)] hover:border-[var(--gold)]/50",
        variant === "ghost" && "text-[var(--muted)] hover:bg-white/5 hover:text-[var(--text)]",
        variant === "danger" && "border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/15",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function Card({ children, className = "" }) {
  return <section className={cls("rounded-2xl border border-[var(--border)] bg-[var(--card)]", className)}>{children}</section>;
}

function Input({ className = "", ...props }) {
  return <input className={cls("h-11 min-w-0 max-w-full rounded-lg border border-[var(--border)] bg-[var(--elevated)] px-4 text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--gold)]", className)} {...props} />;
}

function Textarea({ className = "", ...props }) {
  return <textarea className={cls("min-h-36 min-w-0 max-w-full rounded-lg border border-[var(--border)] bg-[var(--elevated)] px-4 py-3 text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--gold)]", className)} {...props} />;
}

function Select({ className = "", ...props }) {
  return <select className={cls("h-11 min-w-0 max-w-full rounded-lg border border-[var(--border)] bg-[var(--elevated)] px-4 text-[var(--text)] outline-none focus:border-[var(--gold)]", className)} {...props} />;
}

function ColorSwatch({ color, selected, size = "h-8 w-8", onClick }) {
  return (
    <button
      type="button"
      aria-label={`Select ${color}`}
      aria-pressed={selected}
      onClick={onClick}
      className={cls(
        "relative grid shrink-0 place-items-center rounded-full transition",
        size,
        selected && "ring-2 ring-[var(--gold)] ring-offset-2 ring-offset-[var(--app-bg)]"
      )}
      style={{ background: color }}
    >
      {selected && <FiCheck className="h-4 w-4 text-black drop-shadow-[0_1px_1px_rgba(255,255,255,0.65)]" />}
    </button>
  );
}

function ReminderControls({ value, onChange, label = "Reminder" }) {
  const current = {
    reminderAt: value.reminderAt || "",
    reminderOffsets: value.reminderOffsets || [],
    reminderChannels: value.reminderChannels || [],
  };
  const set = (patch) => onChange({ ...current, ...patch });
  const toggle = (field, item) => {
    const list = current[field] || [];
    set({ [field]: list.includes(item) ? list.filter((value) => value !== item) : [...list, item] });
  };
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--elevated)] p-4">
      <label className="block text-sm font-black uppercase tracking-[0.14em] text-[var(--secondary)]">{label}</label>
      <Input
        className="mt-3 w-full"
        type="datetime-local"
        value={current.reminderAt}
        onChange={(event) => set({ reminderAt: event.target.value })}
      />
      <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
        <div className="min-w-0">
          <p className="mb-2 text-sm font-bold text-[var(--secondary)]">Timing</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {[30, 5, 1, 0].map((offset) => (
              <label key={offset} className="inline-flex items-center gap-2 text-sm text-[var(--secondary)]">
                <input type="checkbox" checked={current.reminderOffsets.includes(offset)} onChange={() => toggle("reminderOffsets", offset)} />
                {offset === 0 ? "At due time" : `${offset} min before`}
              </label>
            ))}
          </div>
        </div>
        <div className="min-w-0">
          <p className="mb-2 text-sm font-bold text-[var(--secondary)]">Channels</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {["push", "email"].map((channel) => (
              <label key={channel} className="inline-flex items-center gap-2 text-sm text-[var(--secondary)]">
                <input type="checkbox" checked={current.reminderChannels.includes(channel)} onChange={() => toggle("reminderChannels", channel)} />
                {channel}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MarkdownPreview({ content }) {
  const html = escapeHtml(content || "")
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/^- (.*)$/gm, "<li>$1</li>")
    .replace(/\n/g, "<br />");
  return (
    <div
      className="max-w-none rounded-lg border border-[var(--border)] bg-[var(--elevated)] p-4 text-[var(--secondary)]"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function PageHeader({ title, subtitle, action, meta }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <h1 className="break-words text-[32px] font-black leading-none tracking-[-0.03em] text-[var(--text)] sm:text-[38px]">{title}</h1>
        {subtitle && <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--secondary)] sm:text-xl">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-3">{meta}{action}</div>
    </div>
  );
}

function EmptyState({ icon: Icon = FiZap, title, text, className = "" }) {
  return (
    <div className={cls("grid min-h-64 place-items-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--elevated)] text-center", className)}>
      <div>
        <Icon className="mx-auto mb-5 text-5xl text-[var(--gold)]/60" />
        <h3 className="text-2xl font-black text-[var(--text)]">{title}</h3>
        <p className="mt-2 text-lg text-[var(--secondary)]">{text}</p>
      </div>
    </div>
  );
}

function MiniLineChart({ data, height = 210, labels = true }) {
  const max = Math.max(4, ...data.map((d) => d.value));
  const points = data.map((d, i) => {
    const x = 44 + (i * (100 - 52)) / Math.max(1, data.length - 1);
    const y = 10 + (1 - d.value / max) * (height - 42);
    return `${x},${y}`;
  });
  return (
    <svg viewBox={`0 0 100 ${height}`} className="h-full w-full overflow-visible">
      {[0, 1, 2, 3, 4].map((n) => {
        const y = 10 + (n * (height - 42)) / 4;
        return <line key={n} x1="44" x2="96" y1={y} y2={y} stroke="var(--grid)" strokeDasharray="2 2" />;
      })}
      <line x1="44" x2="44" y1="10" y2={height - 32} stroke="#858585" />
      <line x1="44" x2="96" y1={height - 32} y2={height - 32} stroke="#858585" />
      <polyline fill="none" stroke="var(--gold)" strokeWidth="0.7" points={points.join(" ")} />
      <polygon points={`${points.join(" ")} 96,${height - 32} 44,${height - 32}`} fill="url(#goldFade)" opacity="0.35" />
      <defs>
        <linearGradient id="goldFade" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="var(--gold)" stopOpacity="0.7" />
          <stop offset="1" stopColor="var(--gold)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[4, 3, 2, 1, 0].map((value, i) => <text key={value} x="38" y={10 + (i * (height - 42)) / 4 + 4} fill="var(--muted)" fontSize="4">{value}</text>)}
      {labels && data.map((d, i) => <text key={d.label} x={44 + (i * (100 - 52)) / Math.max(1, data.length - 1)} y={height - 22} textAnchor="middle" fill="var(--muted)" fontSize="4">{d.label}</text>)}
    </svg>
  );
}

function useStats(data) {
  return useMemo(() => {
    const now = new Date();
    const key = todayKey();
    const weekStart = new Date();
    weekStart.setDate(now.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);
    const activeTasks = data.tasks.filter((task) => task.status !== "archived");
    const dueToday = activeTasks.filter((task) => task.dueDate === key && task.status !== "done");
    const overdue = activeTasks.filter((task) => task.dueDate && task.dueDate < key && task.status !== "done");
    const completedThisWeek = activeTasks.filter((task) => task.status === "done" && new Date(task.updatedAt) >= weekStart);
    const week = Array.from({ length: 7 }, (_, index) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + index);
      const day = d.toISOString().slice(0, 10);
      return {
        date: day,
        label: d.toLocaleDateString("en", { weekday: "short" }),
        value: activeTasks.filter((task) => task.status === "done" && task.updatedAt?.slice(0, 10) === day).length,
      };
    });
    const focusWeek = Array.from({ length: 7 }, (_, index) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + index);
      const day = d.toISOString().slice(0, 10);
      return {
        date: day,
        label: d.toLocaleDateString("en", { weekday: "short" }),
        value: data.sessions.filter((session) => session.completedAt?.slice(0, 10) === day).reduce((sum, item) => sum + item.minutes, 0),
      };
    });
    const focusToday = data.sessions.filter((session) => session.completedAt?.slice(0, 10) === key).reduce((sum, item) => sum + item.minutes, 0);
    const focusThisWeek = data.sessions.filter((session) => new Date(session.completedAt) >= weekStart).reduce((sum, item) => sum + item.minutes, 0);
    const byStatus = {
      todo: activeTasks.filter((task) => task.status === "todo").length,
      doing: activeTasks.filter((task) => task.status === "doing").length,
      done: activeTasks.filter((task) => task.status === "done").length,
    };
    const urgentOpen = activeTasks.filter((task) => task.priority === "urgent" && task.status !== "done").length;
    const score = Math.min(100, Math.round(byStatus.done * 30 + completedThisWeek.length * 10 + focusThisWeek / 5));
    return { dueToday, overdue, completedThisWeek, week, focusWeek, focusToday, focusThisWeek, byStatus, urgentOpen, score };
  }, [data.tasks, data.sessions]);
}

function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-hidden bg-black/70 p-2 backdrop-blur-sm sm:p-4" onMouseDown={onClose}>
      <div className="flex max-h-[calc(100dvh-1rem)] w-full max-w-[min(48rem,calc(100vw-1rem))] flex-col overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--card)] shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-[28px]" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-[var(--border)] px-5 py-4 sm:px-7 sm:py-5">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold)]">TaskNote</p>
            <h2 className="mt-2 truncate text-2xl font-black">{title}</h2>
          </div>
          <Button variant="secondary" className="h-11 w-11 shrink-0 rounded-full p-0 sm:h-12 sm:w-12" onClick={onClose}><FiX /></Button>
        </div>
        <div className="min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-7">{children}</div>
      </div>
    </div>
  );
}

function NoteForm({ note, onSave, onDelete, onClose }) {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [pinned, setPinned] = useState(Boolean(note?.pinned));
  const [template, setTemplate] = useState(note?.template || "");
  const [preview, setPreview] = useState(false);
  const [reminder, setReminder] = useState({
    reminderAt: note?.reminderAt || "",
    reminderOffsets: note?.reminderOffsets || [30, 5, 1],
    reminderChannels: note?.reminderChannels || [],
  });
  const applyTemplate = (value) => {
    setTemplate(value);
    if (content.trim()) return;
    const templates = {
      meeting: "# Meeting notes\n\n## Attendees\n\n## Decisions\n\n## Action items",
      journal: "# Daily journal\n\n## Wins\n\n## Notes\n\n## Tomorrow",
      study: "# Study notes\n\n## Topic\n\n## Key ideas\n\n## Questions",
      project: "# Project plan\n\n## Goal\n\n## Milestones\n\n## Risks",
      bug: "# Bug report\n\n## Expected\n\n## Actual\n\n## Steps",
      ideas: "# Ideas\n\n- ",
      weekly: "# Weekly review\n\n## Wins\n\n## Lessons\n\n## Next week",
    };
    if (templates[value]) setContent(templates[value]);
  };
  return (
    <form className="min-w-0 space-y-4" onSubmit={(event) => { event.preventDefault(); if (!title.trim()) return toast.error("Title is required"); onSave({ title, content, pinned, template, ...reminder }); onClose(); }}>
      <label className="block text-sm font-bold text-[var(--secondary)]">Note title</label>
      <Input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Capture an idea..." className="w-full" />
      <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <Select value={template} onChange={(event) => applyTemplate(event.target.value)}>
          <option value="">Blank note</option>
          <option value="meeting">Meeting notes</option>
          <option value="journal">Daily journal</option>
          <option value="study">Study notes</option>
          <option value="project">Project plan</option>
          <option value="bug">Bug report</option>
          <option value="ideas">Ideas list</option>
          <option value="weekly">Weekly review</option>
        </Select>
        <Button type="button" variant="secondary" onClick={() => setPreview((value) => !value)}>{preview ? "Edit" : "Preview"}</Button>
      </div>
      <label className="block text-sm font-bold text-[var(--secondary)]">Content</label>
      {preview ? <MarkdownPreview content={content} /> : <Textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="Write with Markdown or link notes using [[note title]]..." className="w-full" />}
      <label className="flex items-center gap-3 text-sm font-bold text-[var(--secondary)]"><input type="checkbox" checked={pinned} onChange={(event) => setPinned(event.target.checked)} /> Pin note</label>
      <ReminderControls value={reminder} onChange={setReminder} label="Revisit reminder" />
      <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:justify-between">
        {note ? <Button type="button" variant="danger" onClick={() => { onDelete(note.id); onClose(); }}><FiTrash2 /> Delete</Button> : <span />}
        <div className="flex flex-col gap-3 sm:flex-row"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit"><FiCheck /> Save</Button></div>
      </div>
    </form>
  );
}

function TaskForm({ task, onSave, onDelete, onClose }) {
  const [form, setForm] = useState({ title: task?.title || "", description: task?.description || "", status: task?.status || "todo", priority: task?.priority || "medium", dueDate: task?.dueDate || "", important: Boolean(task?.important), urgent: Boolean(task?.urgent), estimatedMinutes: task?.estimatedMinutes || 25, recurringRule: task?.recurringRule || "", subtasksText: (task?.subtasks || []).map((item) => item.title || item).join("\n"), dependenciesText: (task?.dependencies || []).join(", "), reminderAt: task?.reminderAt || "", reminderOffsets: task?.reminderOffsets || [30, 5, 1], reminderChannels: task?.reminderChannels || [] });
  const set = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const payload = () => ({
    ...form,
    estimatedMinutes: Number(form.estimatedMinutes || 0),
    subtasks: form.subtasksText.split("\n").map((title) => title.trim()).filter(Boolean).map((title) => ({ title, done: false })),
    dependencies: form.dependenciesText.split(",").map((item) => item.trim()).filter(Boolean),
  });
  return (
    <form className="min-w-0 space-y-4" onSubmit={(event) => { event.preventDefault(); if (!form.title.trim()) return toast.error("Task title is required"); onSave(payload()); onClose(); }}>
      <Input autoFocus value={form.title} onChange={(event) => set("title", event.target.value)} placeholder="Task title" className="w-full" />
      <Textarea value={form.description} onChange={(event) => set("description", event.target.value)} placeholder="Description" className="w-full" />
      <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select value={form.status} onChange={(event) => set("status", event.target.value)}><option value="todo">todo</option><option value="doing">doing</option><option value="done">done</option></Select>
        <Select value={form.priority} onChange={(event) => set("priority", event.target.value)}><option value="low">low</option><option value="medium">medium</option><option value="high">high</option><option value="urgent">urgent</option></Select>
        <Input type="date" value={form.dueDate} onChange={(event) => set("dueDate", event.target.value)} />
        <Input type="number" min="1" value={form.estimatedMinutes} onChange={(event) => set("estimatedMinutes", event.target.value)} placeholder="Estimate" />
      </div>
      <div className="grid min-w-0 gap-3 sm:grid-cols-2">
        <Textarea value={form.subtasksText} onChange={(event) => set("subtasksText", event.target.value)} placeholder="Subtasks, one per line" className="min-h-24" />
        <div className="min-w-0 space-y-3">
          <Input value={form.dependenciesText} onChange={(event) => set("dependenciesText", event.target.value)} placeholder="Blocked by task IDs, comma separated" className="w-full" />
          <Select value={form.recurringRule} onChange={(event) => set("recurringRule", event.target.value)}>
            <option value="">No recurring</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </Select>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold text-[var(--secondary)]">
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.important} onChange={(event) => set("important", event.target.checked)} /> Important</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.urgent} onChange={(event) => set("urgent", event.target.checked)} /> Urgent</label>
      </div>
      <ReminderControls value={form} onChange={(next) => setForm((current) => ({ ...current, ...next }))} />
      <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:justify-between">
        {task ? <Button type="button" variant="danger" onClick={() => { onDelete(task.id); onClose(); }}><FiTrash2 /> Delete</Button> : <span />}
        <div className="flex flex-col gap-3 sm:flex-row"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit"><FiCheck /> Save</Button></div>
      </div>
    </form>
  );
}

function Sidebar({ user, openQuickAdd }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const displayName = user?.name || user?.email?.split("@")[0] || "TaskNote User";
  const email = user?.email || "";

  const handleSignOut = async () => {
    Object.keys(localStorage)
      .filter((key) => key.startsWith("tasknote.workspace."))
      .forEach((key) => localStorage.removeItem(key));
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col overflow-y-auto border-r border-[var(--border)] bg-[var(--sidebar)] px-4 py-4 lg:flex">
      <Link to="/dashboard" className="flex items-center gap-3 text-[25px] font-black text-[var(--gold)]">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--gold)] text-[#0b0b0b]"><FiCheckSquare /></span>
        TaskNote
      </Link>
      <button onClick={openQuickAdd} className="mt-8 flex h-10 items-center justify-between rounded-lg border border-[var(--gold)]/30 bg-[var(--gold-bg)] px-4 text-left font-black text-[var(--gold)] transition hover:border-[var(--gold)]/60">
        <span className="flex items-center gap-3"><FiPlus /> Quick Add</span>
        <kbd className="rounded-md bg-[var(--elevated)] px-2 py-1 text-xs text-[var(--secondary)]">⌘ K</kbd>
      </button>
      <nav className="mt-8 flex flex-1 flex-col gap-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => cls("flex h-10 items-center gap-3 rounded-lg px-4 text-base font-bold transition", isActive ? "bg-[var(--gold-bg)] text-[var(--gold)]" : "text-[var(--muted)] hover:bg-white/[0.04] hover:text-[var(--text)]")}>
              <Icon className="text-lg" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="mt-5 border-t border-[var(--border)] pt-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--gold-bg)] text-sm font-black uppercase text-[var(--gold)]">
            {displayName.slice(0, 1)}
          </div>
          <div className="min-w-0">
            <p className="truncate font-black text-[var(--text)]">{displayName}</p>
            <p className="truncate text-sm text-[var(--muted)]">{email}</p>
          </div>
        </div>
        <NavLink to="/settings" className={({ isActive }) => cls("mb-2 flex h-10 items-center gap-3 rounded-lg px-4 text-base font-bold", isActive ? "bg-[var(--gold-bg)] text-[var(--gold)]" : "text-[var(--muted)] hover:bg-white/[0.04]")}><FiSettings /> Settings</NavLink>
        <button onClick={handleSignOut} className="flex h-10 w-full items-center gap-3 rounded-lg px-4 text-base font-bold text-[var(--muted)] hover:bg-white/[0.04]"><FiLogOut /> Sign out</button>
      </div>
    </aside>
  );
}

function MobileNav({ openQuickAdd }) {
  const mobileItems = [navItems[0], navItems[1], navItems[2], navItems[4]];
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--sidebar)] px-4 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2 lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 items-center gap-2">
        {mobileItems.slice(0, 2).map((item) => <NavLink key={item.to} to={item.to} className={({ isActive }) => cls("grid h-11 place-items-center rounded-xl", isActive ? "bg-[var(--gold-bg)] text-[var(--gold)]" : "text-[var(--muted)]")}><item.icon /></NavLink>)}
        <button aria-label="Quick Add" onClick={openQuickAdd} className="mx-auto -mt-7 grid h-16 w-16 place-items-center rounded-full border-4 border-[var(--app-bg)] bg-[var(--gold)] text-2xl text-black shadow-xl shadow-black/50"><FiPlus /></button>
        {mobileItems.slice(2).map((item) => <NavLink key={item.to} to={item.to} className={({ isActive }) => cls("grid h-11 place-items-center rounded-xl", isActive ? "bg-[var(--gold-bg)] text-[var(--gold)]" : "text-[var(--muted)]")}><item.icon /></NavLink>)}
      </div>
    </div>
  );
}

function CommandPalette({ open, onClose, openNote, openTask }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const input = useRef(null);
  useEffect(() => { if (open) setTimeout(() => input.current?.focus(), 20); }, [open]);
  useEffect(() => {
    const handler = (event) => {
      if (event.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);
  if (!open) return null;
  const actions = [
    { section: "Create", label: "New Task", icon: FiCheckSquare, run: openTask },
    { section: "Create", label: "New Note", icon: FiFileText, run: openNote },
    { section: "Create", label: "Start Focus Session", icon: FiClock, run: () => navigate("/focus") },
    ...navItems.map((item) => ({ section: "Go to", label: item.label === "Board" ? "Kanban Board" : item.label, icon: item.icon, run: () => navigate(item.to) })),
    { section: "Go to", label: "Settings", icon: FiSettings, run: () => navigate("/settings") },
  ].filter((item) => item.label.toLowerCase().includes(query.toLowerCase()) || !query);
  return (
    <div className="fixed inset-0 z-50 bg-black/60 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div className="mx-auto mt-14 max-h-[78vh] w-full max-w-[640px] overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--text)] shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex h-16 items-center gap-3 border-b border-[var(--border)] px-4">
          <FiSearch className="text-2xl text-[var(--muted)]" />
          <input ref={input} value={query} onChange={(event) => setQuery(event.target.value)} className="h-full flex-1 bg-transparent text-xl outline-none placeholder:text-[var(--muted)]" placeholder="Search or try filters: type:task tag:work priority:high due:today" />
          <button onClick={onClose} className="text-2xl text-[var(--muted)]"><FiX /></button>
        </div>
        <div className="max-h-[calc(78vh-64px)] overflow-y-auto p-3">
          {["Create", "Go to"].map((section) => (
            <div key={section} className="border-b border-[var(--border)] py-2 last:border-0">
              <p className="px-2 py-2 text-sm font-bold text-[var(--muted)]">{section}</p>
              {actions.filter((item) => item.section === section).map((item, index) => {
                const Icon = item.icon;
                return <button key={item.label} onClick={() => { item.run(); onClose(); }} className={cls("flex h-14 w-full items-center gap-4 rounded-md px-3 text-left text-lg font-bold transition hover:bg-[var(--gold-bg)]", index === 0 && section === "Create" && "bg-[var(--gold-bg)] text-[var(--gold)]")}><Icon className="text-2xl" /> {item.label}</button>;
              })}
            </div>
          ))}
          <div className="p-2 text-sm text-[var(--muted)]">Try: <kbd>type:task</kbd> <kbd>due:today</kbd> <kbd>priority:high</kbd> <kbd>tag:work</kbd></div>
        </div>
      </div>
    </div>
  );
}

function DashboardPage({ data, stats }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning." : hour < 18 ? "Good afternoon." : "Good evening.";
  const date = new Date().toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" });
  const statCards = [
    ["Due Today", stats.dueToday.length, "", FiClock],
    ["Overdue", stats.overdue.length, stats.overdue.length ? "needs attention" : "all clear", FiZap],
    ["Completed Today", data.tasks.filter((task) => task.status === "done" && task.updatedAt?.slice(0, 10) === todayKey()).length, `${stats.completedThisWeek.length} this week`, FiCheck],
    ["Focus Today", `${stats.focusToday}m`, `${stats.focusThisWeek}m this week`, FiClock],
  ];
  const recent = [...data.notes.map((item) => ({ type: "note", title: item.title, date: item.updatedAt })), ...data.tasks.map((item) => ({ type: "task", title: item.title, date: item.updatedAt }))].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4);
  const upcomingReminders = (data.reminders || [])
    .filter((reminder) => reminder.status !== "cancelled" && new Date(reminder.dueAt) >= new Date())
    .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt))
    .slice(0, 3);
  return (
    <>
      <PageHeader title={greeting} subtitle={date} meta={<span className="hidden items-center gap-2 text-lg font-black text-[var(--text)] lg:flex"><FiZap className="text-[var(--gold)]" /> 1-day streak</span>} />
      <div className="grid gap-5 xl:grid-cols-4">
        {statCards.map(([label, value, sub, Icon]) => (
          <Card key={label} className="flex min-h-36 items-start justify-between p-6">
            <div><p className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--secondary)]">{label}</p><strong className="mt-3 block text-4xl font-black">{value}</strong>{sub && <p className="mt-2 text-sm text-[var(--secondary)]">{sub}</p>}</div>
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-white/7 text-2xl text-[var(--muted)]"><Icon /></span>
          </Card>
        ))}
      </div>
      <div className="mt-7 grid gap-7 xl:grid-cols-[2fr_0.96fr]">
        <Card className="h-[382px] p-8"><h2 className="text-xl font-black">This Week</h2><div className="mt-2 h-[290px]"><MiniLineChart data={stats.week} height={180} /></div></Card>
        <Card className="grid h-[382px] place-items-center p-8">
          <div className="w-full"><h2 className="mb-7 text-xl font-black">Productivity</h2><div className="mx-auto grid h-44 w-44 place-items-center rounded-full border-[14px] border-white/7"><div className="text-center"><strong className="text-5xl font-black">{stats.score}</strong><p className="text-sm uppercase tracking-widest text-[var(--muted)]">Score</p></div></div><div className="mt-9 grid grid-cols-3 text-center"><strong className="text-2xl">{stats.byStatus.todo}</strong><strong className="text-2xl">{stats.byStatus.doing}</strong><strong className="text-2xl">{stats.byStatus.done}</strong><span className="text-xs uppercase text-[var(--secondary)]">todo</span><span className="text-xs uppercase text-[var(--secondary)]">doing</span><span className="text-xs uppercase text-[var(--secondary)]">done</span></div></div>
        </Card>
      </div>
      <div className="mt-7 grid gap-7 xl:grid-cols-[2fr_0.96fr]">
        <Card className="grid min-h-80 p-8"><div className="flex justify-between"><h2 className="text-xl font-black">Today&apos;s Focus</h2><Link className="font-black" to="/focus">View all</Link></div><div className="grid place-items-center text-center"><FiCheck className="mb-4 rounded-full border-4 border-[var(--gold)]/40 p-2 text-5xl text-[var(--gold)]/70" /><h3 className="text-xl font-black">All clear.</h3><p className="text-[var(--secondary)]">Nothing waiting on your attention.</p></div></Card>
        <Card className="p-8"><h2 className="mb-5 text-xl font-black">Upcoming Reminders</h2><div className="space-y-4">{upcomingReminders.length ? upcomingReminders.map((item) => <div key={item.id} className="flex gap-4"><span className="mt-1 grid h-6 w-6 place-items-center rounded-full bg-[var(--gold-bg)] text-[var(--gold)]"><FiClock /></span><div><p className="font-black">{item.title}</p><p className="text-sm text-[var(--secondary)]">{new Date(item.dueAt).toLocaleString()} · {(item.channels || []).join(" + ")}</p></div></div>) : <p className="text-[var(--secondary)]">No upcoming reminders.</p>}</div></Card>
      </div>
      <div className="mt-7 grid gap-7 xl:grid-cols-[2fr_0.96fr]">
        <Card className="p-8"><h2 className="mb-5 text-xl font-black">Recent Activity</h2><div className="space-y-4">{recent.map((item, index) => <div key={`${item.title}-${index}`} className="flex gap-4"><span className="mt-1 h-5 w-5 rounded-full border border-[var(--gold)]" /><div><p className="font-black">{item.title}</p><p className="text-sm text-[var(--secondary)]">{timeAgo(item.date)}</p></div></div>)}</div></Card>
        <Card className="p-8"><h2 className="mb-5 text-xl font-black">Productivity Insight</h2><p className="text-[var(--secondary)]">{stats.overdue.length ? `${stats.overdue.length} overdue task${stats.overdue.length === 1 ? "" : "s"} need attention before your next deep-work block.` : "Your overdue list is clear. Protect one focused block today."}</p></Card>
      </div>
      <div className="mt-7 grid gap-5 xl:grid-cols-4">
        {[["Notes", data.notes.length, `${data.notes.filter((n) => n.pinned).length} pinned`, FiFileText], ["Week Velocity", stats.completedThisWeek.length, "", FiActivity], ["Done", stats.byStatus.done, "", FiCheck], ["Urgent Open", stats.urgentOpen, "", FiZap]].map(([label, value, sub, Icon]) => <Card key={label} className="flex min-h-36 items-start justify-between p-6"><div><p className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--secondary)]">{label}</p><strong className="mt-3 block text-4xl font-black">{value}</strong><p className="text-sm text-[var(--secondary)]">{sub}</p></div><span className="grid h-12 w-12 place-items-center rounded-xl bg-white/7 text-2xl text-[var(--muted)]"><Icon /></span></Card>)}
      </div>
    </>
  );
}

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days} days ago`;
  const hours = Math.max(1, Math.floor(diff / 3600000));
  return `about ${hours} hours ago`;
}

function NotesPage({ data, openNote }) {
  const [query, setQuery] = useState("");
  const notes = data.notes.filter((note) => [note.title, note.content].join(" ").toLowerCase().includes(query.toLowerCase()));
  const pinned = notes.filter((note) => note.pinned);
  const all = notes.filter((note) => !note.pinned);
  const NoteCard = ({ note }) => (
    <button onClick={() => openNote(note)} className="w-full max-w-[412px] rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-left transition hover:border-[var(--gold)]/45" style={{ borderColor: note.color ? `${note.color}99` : undefined }}>
      <h3 className="text-xl font-black">{note.title}</h3>
      {note.reminderAt && <span className="mt-3 inline-flex items-center gap-2 rounded-md border border-[var(--gold)]/35 bg-[var(--gold-bg)] px-2 py-1 text-xs font-bold text-[var(--gold)]"><FiClock /> Reminder</span>}
      <p className="mt-5 whitespace-pre-line text-lg leading-7 text-[var(--secondary)] line-clamp-4">{note.content}</p>
      <p className="mt-4 text-right text-xs text-[var(--secondary)]">{timeAgo(note.updatedAt)}</p>
    </button>
  );
  return (
    <>
      <PageHeader title="Notes" subtitle="Capture, refine, and revisit your thinking." action={<Button onClick={() => openNote(null)}><FiPlus /> New Note</Button>} />
      <div className="relative mb-8 max-w-xl"><FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search notes..." className="w-full pl-11" /></div>
      <Section title="Pinned">{pinned.length ? pinned.map((note) => <NoteCard key={note.id} note={note} />) : <p className="text-[var(--muted)]">No pinned notes.</p>}</Section>
      <Section title="All Notes">{all.length ? all.map((note) => <NoteCard key={note.id} note={note} />) : <EmptyState icon={FiFileText} title="No notes yet." text="Create your first note to start capturing ideas." className="max-w-3xl" />}</Section>
    </>
  );
}

function Section({ title, children }) {
  return <section className="mb-10"><h2 className="mb-4 text-sm font-bold uppercase tracking-[0.14em] text-[var(--secondary)]">{title}</h2><div className="flex flex-wrap gap-5">{children}</div></section>;
}

function PriorityBadge({ priority }) {
  const style = priority === "urgent" ? "border-red-500/35 bg-red-500/15 text-red-300" : priority === "high" ? "border-orange-500/35 bg-orange-500/15 text-orange-200" : "border-[var(--border)] bg-white/5 text-[var(--secondary)]";
  return <span className={cls("rounded-md border px-3 py-1 text-sm font-black", style)}>{priority}</span>;
}

function TaskRow({ task, updateTask, openTask }) {
  return (
    <Card className="grid min-h-[84px] gap-4 p-4 sm:flex sm:items-center sm:gap-5 sm:p-5">
      <div className="grid grid-cols-[28px_minmax(0,1fr)] items-start gap-3 sm:flex sm:min-w-0 sm:flex-1 sm:items-center sm:gap-5">
        <button onClick={() => updateTask(task.id, { status: task.status === "done" ? "todo" : "done" })} className={cls("mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 sm:mt-0", task.status === "done" ? "border-emerald-400 text-emerald-400" : "border-[var(--muted)]")}>{task.status === "done" && <FiCheck />}</button>
        <button onClick={() => openTask(task)} className="min-w-0 text-left sm:flex-1"><p className={cls("truncate text-base font-black sm:text-lg", task.status === "done" && "line-through text-[var(--muted)]")}>{task.title}</p><p className="text-sm text-[var(--secondary)]">{formatDate(task.dueDate)} {task.reminderAt && "· reminder"} {task.dependencies?.length ? "· blocked" : ""}</p></button>
      </div>
      <div className="ml-10 flex min-w-0 flex-wrap items-center gap-2 sm:ml-0 sm:flex-nowrap">
        <Select value={task.status} onChange={(event) => updateTask(task.id, { status: event.target.value })} className="h-10 w-[116px] min-w-0 px-3 text-sm"><option value="todo">todo</option><option value="doing">doing</option><option value="done">done</option></Select>
        <PriorityBadge priority={task.priority} />
      </div>
    </Card>
  );
}

function TasksPage({ data, updateTask, openTask }) {
  const [view, setView] = useState("list");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const tasks = data.tasks.filter((task) => task.title.toLowerCase().includes(query.toLowerCase()) && (status === "all" || task.status === status) && (priority === "all" || task.priority === priority));
  return (
    <>
      <PageHeader title="Tasks" subtitle={`${tasks.length} task${tasks.length === 1 ? "" : "s"} in view.`} action={<><div className="flex rounded-lg border border-[var(--border)] bg-[var(--card)] p-1"><button onClick={() => setView("list")} className={cls("flex h-10 items-center gap-2 rounded-md px-4 font-black", view === "list" && "bg-white/10")}><FiBarChart2 /> List</button><button onClick={() => setView("matrix")} className={cls("flex h-10 items-center gap-2 rounded-md px-4 font-black", view === "matrix" && "bg-white/10")}><FiGrid /> Matrix</button></div><Button onClick={() => openTask(null)} className="w-fit"><FiPlus /> New Task</Button></>} />
      <div className="mb-8 grid gap-3 xl:grid-cols-[1fr_176px_176px]"><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks..." /><Select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All status</option><option value="todo">todo</option><option value="doing">doing</option><option value="done">done</option></Select><Select value={priority} onChange={(event) => setPriority(event.target.value)}><option value="all">All priority</option><option value="low">low</option><option value="medium">medium</option><option value="high">high</option><option value="urgent">urgent</option></Select></div>
      {view === "list" ? <TaskList tasks={tasks} updateTask={updateTask} openTask={openTask} /> : <Matrix tasks={tasks} openTask={openTask} />}
    </>
  );
}

function TaskList({ tasks, updateTask, openTask }) {
  return <div className="space-y-7">{["todo", "doing", "done"].map((status) => { const group = tasks.filter((task) => task.status === status); return group.length ? <section key={status}><h2 className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-[var(--secondary)]">{status} <span className="ml-2">{group.length}</span></h2><div className="space-y-3">{group.map((task) => <TaskRow key={task.id} task={task} updateTask={updateTask} openTask={openTask} />)}</div></section> : null; })}</div>;
}

function Matrix({ tasks, openTask }) {
  const quadrants = [
    ["Do first", (t) => t.urgent && t.important, "border-red-500/35"],
    ["Schedule", (t) => !t.urgent && t.important, "border-[var(--gold)]/45"],
    ["Delegate", (t) => t.urgent && !t.important, "border-blue-500/35"],
    ["Eliminate", (t) => !t.urgent && !t.important, "border-[var(--border)]"],
  ];
  return <div className="grid gap-5 xl:grid-cols-2">{quadrants.map(([title, filter, border]) => { const group = tasks.filter(filter); return <Card key={title} className={cls("min-h-72 border-dashed p-5", border)}><div className="mb-5 flex justify-between"><h2 className="font-black uppercase tracking-[0.14em] text-[var(--secondary)]">{title}</h2><span className="rounded-md bg-[var(--elevated)] px-3 font-black">{group.length}</span></div>{group.length ? <div className="space-y-3">{group.map((task) => <button key={task.id} onClick={() => openTask(task)} className="w-full rounded-xl border border-[var(--border)] bg-[var(--elevated)] p-4 text-left"><h3 className="font-black">{task.title}</h3><p className="text-sm text-[var(--secondary)]">{task.description}</p></button>)}</div> : <div className="grid min-h-44 place-items-center text-[var(--muted)]">Drop here</div>}</Card>; })}</div>;
}

function BoardPage({ data, updateTask, openTask }) {
  const [dragId, setDragId] = useState(null);
  const columns = [["todo", "TODO", "border-gray-500/45"], ["doing", "DOING", "border-[var(--gold)]/55"], ["done", "DONE", "border-emerald-500/55"]];
  return (
    <>
      <PageHeader title="Board" subtitle="Drag cards between columns to move work forward." />
      <div className="grid min-w-[900px] gap-5 lg:grid-cols-3">
        {columns.map(([status, title, border]) => {
          const tasks = data.tasks.filter((task) => task.status === status);
          return (
            <div key={status} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (dragId) updateTask(dragId, { status }); setDragId(null); }} className={cls("min-h-[500px] rounded-2xl border-2 border-dashed bg-[var(--elevated)] p-5", border)}>
              <div className="mb-5 flex justify-between"><h2 className="font-bold uppercase tracking-[0.14em] text-[var(--secondary)]">{title}</h2><span className="rounded-md bg-[var(--card)] px-3 font-black">{tasks.length}</span></div>
              {tasks.length ? tasks.map((task) => <button draggable onDragStart={() => setDragId(task.id)} onClick={() => openTask(task)} key={task.id} className="mb-3 w-full rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-left"><h3 className={cls("font-black", task.status === "done" && "line-through text-[var(--muted)]")}>{task.title}</h3><p className="mt-2 text-[var(--secondary)]">{task.description}</p><div className="mt-4 flex gap-2"><PriorityBadge priority={task.priority} /><span className="rounded-md border border-[var(--border)] px-3 py-1 text-sm font-black">{formatDate(task.dueDate)}</span></div></button>) : <div className="grid h-80 place-items-center italic text-[var(--secondary)]">Drop here</div>}
            </div>
          );
        })}
      </div>
    </>
  );
}

function formatDate(date) {
  if (!date) return "";
  const parsed = new Date(`${date}T00:00:00`);
  return parsed.toLocaleDateString("en", { month: "short", day: "numeric" });
}

function CalendarPage({ data, openTask }) {
  const [month, setMonth] = useState(new Date(2026, 4, 1));
  const [selected, setSelected] = useState(todayKey());
  const cells = useMemo(() => {
    const start = new Date(month.getFullYear(), month.getMonth(), 1);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const d = new Date(start);
      d.setDate(start.getDate() + index);
      return d;
    });
  }, [month]);
  const selectedTasks = data.tasks.filter((task) => task.dueDate === selected);
  const selectedReminders = (data.reminders || []).filter((reminder) => dateOnly(reminder.dueAt) === selected && reminder.status !== "cancelled");
  return (
    <>
      <PageHeader title="Calendar" subtitle="See your week at a glance, plan the next." action={<div className="flex flex-wrap items-center gap-3 sm:gap-6"><Button variant="secondary" className="w-12 px-0" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><FiChevronLeft /></Button><strong className="text-lg">{month.toLocaleDateString("en", { month: "long", year: "numeric" })}</strong><Button variant="secondary" className="w-12 px-0" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><FiChevronRight /></Button><Button variant="ghost" onClick={() => { const now = new Date(); setMonth(new Date(now.getFullYear(), now.getMonth(), 1)); setSelected(todayKey()); }}>Today</Button></div>} />
      <div className="grid gap-7 xl:grid-cols-[2fr_0.96fr]">
        <Card className="p-4 sm:p-7"><div className="grid grid-cols-7 text-center text-[10px] font-black uppercase tracking-[0.14em] text-[var(--secondary)] sm:text-xs">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day}>{day}</span>)}</div><div className="mt-4 grid grid-cols-7 gap-y-2 sm:mt-5 sm:gap-y-6 lg:gap-y-8">{cells.map((date) => { const key = date.toISOString().slice(0, 10); const isSelected = key === selected; const muted = date.getMonth() !== month.getMonth(); return <button key={key} onClick={() => setSelected(key)} className={cls("relative mx-auto grid h-11 w-full max-w-11 place-items-start rounded-lg p-2 text-left text-sm font-black sm:h-20 sm:max-w-20 sm:p-3 sm:text-base lg:h-24 lg:max-w-24", isSelected && "bg-[var(--gold)] text-black", muted && !isSelected && "text-[var(--muted)]")}>{date.getDate()} {data.tasks.some((task) => task.dueDate === key) && <span className="absolute bottom-2 left-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)] sm:bottom-3 sm:left-3 sm:h-2 sm:w-2" />}</button>; })}</div></Card>
        <Card className="min-h-[260px] p-6 xl:min-h-[520px]"><h2 className="text-sm font-black uppercase tracking-[0.14em] text-[var(--secondary)]">{new Date(`${selected}T00:00:00`).toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}</h2><div className="mt-10 space-y-3 xl:mt-20">{selectedTasks.length || selectedReminders.length ? <>{selectedTasks.map((task) => <button key={task.id} onClick={() => openTask(task)} className="w-full rounded-xl border border-[var(--border)] p-4 text-left"><h3 className="font-black">{task.title}</h3><p className="text-[var(--secondary)]">{task.description}</p></button>)}{selectedReminders.map((reminder) => <div key={reminder.id} className="w-full rounded-xl border border-[var(--gold)]/30 bg-[var(--gold-bg)] p-4 text-left"><h3 className="font-black text-[var(--gold)]">{reminder.title}</h3><p className="text-[var(--secondary)]">{(reminder.channels || []).join(" + ")}</p></div>)}</> : <p className="text-center text-lg text-[var(--secondary)]">No tasks scheduled.</p>}</div></Card>
      </div>
    </>
  );
}

function FocusPage({ data, stats, createSession }) {
  const [mode, setMode] = useState("pomodoro");
  const [seconds, setSeconds] = useState(focusModes[mode] * 60);
  const [running, setRunning] = useState(false);
  const [taskId, setTaskId] = useState("");
  useEffect(() => { setSeconds(focusModes[mode] * 60); setRunning(false); }, [mode]);
  useEffect(() => {
    if (!running) return undefined;
    const timer = setInterval(() => setSeconds((value) => {
      if (value <= 1) {
        clearInterval(timer);
        setRunning(false);
        createSession({ mode, preset: mode, minutes: focusModes[mode], taskId: taskId || null });
        return focusModes[mode] * 60;
      }
      return value - 1;
    }), 1000);
    return () => clearInterval(timer);
  }, [running, mode, createSession, taskId]);
  const total = focusModes[mode] * 60;
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return (
    <>
      <PageHeader title="Focus" subtitle="Deep work, undistracted. One block at a time." />
      <div className="grid gap-7 xl:grid-cols-[2fr_0.96fr]">
        <Card className="grid min-h-[500px] place-items-center overflow-hidden p-4 sm:p-8 xl:min-h-[664px] xl:p-10">
          <div className="w-full max-w-[480px] text-center"><div className="no-scrollbar mx-auto mb-9 grid w-full grid-cols-3 rounded-lg bg-[var(--elevated)] p-1 sm:mb-16 sm:flex sm:w-fit sm:max-w-full sm:overflow-x-auto">{Object.entries(focusModes).map(([key, min]) => <button key={key} onClick={() => setMode(key)} className={cls("h-10 min-w-0 rounded-md px-2 text-xs font-bold uppercase tracking-[0.06em] text-[var(--secondary)] sm:shrink-0 sm:px-6 sm:text-base", mode === key && "bg-[var(--gold)] text-black")}>{key === "pomodoro" ? "Pomodoro" : key} {min}</button>)}</div><div className="relative mx-auto grid h-56 w-56 place-items-center rounded-full border-[10px] border-white/7 sm:h-72 sm:w-72 sm:border-[12px]"><div className="absolute inset-[-10px] rounded-full sm:inset-[-12px]" style={{ background: `conic-gradient(var(--gold) ${((total - seconds) / total) * 360}deg, transparent 0)` }} /><div className="relative grid h-56 w-56 place-items-center rounded-full bg-[var(--card)] sm:h-72 sm:w-72"><div><strong className="text-5xl font-black sm:text-7xl">{mm}:{ss}</strong><p className="mt-2 text-sm uppercase tracking-widest text-[var(--muted)]">{running ? "Focused" : "Ready"}</p></div></div></div><Select className="mt-8 w-full sm:mt-10" value={taskId} onChange={(event) => setTaskId(event.target.value)}><option value="">No task</option>{data.tasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}</Select><div className="mt-4 grid gap-3 sm:grid-cols-[1fr_120px]"><Button onClick={() => setRunning((value) => !value)}>{running ? "Pause" : "Start"}</Button><Button variant="secondary" onClick={() => { setRunning(false); setSeconds(total); }}>Reset</Button></div></div>
        </Card>
        <div className="space-y-7"><Card className="p-8"><h2 className="mb-7 text-xl font-black">Today</h2><dl className="space-y-6 text-lg"><div className="flex justify-between"><dt className="text-[var(--secondary)]">Minutes</dt><dd className="text-3xl font-black">{stats.focusToday}</dd></div><div className="flex justify-between"><dt className="text-[var(--secondary)]">This week</dt><dd className="text-2xl font-black">{stats.focusThisWeek}m</dd></div><div className="flex justify-between"><dt className="text-[var(--secondary)]">Sessions</dt><dd className="text-2xl font-black">{data.sessions.length}</dd></div></dl></Card><Card className="h-64 p-8"><h2 className="text-xl font-black">Last 7 days</h2><div className="h-44"><MiniLineChart data={stats.focusWeek} height={140} /></div></Card></div>
      </div>
      <Card className="mt-7 min-h-64 p-8"><h2 className="text-xl font-black">Recent sessions</h2>{data.sessions.length ? <div className="mt-6 space-y-3">{data.sessions.slice(0, 5).map((session) => <p key={session.id} className="text-[var(--secondary)]">{session.minutes} minutes · {timeAgo(session.completedAt)}</p>)}</div> : <div className="grid min-h-44 place-items-center text-center text-lg text-[var(--secondary)]"><div><FiClock className="mx-auto mb-4 text-4xl text-[var(--gold)]/50" />No sessions yet — your first deep block is right above.</div></div>}</Card>
    </>
  );
}

function AnalyticsPage({ data, stats }) {
  const priorityData = ["low", "medium", "high", "urgent"].map((priority) => ({ label: priority, value: data.tasks.filter((task) => task.priority === priority).length }));
  return (
    <>
      <PageHeader title="Analytics" subtitle="Patterns in your work. Use them to plan better next week." />
      <div className="grid gap-5 xl:grid-cols-3">{[["Productivity Score", stats.score], ["Streak", "1d"], ["Focus This Week", `${stats.focusThisWeek}m`]].map(([label, value]) => <Card key={label} className="p-6"><p className="text-sm font-bold uppercase tracking-[0.14em] text-[var(--secondary)]">{label}</p><strong className="mt-3 block text-4xl font-black">{value}</strong></Card>)}</div>
      <div className="mt-7 grid gap-7 xl:grid-cols-2"><Card className="h-[422px] p-8"><h2 className="text-xl font-black">Tasks completed (7 days)</h2><div className="h-[330px]"><MiniLineChart data={stats.week} height={180} /></div></Card><Card className="h-[422px] p-8"><h2 className="text-xl font-black">Focus minutes (7 days)</h2><div className="h-[330px]"><MiniLineChart data={stats.focusWeek} height={180} /></div></Card><Card className="h-[422px] p-8"><h2 className="text-xl font-black">Tasks by status</h2><div className="grid h-72 place-items-center"><div className="grid h-52 w-52 place-items-center rounded-full border-[38px] border-[#5c9f98]"><div className="h-24 w-24 rounded-full bg-[var(--card)]" /></div></div><div className="flex justify-center gap-5 text-sm"><span>● todo</span><span className="text-[var(--gold)]">● doing</span><span className="text-[#5c9f98]">● done</span></div></Card><Card className="h-[422px] p-8"><h2 className="text-xl font-black">Tasks by priority</h2><div className="mt-8 space-y-5">{priorityData.map((item) => <div key={item.label} className="grid grid-cols-[80px_1fr] items-center gap-4"><span className="text-[var(--muted)]">{item.label}</span><span className="h-10 rounded-r-md bg-red-500/45" style={{ width: `${Math.max(2, item.value * 22)}%` }} /></div>)}</div></Card></div>
    </>
  );
}

function HabitsPage({ data }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(colors[10]);
  const [reminderAt, setReminderAt] = useState("");
  const doneToday = data.habits.filter((habit) => habit.completions.includes(todayKey())).length;
  const best = Math.max(0, ...data.habits.map((habit) => habit.completions.length));
  return (
    <>
      <PageHeader title="Habits" subtitle="Build streaks. Click any cell in the heatmap to toggle that day." />
      <div className="grid gap-4 xl:grid-cols-3"><Card className="p-6"><p className="text-sm uppercase tracking-[0.14em] text-[var(--secondary)]">Tracking</p><strong className="text-4xl font-black">{data.habits.length}</strong><p className="text-[var(--secondary)]">habits</p></Card><Card className="p-6"><p className="text-sm uppercase tracking-[0.14em] text-[var(--secondary)]">Done Today</p><strong className="text-4xl font-black">{doneToday}/{data.habits.length}</strong><p className="text-[var(--secondary)]">—</p></Card><Card className="p-6"><p className="text-sm uppercase tracking-[0.14em] text-[var(--secondary)]">Best Streak</p><strong className="text-4xl font-black">{best} <span className="text-[var(--gold)]">♨</span></strong><p className="text-[var(--secondary)]">days in a row</p></Card></div>
      <Card className="mt-7 p-5"><h2 className="mb-3 text-lg font-black">New habit</h2><form className="grid gap-3 sm:grid-cols-[1fr_160px_auto]" onSubmit={(event) => { event.preventDefault(); if (!name.trim()) return; data.createHabit({ name, color, reminderAt, reminderOffsets: reminderAt ? [0] : [], reminderChannels: reminderAt ? ["push"] : [] }); setName(""); setReminderAt(""); }}><Input className="w-full min-w-0" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g., Read 20 minutes" /><Input type="time" value={reminderAt} onChange={(event) => setReminderAt(event.target.value)} /><Button className="w-full sm:w-auto"><FiPlus /> Add</Button></form><div className="mt-4 flex flex-wrap gap-3">{colors.slice(0, 16).map((item) => <ColorSwatch key={item} color={item} selected={color === item} onClick={() => setColor(item)} />)}</div></Card>
      <div className="mt-7 space-y-4">{data.habits.length ? data.habits.map((habit) => <Card key={habit.id} className="grid gap-4 p-5 sm:flex sm:items-center sm:justify-between"><div className="grid min-w-0 grid-cols-[18px_minmax(0,1fr)] items-center gap-4 sm:flex"><span className="h-4 w-4 rounded-full" style={{ background: habit.color }} /><strong className="truncate">{habit.name}</strong><span className="col-start-2 text-[var(--secondary)] sm:col-auto">{habit.completions.length} completions</span></div><div className="flex shrink-0 gap-2"><Button className="flex-1 sm:flex-none" variant={habit.completions.includes(todayKey()) ? "primary" : "secondary"} onClick={() => data.toggleHabit(habit.id)}>Today</Button><Button variant="ghost" onClick={() => data.deleteHabit(habit.id)}><FiTrash2 /></Button></div></Card>) : <EmptyState icon={FiActivity} title="No habits yet." text="Start small. One habit at a time builds momentum." className="min-h-[330px]" />}</div>
    </>
  );
}

function TagsPage({ data }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(colors[10]);
  return (
    <>
      <PageHeader title="Tags" subtitle="Organize notes and tasks with color-coded labels." />
      <Card className="p-5"><form className="grid items-end gap-5 xl:grid-cols-[1fr_280px_105px]" onSubmit={(event) => { event.preventDefault(); if (!name.trim()) return; data.createTag({ name, color }); setName(""); }}><label className="font-bold">New tag name<Input className="mt-2 w-full" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. work, personal, ideas" /></label><div><p className="mb-2 font-bold">Color</p><div className="flex flex-wrap gap-3">{colors.map((item) => <ColorSwatch key={item} color={item} selected={color === item} size="h-7 w-7" onClick={() => setColor(item)} />)}</div></div><Button><FiPlus /> Add</Button></form></Card>
      <div className="mt-7">{data.tags.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data.tags.map((tag) => <Card key={tag.id} className="flex items-center justify-between p-5"><div className="flex items-center gap-3"><span className="h-4 w-4 rounded-full" style={{ background: tag.color }} /><strong>{tag.name}</strong></div><Button variant="ghost" onClick={() => data.deleteTag(tag.id)}><FiTrash2 /></Button></Card>)}</div> : <EmptyState icon={FiTag} title="No tags yet." text="Create your first tag to start organizing." className="min-h-[330px]" />}</div>
    </>
  );
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

function SettingsPage({ data }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("tasknote.theme") || "amoled");
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem("tasknote.theme", theme); }, [theme]);
  const settings = data.settings || {};
  const pushSupported = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  const permission = typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported";
  const updateSetting = (patch) => data.updateSettings({ ...settings, ...patch });

  const enablePush = async () => {
    try {
      if (!pushSupported) {
        toast.error("Push notifications are not supported on this browser.");
        return;
      }
      if (Notification.permission === "denied") {
        toast.error("Notifications are blocked. Allow them in browser site settings, then try again.");
        return;
      }
      if (!settings.pushConfigured || !settings.vapidPublicKey) {
        toast.error("Push notifications need VAPID keys configured on the backend.");
        return;
      }
      const result = await Notification.requestPermission();
      if (result !== "granted") {
        toast.error("Push notification permission was not granted.");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      const subscription = existing || await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(settings.vapidPublicKey),
      });
      await data.testPush(subscription.toJSON());
      await updateSetting({ pushReminders: true });
    } catch (error) {
      const blocked = error?.name === "NotAllowedError" || Notification.permission === "denied";
      toast.error(
        blocked
          ? "Notifications are blocked. Allow them in browser site settings, then try again."
          : "Could not enable push notifications. Please try again.",
      );
    }
  };

  const disablePush = async () => {
    if (pushSupported) {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await data.disablePush(subscription.endpoint);
        await subscription.unsubscribe();
      }
    }
    await updateSetting({ pushReminders: false });
  };
  return (
    <>
      <PageHeader title="Settings" subtitle="Make TaskNote feel like yours." />
      <Card className="mb-7 p-8"><h2 className="text-xl font-black">Appearance</h2><p className="mt-3 text-[var(--secondary)]">Choose how TaskNote looks to you.</p><div className="mt-6 flex flex-wrap gap-3">{["light", "dark", "system", "amoled"].map((item) => <Button key={item} variant={theme === item ? "primary" : "secondary"} onClick={() => setTheme(item)}>{item[0].toUpperCase() + item.slice(1)}</Button>)}</div></Card>
      <Card className="mb-7 p-8">
        <h2 className="text-xl font-black">Reminders</h2>
        <p className="mt-3 text-[var(--secondary)]">Choose how TaskNote nudges you before tasks, notes, and habits need attention.</p>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--elevated)] p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-black">Push notifications</h3>
                <p className="mt-1 text-sm text-[var(--secondary)]">Permission: {permission}</p>
                {!settings.pushConfigured && <p className="mt-2 text-sm text-[var(--secondary)]">Add VAPID keys to enable mobile PWA push.</p>}
              </div>
              <Button variant={settings.pushReminders ? "secondary" : "primary"} onClick={settings.pushReminders ? disablePush : enablePush}>
                {settings.pushReminders ? "Disable" : "Enable"}
              </Button>
            </div>
            <Button className="mt-4" variant="secondary" onClick={() => data.testPush()} disabled={!settings.pushReminders}>
              Test push
            </Button>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--elevated)] p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-black">Email reminders</h3>
                <p className="mt-1 text-sm text-[var(--secondary)]">{settings.email || "Your TaskNote email"} receives reminder emails.</p>
                {!settings.emailConfigured && <p className="mt-2 text-sm text-[var(--secondary)]">SMTP is not configured, so email tests are gracefully disabled.</p>}
              </div>
              <Button variant={settings.emailReminders ? "primary" : "secondary"} onClick={() => updateSetting({ emailReminders: !settings.emailReminders })}>
                {settings.emailReminders ? "Enabled" : "Enable"}
              </Button>
            </div>
            <Button className="mt-4" variant="secondary" onClick={() => data.testEmail()}>
              Test email
            </Button>
          </div>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <label className="font-bold">
            Quiet hours start
            <Input className="mt-2" type="time" value={settings.quietHours?.start || ""} onChange={(event) => updateSetting({ quietHours: { ...(settings.quietHours || {}), start: event.target.value } })} />
          </label>
          <label className="font-bold">
            Quiet hours end
            <Input className="mt-2" type="time" value={settings.quietHours?.end || ""} onChange={(event) => updateSetting({ quietHours: { ...(settings.quietHours || {}), end: event.target.value } })} />
          </label>
        </div>
      </Card>
      <Card className="p-8"><h2 className="text-xl font-black">About</h2><div className="mt-5 flex gap-4"><span className="grid h-12 w-12 place-items-center rounded-lg bg-[var(--gold-bg)] text-[var(--gold)]"><FiZap /></span><div><h3 className="font-black">TaskNote</h3><p className="max-w-3xl text-[var(--secondary)]">A productivity workspace that combines notes, tasks, calendar, focus, habits, tags, and analytics. Built for people who like their tools considered.</p></div></div><p className="mt-6 border-t border-[var(--border)] pt-4 text-[var(--secondary)]">Press <kbd>⌘K</kbd> anywhere to open the quick command bar.</p></Card>
    </>
  );
}

function WorkspaceShell({ page }) {
  const { user } = useAuth();
  const data = useWorkspaceData(user);
  const stats = useStats(data);
  const [commandOpen, setCommandOpen] = useState(false);
  const [noteModal, setNoteModal] = useState({ open: false, note: null });
  const [taskModal, setTaskModal] = useState({ open: false, task: null });
  const openNote = (note = null) => setNoteModal({ open: true, note });
  const openTask = (task = null) => setTaskModal({ open: true, task });

  useEffect(() => {
    const handler = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "n") {
        event.preventDefault();
        openNote(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const screen = {
    dashboard: <DashboardPage data={data} stats={stats} />,
    notes: <NotesPage data={data} openNote={openNote} />,
    tasks: <TasksPage data={data} updateTask={data.updateTask} deleteTask={data.deleteTask} openTask={openTask} />,
    board: <div className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"><BoardPage data={data} updateTask={data.updateTask} openTask={openTask} /></div>,
    calendar: <CalendarPage data={data} openTask={openTask} />,
    focus: <FocusPage data={data} stats={stats} createSession={data.createSession} />,
    analytics: <AnalyticsPage data={data} stats={stats} />,
    habits: <HabitsPage data={data} />,
    tags: <TagsPage data={data} />,
    settings: <SettingsPage data={data} />,
  }[page] || <DashboardPage data={data} stats={stats} />;

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--text)]">
      <Sidebar user={user} openQuickAdd={() => setCommandOpen(true)} />
      <main className="min-h-screen max-w-full overflow-x-hidden px-4 py-7 pb-28 sm:px-6 lg:ml-72 lg:px-8 xl:px-10">
        <div className="mx-auto w-full max-w-[1280px]">{screen}</div>
      </main>
      <MobileNav openQuickAdd={() => setCommandOpen(true)} />
      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} openNote={() => openNote(null)} openTask={() => openTask(null)} />
      <Modal open={noteModal.open} title={noteModal.note ? "Edit note" : "New note"} onClose={() => setNoteModal({ open: false, note: null })}>
        <NoteForm note={noteModal.note} onSave={(payload) => noteModal.note ? data.updateNote(noteModal.note.id, payload) : data.createNote(payload)} onDelete={data.deleteNote} onClose={() => setNoteModal({ open: false, note: null })} />
      </Modal>
      <Modal open={taskModal.open} title={taskModal.task ? "Edit task" : "New task"} onClose={() => setTaskModal({ open: false, task: null })}>
        <TaskForm task={taskModal.task} onSave={(payload) => taskModal.task ? data.updateTask(taskModal.task.id, payload) : data.createTask(payload)} onDelete={data.deleteTask} onClose={() => setTaskModal({ open: false, task: null })} />
      </Modal>
    </div>
  );
}

export default WorkspaceShell;
