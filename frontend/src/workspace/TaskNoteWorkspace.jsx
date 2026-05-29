import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { apiClient, getErrorMessage, setApiToken } from "../api/apiClient.js";
import { useAuth } from "../auth/AuthProvider.jsx";
import { useOfflineSync } from "../hooks/useOfflineSync.js";
import { enqueueOfflineOperation } from "../services/offline/offlineQueueService.js";
import {
  FiActivity,
  FiBarChart2,
  FiCalendar,
  FiCheck,
  FiCheckSquare,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiDownload,
  FiFileText,
  FiFolder,
  FiGrid,
  FiHome,
  FiInbox,
  FiLogOut,
  FiPlus,
  FiRepeat,
  FiSearch,
  FiSettings,
  FiTag,
  FiTrash2,
  FiUpload,
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
  { to: "/inbox", label: "Inbox", icon: FiInbox },
  { to: "/notes", label: "Notes", icon: FiFileText },
  { to: "/tasks", label: "Tasks", icon: FiCheckSquare },
  { to: "/board", label: "Board", icon: FiGrid },
  { to: "/calendar", label: "Calendar", icon: FiCalendar },
  { to: "/planner", label: "Planner", icon: FiClock },
  { to: "/projects", label: "Projects", icon: FiFolder },
  { to: "/focus", label: "Focus", icon: FiClock },
  { to: "/analytics", label: "Analytics", icon: FiBarChart2 },
  { to: "/habits", label: "Habits", icon: FiActivity },
  { to: "/tags", label: "Tags", icon: FiTag },
  { to: "/templates", label: "Templates", icon: FiFileText },
  { to: "/reviews", label: "Reviews", icon: FiRepeat },
  { to: "/reminders", label: "Reminders", icon: FiZap },
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
  inboxItems: [],
  projects: [],
  timeBlocks: [],
  templates: [],
  reviews: [],
  graph: { nodes: [], edges: [] },
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

const normalizeInboxItem = (item) => ({
  ...item,
  typeSuggestion: item.typeSuggestion || "idea",
  status: item.status || "unprocessed",
});

const normalizeProject = (project) => ({
  ...project,
  status: project.status || (project.archived ? "archived" : "active"),
  color: project.color || gold,
});

const normalizeTimeBlock = (block) => ({
  ...block,
  startAt: block.startAt ? new Date(block.startAt).toISOString().slice(0, 16) : "",
  endAt: block.endAt ? new Date(block.endAt).toISOString().slice(0, 16) : "",
  reminderOffsets: block.reminderOffsets || [],
  reminderChannels: block.reminderChannels || [],
});

const normalizeTemplate = (template) => ({
  ...template,
  defaults: template.defaults || {},
  body: template.body || "",
});

const normalizeReview = (review) => ({
  ...review,
  reflection: review.reflection || "",
  metrics: review.metrics || {},
});

async function unwrap(request) {
  const response = await request;
  return response.data?.data || {};
}

function parseNaturalTask(input) {
  const raw = input.trim();
  const lower = raw.toLowerCase();
  const now = new Date();
  const parsed = {
    title: raw,
    priority: "medium",
    dueDate: "",
    reminderOffsets: [],
    recurringRule: "",
    important: false,
    urgent: false,
  };
  if (/\burgent\b/.test(lower)) parsed.priority = "urgent";
  else if (/\bhigh priority\b|\bhigh\b/.test(lower)) parsed.priority = "high";
  else if (/\blow priority\b|\blow\b/.test(lower)) parsed.priority = "low";
  parsed.urgent = parsed.priority === "urgent";
  parsed.important = ["high", "urgent"].includes(parsed.priority);

  const setDate = (date) => {
    parsed.dueDate = date.toISOString().slice(0, 10);
  };
  if (/\btomorrow\b/.test(lower)) {
    const date = new Date(now);
    date.setDate(date.getDate() + 1);
    setDate(date);
  } else if (/\btoday\b/.test(lower)) {
    setDate(now);
  } else {
    const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const foundDay = weekdays.findIndex((day) => lower.includes(day));
    if (foundDay >= 0) {
      const date = new Date(now);
      const diff = (foundDay - date.getDay() + 7) % 7 || 7;
      date.setDate(date.getDate() + diff);
      setDate(date);
    }
  }
  const timeMatch = lower.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/);
  if (timeMatch && parsed.dueDate) {
    let hour = Number(timeMatch[1]);
    const minute = Number(timeMatch[2] || 0);
    if (timeMatch[3] === "pm" && hour < 12) hour += 12;
    if (timeMatch[3] === "am" && hour === 12) hour = 0;
    parsed.reminderAt = `${parsed.dueDate}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }
  const reminderMatch = lower.match(/remind me (\d+)\s*(minute|minutes|min|hour|hours)/);
  if (reminderMatch) {
    const value = Number(reminderMatch[1]);
    parsed.reminderOffsets = [reminderMatch[2].startsWith("hour") ? value * 60 : value];
    parsed.reminderChannels = ["push"];
  }
  if (/\bevery weekday\b/.test(lower)) parsed.recurringRule = "weekdays";
  else if (/\bevery day\b|\bdaily\b/.test(lower)) parsed.recurringRule = "daily";
  else if (/\bevery\b/.test(lower)) parsed.recurringRule = "weekly";
  parsed.title = raw
    .replace(/\b(today|tomorrow|on\s+\w+day|every\s+\w+|daily|at\s+\d{1,2}(:\d{2})?\s*(am|pm)|high priority|low priority|urgent|remind me \d+\s*(minutes?|mins?|hours?)( before)?)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim() || raw;
  return parsed;
}

function stripOfflineMeta(item = {}) {
  const {
    _offline,
    _syncStatus,
    _localId,
    _serverId,
    _lastLocalChangeAt,
    ...clean
  } = item;
  return clean;
}

function withSyncMeta(item, status = "queued") {
  return {
    ...item,
    _offline: true,
    _syncStatus: status,
    _localId: item._localId || item.id,
    _lastLocalChangeAt: new Date().toISOString(),
  };
}

const collectionNormalizers = {
  notes: normalizeNote,
  tasks: normalizeTask,
  habits: normalizeHabit,
  inboxItems: normalizeInboxItem,
  timeBlocks: normalizeTimeBlock,
};

function responseItemFor(queueItem, response) {
  return response?.[queueItem.responseKey] || response?.data?.[queueItem.responseKey] || null;
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
        const [notes, tasks, habits, tags, focus, reminders, settings, inbox, projects, timeBlocks, templates, reviews, graph] = await Promise.all([
          unwrap(apiClient.get("/api/notes")),
          unwrap(apiClient.get("/api/tasks")),
          unwrap(apiClient.get("/api/habits")),
          unwrap(apiClient.get("/api/tags")),
          unwrap(apiClient.get("/api/focus-sessions")),
          unwrap(apiClient.get("/api/reminders")),
          unwrap(apiClient.get("/api/settings")),
          unwrap(apiClient.get("/api/inbox")),
          unwrap(apiClient.get("/api/projects")),
          unwrap(apiClient.get("/api/time-blocks")),
          unwrap(apiClient.get("/api/templates")),
          unwrap(apiClient.get("/api/reviews")),
          unwrap(apiClient.get("/api/notes/graph")),
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
          inboxItems: (inbox.inboxItems || current.inboxItems || []).map(normalizeInboxItem),
          projects: (projects.projects || current.projects || []).map(normalizeProject),
          timeBlocks: (timeBlocks.timeBlocks || current.timeBlocks || []).map(normalizeTimeBlock),
          templates: (templates.templates || current.templates || []).map(normalizeTemplate),
          reviews: (reviews.reviews || current.reviews || []).map(normalizeReview),
          graph: graph || current.graph || { nodes: [], edges: [] },
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
  const applySyncedOperation = (queueItem, response) => {
    const key = queueItem.collectionKey;
    const syncedItem = responseItemFor(queueItem, response);
    if (!key) return;
    update((current) => {
      if (!Array.isArray(current[key])) return current;
      if (queueItem.operation === "delete" || !syncedItem) {
        return { ...current, [key]: current[key].filter((item) => item.id !== queueItem.entityId) };
      }
      const normalize = collectionNormalizers[key] || ((item) => item);
      const normalized = normalize(syncedItem);
      const exists = current[key].some((item) => item.id === queueItem.entityId || item.id === normalized.id);
      const nextItems = exists
        ? current[key].map((item) => (
          item.id === queueItem.entityId || item.id === normalized.id
            ? { ...normalized, _offline: false, _syncStatus: "synced", _serverId: normalized.id }
            : item
        ))
        : [{ ...normalized, _offline: false, _syncStatus: "synced", _serverId: normalized.id }, ...current[key]];
      return { ...current, [key]: nextItems };
    });
  };
  const markConflictOperation = (queueItem) => {
    const key = queueItem.collectionKey;
    if (!key) return;
    update((current) => ({
      ...current,
      [key]: Array.isArray(current[key])
        ? current[key].map((item) => (item.id === queueItem.entityId ? { ...item, _syncStatus: "conflict" } : item))
        : current[key],
    }));
  };
  const offlineSync = useOfflineSync({
    userId,
    onSynced: applySyncedOperation,
    onConflict: markConflictOperation,
  });
  const queueOfflineWrite = async (operation) => {
    await enqueueOfflineOperation({ userId, ...operation });
  };
  const markQueued = (collectionKey, entityId, status = "queued") => {
    update((current) => ({
      ...current,
      [collectionKey]: Array.isArray(current[collectionKey])
        ? current[collectionKey].map((item) => (item.id === entityId ? withSyncMeta(item, status) : item))
        : current[collectionKey],
    }));
  };
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
      if (fallback) {
        await fallback(error);
      } else {
        toast.error(error?.response?.data?.message || error.message || "Backend is unavailable.");
      }
      return null;
    }
  };

  return {
    ...data,
    onlineApi,
    offlineSync,
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
        async () => {
          const queued = withSyncMeta(next);
          update((d) => ({ ...d, notes: [queued, ...d.notes] }));
          await queueOfflineWrite({
            entityType: "note",
            entityId: queued.id,
            operation: "create",
            method: "POST",
            endpoint: "/api/notes",
            payload: stripOfflineMeta(queued),
            localSnapshot: queued,
            collectionKey: "notes",
            responseKey: "note",
          });
          toast.success("Note saved offline. It will sync when you reconnect.");
        },
        async () => {
          const result = await unwrap(apiClient.post("/api/notes", next));
          update((d) => ({ ...d, notes: [normalizeNote(result.note), ...d.notes] }));
        },
        "Note created"
      );
    },
    async updateNote(id, patch) {
      const payload = { ...patch, backlinks: extractBacklinks(patch.content || "") };
      const previous = data.notes.find((note) => note.id === id);
      await withApi(
        async () => {
          const updatedAt = new Date().toISOString();
          let localSnapshot = null;
          update((d) => ({
            ...d,
            notes: d.notes.map((note) => {
              if (note.id !== id) return note;
              localSnapshot = withSyncMeta({ ...note, ...payload, updatedAt });
              return localSnapshot;
            }),
          }));
          await queueOfflineWrite({
            entityType: "note",
            entityId: id,
            operation: "update",
            method: "PUT",
            endpoint: `/api/notes/${id}`,
            payload,
            localSnapshot: previous,
            collectionKey: "notes",
            responseKey: "note",
          });
          toast.success("Note update queued for sync.");
        },
        async () => {
          const result = await unwrap(apiClient.put(`/api/notes/${id}`, payload));
          update((d) => ({ ...d, notes: d.notes.map((note) => (note.id === id ? normalizeNote(result.note) : note)) }));
        },
        "Note updated"
      );
    },
    async deleteNote(id) {
      const previous = data.notes.find((note) => note.id === id);
      await withApi(
        async () => {
          update((d) => ({ ...d, notes: d.notes.filter((note) => note.id !== id) }));
          await queueOfflineWrite({
            entityType: "note",
            entityId: id,
            operation: "delete",
            method: "DELETE",
            endpoint: `/api/notes/${id}`,
            payload: null,
            localSnapshot: previous,
            collectionKey: "notes",
            responseKey: "note",
          });
          toast.success("Note delete queued for sync.");
        },
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
        async () => {
          const queued = withSyncMeta(next);
          update((d) => ({ ...d, tasks: [queued, ...d.tasks] }));
          await queueOfflineWrite({
            entityType: "task",
            entityId: queued.id,
            operation: "create",
            method: "POST",
            endpoint: "/api/tasks",
            payload: stripOfflineMeta(queued),
            localSnapshot: queued,
            collectionKey: "tasks",
            responseKey: "task",
          });
          toast.success("Task saved offline. It will sync when you reconnect.");
        },
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
      const previous = data.tasks.find((task) => task.id === id);
      await withApi(
        async () => {
          update((d) => ({ ...d, tasks: d.tasks.map((task) => (task.id === id ? withSyncMeta({ ...task, ...payload, updatedAt: new Date().toISOString() }) : task)) }));
          await queueOfflineWrite({
            entityType: "task",
            entityId: id,
            operation: payload.status === "done" ? "complete" : "update",
            method: "PATCH",
            endpoint: `/api/tasks/${id}`,
            payload,
            localSnapshot: previous,
            collectionKey: "tasks",
            responseKey: "task",
          });
          toast.success("Task update queued for sync.");
        },
        async () => {
          const result = await unwrap(apiClient.patch(`/api/tasks/${id}`, payload));
          update((d) => ({ ...d, tasks: d.tasks.map((task) => (task.id === id ? normalizeTask(result.task) : task)) }));
        }
      );
    },
    async deleteTask(id) {
      const previous = data.tasks.find((task) => task.id === id);
      await withApi(
        async () => {
          update((d) => ({ ...d, tasks: d.tasks.filter((task) => task.id !== id) }));
          await queueOfflineWrite({
            entityType: "task",
            entityId: id,
            operation: "delete",
            method: "DELETE",
            endpoint: `/api/tasks/${id}`,
            payload: null,
            localSnapshot: previous,
            collectionKey: "tasks",
            responseKey: "task",
          });
          toast.success("Task delete queued for sync.");
        },
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
        async () => {
          const queued = withSyncMeta(next);
          update((d) => ({ ...d, habits: [queued, ...d.habits] }));
          await queueOfflineWrite({
            entityType: "habit",
            entityId: queued.id,
            operation: "create",
            method: "POST",
            endpoint: "/api/habits",
            payload: stripOfflineMeta(queued),
            localSnapshot: queued,
            collectionKey: "habits",
            responseKey: "habit",
          });
          toast.success("Habit saved offline. It will sync when you reconnect.");
        },
        async () => {
          const result = await unwrap(apiClient.post("/api/habits", next));
          update((d) => ({ ...d, habits: [normalizeHabit(result.habit), ...d.habits] }));
        },
        "Habit created"
      );
    },
    async toggleHabit(id, date = todayKey()) {
      const previous = data.habits.find((habit) => habit.id === id);
      await withApi(
        async () => {
          let nextHabit = null;
          update((d) => ({
            ...d,
            habits: d.habits.map((habit) => {
              if (habit.id !== id) return habit;
              const exists = habit.completions.includes(date);
              nextHabit = withSyncMeta({ ...habit, completions: exists ? habit.completions.filter((item) => item !== date) : [...habit.completions, date], updatedAt: new Date().toISOString() });
              return nextHabit;
            }),
          }));
          await queueOfflineWrite({
            entityType: "habit",
            entityId: id,
            operation: "complete",
            method: "POST",
            endpoint: `/api/habits/${id}/toggle-today`,
            payload: { date, ...(nextHabit ? stripOfflineMeta(nextHabit) : {}) },
            localSnapshot: previous,
            collectionKey: "habits",
            responseKey: "habit",
          });
          toast.success("Habit completion queued for sync.");
        },
        async () => {
          const result = await unwrap(apiClient.post(`/api/habits/${id}/toggle-today`));
          update((d) => ({ ...d, habits: d.habits.map((habit) => (habit.id === id ? normalizeHabit(result.habit) : habit)) }));
        }
      );
    },
    async deleteHabit(id) {
      const previous = data.habits.find((habit) => habit.id === id);
      await withApi(
        async () => {
          update((d) => ({ ...d, habits: d.habits.filter((habit) => habit.id !== id) }));
          await queueOfflineWrite({
            entityType: "habit",
            entityId: id,
            operation: "delete",
            method: "DELETE",
            endpoint: `/api/habits/${id}`,
            payload: null,
            localSnapshot: previous,
            collectionKey: "habits",
            responseKey: "habit",
          });
          toast.success("Habit delete queued for sync.");
        },
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
    async createInboxItem(item) {
      const next = { id: uid(), title: item.title.trim(), content: item.content || "", typeSuggestion: item.typeSuggestion || "idea", status: "unprocessed", source: item.source || "quick-capture", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      await withApi(
        async () => {
          const queued = withSyncMeta(next);
          update((d) => ({ ...d, inboxItems: [queued, ...(d.inboxItems || [])] }));
          await queueOfflineWrite({
            entityType: "inbox",
            entityId: queued.id,
            operation: "create",
            method: "POST",
            endpoint: "/api/inbox",
            payload: stripOfflineMeta(queued),
            localSnapshot: queued,
            collectionKey: "inboxItems",
            responseKey: "inboxItem",
          });
          toast.success("Inbox capture saved offline.");
        },
        async () => {
          const result = await unwrap(apiClient.post("/api/inbox", next));
          update((d) => ({ ...d, inboxItems: [normalizeInboxItem(result.inboxItem), ...(d.inboxItems || [])] }));
        },
        "Captured to inbox"
      );
    },
    async updateInboxItem(id, patch) {
      const previous = data.inboxItems.find((item) => item.id === id);
      await withApi(
        async () => {
          update((d) => ({ ...d, inboxItems: (d.inboxItems || []).map((item) => (item.id === id ? withSyncMeta({ ...item, ...patch, updatedAt: new Date().toISOString() }) : item)) }));
          await queueOfflineWrite({
            entityType: "inbox",
            entityId: id,
            operation: patch.status === "archived" ? "archive" : "update",
            method: "PATCH",
            endpoint: `/api/inbox/${id}`,
            payload: patch,
            localSnapshot: previous,
            collectionKey: "inboxItems",
            responseKey: "inboxItem",
          });
          toast.success("Inbox update queued for sync.");
        },
        async () => {
          const result = await unwrap(apiClient.patch(`/api/inbox/${id}`, patch));
          update((d) => ({ ...d, inboxItems: (d.inboxItems || []).map((item) => (item.id === id ? normalizeInboxItem(result.inboxItem) : item)) }));
        }
      );
    },
    async deleteInboxItem(id) {
      const previous = data.inboxItems.find((item) => item.id === id);
      await withApi(
        async () => {
          update((d) => ({ ...d, inboxItems: (d.inboxItems || []).filter((item) => item.id !== id) }));
          await queueOfflineWrite({
            entityType: "inbox",
            entityId: id,
            operation: "delete",
            method: "DELETE",
            endpoint: `/api/inbox/${id}`,
            payload: null,
            localSnapshot: previous,
            collectionKey: "inboxItems",
            responseKey: "inboxItem",
          });
          toast.success("Inbox delete queued for sync.");
        },
        async () => {
          await unwrap(apiClient.delete(`/api/inbox/${id}`));
          update((d) => ({ ...d, inboxItems: (d.inboxItems || []).filter((item) => item.id !== id) }));
        },
        "Inbox item deleted"
      );
    },
    async convertInboxItem(id, type) {
      const item = (data.inboxItems || []).find((entry) => entry.id === id);
      if (!item) return;
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        toast.error("Converting inbox items needs an internet connection.");
        return;
      }
      const endpoint = type === "note" ? "convert-to-note" : type === "task" ? "convert-to-task" : "convert-to-habit";
      await withApi(
        null,
        async () => {
          const result = await unwrap(apiClient.post(`/api/inbox/${id}/${endpoint}`, type === "task" ? parseNaturalTask(item.title) : {}));
          update((d) => ({
            ...d,
            inboxItems: (d.inboxItems || []).map((entry) => (entry.id === id ? normalizeInboxItem(result.inboxItem) : entry)),
            notes: result.note ? [normalizeNote(result.note), ...d.notes] : d.notes,
            tasks: result.task ? [normalizeTask(result.task), ...d.tasks] : d.tasks,
            habits: result.habit ? [normalizeHabit(result.habit), ...d.habits] : d.habits,
          }));
        },
        `Converted to ${type}`
      );
    },
    async createProject(project) {
      const next = { id: uid(), name: project.name.trim(), description: project.description || "", color: project.color || gold, icon: project.icon || "folder", archived: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      await withApi(
        () => update((d) => ({ ...d, projects: [next, ...(d.projects || [])] })),
        async () => {
          const result = await unwrap(apiClient.post("/api/projects", next));
          update((d) => ({ ...d, projects: [normalizeProject(result.project), ...(d.projects || [])] }));
        },
        "Project created"
      );
    },
    async archiveProject(id) {
      await withApi(
        () => update((d) => ({ ...d, projects: (d.projects || []).map((project) => (project.id === id ? { ...project, archived: true } : project)) })),
        async () => {
          const result = await unwrap(apiClient.patch(`/api/projects/${id}`, { archived: true }));
          update((d) => ({ ...d, projects: (d.projects || []).map((project) => (project.id === id ? normalizeProject(result.project) : project)) }));
        },
        "Project archived"
      );
    },
    async createTimeBlock(block) {
      const next = { id: uid(), ...block, status: block.status || "planned", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      await withApi(
        async () => {
          const queued = withSyncMeta(next);
          update((d) => ({ ...d, timeBlocks: [queued, ...(d.timeBlocks || [])] }));
          await queueOfflineWrite({
            entityType: "timeBlock",
            entityId: queued.id,
            operation: "create",
            method: "POST",
            endpoint: "/api/time-blocks",
            payload: stripOfflineMeta(queued),
            localSnapshot: queued,
            collectionKey: "timeBlocks",
            responseKey: "timeBlock",
          });
          toast.success("Time block saved offline.");
        },
        async () => {
          const result = await unwrap(apiClient.post("/api/time-blocks", next));
          if (result.conflict) toast.warning("This time block overlaps another block.");
          update((d) => ({ ...d, timeBlocks: [normalizeTimeBlock(result.timeBlock), ...(d.timeBlocks || [])] }));
        },
        "Time block saved"
      );
    },
    async updateTimeBlock(id, patch) {
      const previous = data.timeBlocks.find((block) => block.id === id);
      await withApi(
        async () => {
          update((d) => ({ ...d, timeBlocks: (d.timeBlocks || []).map((block) => (block.id === id ? withSyncMeta({ ...block, ...patch, updatedAt: new Date().toISOString() }) : block)) }));
          await queueOfflineWrite({
            entityType: "timeBlock",
            entityId: id,
            operation: patch.status === "completed" ? "complete" : "update",
            method: "PATCH",
            endpoint: `/api/time-blocks/${id}`,
            payload: patch,
            localSnapshot: previous,
            collectionKey: "timeBlocks",
            responseKey: "timeBlock",
          });
          toast.success("Time block update queued for sync.");
        },
        async () => {
          const result = await unwrap(apiClient.patch(`/api/time-blocks/${id}`, patch));
          if (result.conflict) toast.warning("This time block overlaps another block.");
          update((d) => ({ ...d, timeBlocks: (d.timeBlocks || []).map((block) => (block.id === id ? normalizeTimeBlock(result.timeBlock) : block)) }));
        }
      );
    },
    async createTemplate(template) {
      const next = { id: uid(), ...template, isBuiltIn: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      await withApi(
        () => update((d) => ({ ...d, templates: [next, ...(d.templates || [])] })),
        async () => {
          const result = await unwrap(apiClient.post("/api/templates", next));
          update((d) => ({ ...d, templates: [normalizeTemplate(result.template), ...(d.templates || [])] }));
        },
        "Template saved"
      );
    },
    async createReview(review) {
      await withApi(
        null,
        async () => {
          const result = await unwrap(apiClient.post("/api/reviews", review));
          update((d) => ({ ...d, reviews: [normalizeReview(result.review), ...(d.reviews || []).filter((item) => item.id !== result.review.id)] }));
        },
        "Review saved"
      );
    },
    async snoozeReminder(id, minutes) {
      await withApi(
        null,
        async () => {
          const result = await unwrap(apiClient.post(`/api/reminders/${id}/snooze`, { minutes }));
          update((d) => ({ ...d, reminders: (d.reminders || []).map((item) => (item.id === id ? result.reminder : item)) }));
        },
        "Reminder snoozed"
      );
    },
    async cancelReminder(id) {
      await withApi(
        () => update((d) => ({ ...d, reminders: (d.reminders || []).filter((item) => item.id !== id) })),
        async () => {
          await unwrap(apiClient.delete(`/api/reminders/${id}`));
          update((d) => ({ ...d, reminders: (d.reminders || []).filter((item) => item.id !== id) }));
        },
        "Reminder cancelled"
      );
    },
    async refreshGraph() {
      await withApi(
        null,
        async () => {
          const result = await unwrap(apiClient.get("/api/notes/graph"));
          update((d) => ({ ...d, graph: result }));
        }
      );
    },
    async exportBackup() {
      const result = await unwrap(apiClient.get("/api/export/json"));
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
      downloadBlob(blob, `tasknote-backup-${todayKey()}.json`);
      toast.success("Backup exported");
    },
    async exportTasksCsv() {
      const response = await apiClient.get("/api/export/tasks.csv", { responseType: "blob" });
      downloadBlob(response.data, `tasknote-tasks-${todayKey()}.csv`);
      toast.success("Tasks exported");
    },
    async exportNotesMarkdown() {
      const response = await apiClient.get("/api/export/notes", { responseType: "blob" });
      downloadBlob(response.data, `tasknote-notes-${todayKey()}.md`);
      toast.success("Notes exported");
    },
    async importBackup(file, mode = "skipDuplicates") {
      if (!file?.name?.toLowerCase().endsWith(".json")) {
        toast.error("Choose a valid TaskNote JSON backup.");
        return null;
      }
      const text = await file.text();
      const backup = JSON.parse(text);
      const result = await unwrap(apiClient.post("/api/import/json", { backup, mode }));
      toast.success("Backup imported. Refreshing workspace...");
      window.setTimeout(() => window.location.reload(), 700);
      return result.summary;
    },
  };
}

function extractBacklinks(content) {
  return [...content.matchAll(/\[\[([^\]]+)\]\]/g)].map((match) => match[1].trim()).filter(Boolean);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
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

function ComposerSection({ eyebrow, title, helper, icon: Icon, children, className = "" }) {
  return (
    <section className={cls("rounded-2xl border border-[var(--border)] bg-[#101010]/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:p-5", className)}>
      {(title || helper) && (
        <div className="mb-4 flex items-start gap-3">
          {Icon && <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[var(--gold)]/20 bg-[var(--gold-bg)] text-[var(--gold)]"><Icon /></span>}
          <div className="min-w-0">
            {eyebrow && <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[var(--gold)]">{eyebrow}</p>}
            {title && <h3 className="mt-1 text-base font-black text-[var(--text)] sm:text-lg">{title}</h3>}
            {helper && <p className="mt-1 text-sm leading-6 text-[var(--secondary)]">{helper}</p>}
          </div>
        </div>
      )}
      {children}
    </section>
  );
}

function ComposerField({ label, helper, children, className = "" }) {
  return (
    <label className={cls("block min-w-0", className)}>
      <span className="mb-2 block text-sm font-black text-[var(--secondary)]">{label}</span>
      {children}
      {helper && <span className="mt-2 block text-xs leading-5 text-[var(--muted)]">{helper}</span>}
    </label>
  );
}

function SelectableChip({ checked, onChange, children, name }) {
  return (
    <label className={cls(
      "inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-bold transition active:scale-[0.98]",
      checked
        ? "border-[var(--gold)] bg-[var(--gold-bg)] text-[var(--gold)] shadow-[0_0_0_1px_rgba(230,185,87,0.12)]"
        : "border-[var(--border)] bg-[var(--card)] text-[var(--secondary)] hover:border-[var(--gold)]/40 hover:text-[var(--text)]"
    )}>
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span className={cls("grid h-4 w-4 place-items-center rounded border text-[10px]", checked ? "border-[var(--gold)] bg-[var(--gold)] text-black" : "border-[var(--muted)]")}>
        {checked && <FiCheck />}
      </span>
      {children}
    </label>
  );
}

function FormFooterActions({ isEdit, onDelete, onClose, submitLabel = "Save" }) {
  return (
    <div className="sticky bottom-0 z-10 -mx-5 -mb-5 mt-6 flex flex-col gap-3 border-t border-[var(--border)] bg-[#101010]/95 px-5 py-4 backdrop-blur sm:-mx-9 sm:-mb-7 sm:flex-row sm:items-center sm:justify-between sm:px-9">
      {isEdit ? (
        <Button type="button" variant="danger" onClick={onDelete} className="w-full sm:w-auto"><FiTrash2 /> Delete</Button>
      ) : (
        <p className="hidden text-sm text-[var(--muted)] sm:block">Changes are saved to your protected workspace.</p>
      )}
      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <Button type="button" variant="secondary" onClick={onClose} className="w-full sm:w-auto">Cancel</Button>
        <Button type="submit" className="w-full min-w-36 shadow-[0_14px_34px_rgba(230,185,87,0.16)] sm:w-auto"><FiCheck /> {submitLabel}</Button>
      </div>
    </div>
  );
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
    <ComposerSection
      icon={FiClock}
      eyebrow="Reminder"
      title={label}
      helper="Choose when TaskNote should nudge you and which channel should deliver it."
      className="border-[var(--gold)]/20 bg-[linear-gradient(145deg,rgba(230,185,87,0.08),rgba(16,16,16,0.92)_42%)]"
    >
      <ComposerField label="Reminder time" helper="Leave empty to skip reminders for this item.">
        <Input
          className="h-12 w-full rounded-xl bg-black/30 focus:shadow-[0_0_0_3px_rgba(230,185,87,0.12)]"
          type="datetime-local"
          value={current.reminderAt}
          onChange={(event) => set({ reminderAt: event.target.value })}
        />
      </ComposerField>
      <div className="mt-5 grid min-w-0 gap-5 lg:grid-cols-2">
        <div className="min-w-0">
          <p className="mb-3 text-sm font-black text-[var(--secondary)]">Timing</p>
          <div className="flex flex-wrap gap-2">
            {[30, 5, 1, 0].map((offset) => (
              <SelectableChip
                key={offset}
                name={`reminder-offset-${offset}`}
                checked={current.reminderOffsets.includes(offset)}
                onChange={() => toggle("reminderOffsets", offset)}
              >
                {offset === 0 ? "At due time" : `${offset} min before`}
              </SelectableChip>
            ))}
          </div>
        </div>
        <div className="min-w-0">
          <p className="mb-3 text-sm font-black text-[var(--secondary)]">Channels</p>
          <div className="flex flex-wrap gap-2">
            {["push", "email"].map((channel) => (
              <SelectableChip
                key={channel}
                name={`reminder-channel-${channel}`}
                checked={current.reminderChannels.includes(channel)}
                onChange={() => toggle("reminderChannels", channel)}
              >
                {channel === "push" ? "Push" : "Email"}
              </SelectableChip>
            ))}
          </div>
        </div>
      </div>
    </ComposerSection>
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
  const isTask = title.toLowerCase().includes("task");
  const isEdit = title.toLowerCase().includes("edit");
  const helper = isTask
    ? "Capture the work, set the plan, and stay on track."
    : "Shape the thought, connect the context, and revisit it later.";
  return (
    <div className="fixed inset-0 z-50 grid items-end overflow-hidden bg-black/75 p-0 backdrop-blur-md sm:place-items-center sm:p-4" onMouseDown={onClose}>
      <div
        className="flex max-h-[calc(100dvh-0.5rem)] w-full max-w-[min(60rem,calc(100vw-1rem))] flex-col overflow-hidden rounded-t-[28px] border border-[var(--border)] bg-[radial-gradient(circle_at_top_left,rgba(230,185,87,0.08),transparent_28%),var(--card)] shadow-[0_30px_120px_rgba(0,0,0,0.72)] sm:max-h-[calc(100dvh-2rem)] sm:rounded-[30px]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-5 sm:px-9 sm:py-6">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.42em] text-[var(--gold)]">TaskNote</p>
            <div className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-1">
              <h2 className="text-3xl font-black leading-none tracking-[-0.03em] text-[var(--text)] sm:text-4xl">{title}</h2>
              <span className="mb-1 rounded-full border border-[var(--gold)]/25 bg-[var(--gold-bg)] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--gold)]">
                {isEdit ? "Edit" : "New"} {isTask ? "task" : "note"}
              </span>
            </div>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--secondary)]">{helper}</p>
          </div>
          <button
            type="button"
            aria-label={`Close ${title}`}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--border)] bg-white/[0.03] text-[var(--secondary)] transition hover:border-[var(--gold)]/45 hover:bg-[var(--gold-bg)] hover:text-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/40 sm:h-11 sm:w-11"
            onClick={onClose}
          >
            <FiX />
          </button>
        </div>
        <div className="no-scrollbar min-h-0 overflow-y-auto overscroll-contain p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] sm:p-7 sm:px-9">{children}</div>
      </div>
    </div>
  );
}

function NoteForm({ note, notes = [], onSave, onDelete, onClose }) {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [pinned, setPinned] = useState(Boolean(note?.pinned));
  const [template, setTemplate] = useState(note?.template || "");
  const [preview, setPreview] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [reminder, setReminder] = useState({
    reminderAt: note?.reminderAt || "",
    reminderOffsets: note?.reminderOffsets || [30, 5, 1],
    reminderChannels: note?.reminderChannels || [],
  });
  const linksTo = useMemo(() => extractBacklinks(content), [content]);
  const linkedFrom = useMemo(() => {
    if (!note?.title) return [];
    const titleKey = note.title.trim().toLowerCase();
    return notes
      .filter((item) => item.id !== note.id)
      .filter((item) => extractBacklinks(item.content || "").some((link) => link.toLowerCase() === titleKey));
  }, [note, notes]);
  useEffect(() => {
    if (!note || !showVersions) return;
    let alive = true;
    setVersionsLoading(true);
    unwrap(apiClient.get(`/api/notes/${note.id}/versions`))
      .then((data) => {
        if (alive) setVersions(data.versions || []);
      })
      .catch((error) => toast.error(getErrorMessage(error, "Could not load note versions")))
      .finally(() => {
        if (alive) setVersionsLoading(false);
      });
    return () => { alive = false; };
  }, [note, showVersions]);
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
    <form className="min-w-0 space-y-5" onSubmit={(event) => { event.preventDefault(); if (!title.trim()) return toast.error("Title is required"); onSave({ title, content, pinned, template, ...reminder }); onClose(); }}>
      <ComposerSection icon={FiFileText} eyebrow="Main note" title="Write it down" helper="Start with a clear title, then add Markdown, checklists, or [[linked notes]].">
        <ComposerField label="Note title">
          <Input
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Capture an idea..."
            className="h-14 w-full rounded-2xl bg-black/30 text-lg font-bold focus:shadow-[0_0_0_3px_rgba(230,185,87,0.12)]"
          />
        </ComposerField>
        <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <ComposerField label="Template" className="mb-0">
            <Select value={template} onChange={(event) => applyTemplate(event.target.value)} className="h-12 rounded-xl bg-black/30">
              <option value="">Blank note</option>
              <option value="meeting">Meeting notes</option>
              <option value="journal">Daily journal</option>
              <option value="study">Study notes</option>
              <option value="project">Project plan</option>
              <option value="bug">Bug report</option>
              <option value="ideas">Ideas list</option>
              <option value="weekly">Weekly review</option>
            </Select>
          </ComposerField>
          <div className="self-end">
            <Button type="button" variant="secondary" className="h-12 w-full sm:w-auto" onClick={() => setPreview((value) => !value)}>{preview ? "Edit" : "Preview"}</Button>
          </div>
        </div>
        <ComposerField label="Content" helper="Markdown is supported. Use [[note title]] to create backlinks." className="mt-4">
          {preview ? (
            <MarkdownPreview content={content} />
          ) : (
            <Textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="# Project thought&#10;&#10;Write the rough version here..."
              className="min-h-[220px] w-full rounded-2xl bg-black/30 leading-7 focus:shadow-[0_0_0_3px_rgba(230,185,87,0.12)]"
            />
          )}
        </ComposerField>
        <div className="mt-4">
          <SelectableChip checked={pinned} onChange={(event) => setPinned(event.target.checked)} name="pin-note">Pin note</SelectableChip>
        </div>
      </ComposerSection>
      {(linksTo.length > 0 || linkedFrom.length > 0) && (
        <ComposerSection icon={FiRepeat} eyebrow="Knowledge" title="Linked thinking" helper="Backlinks update from the note content as you write.">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.14em] text-[var(--gold)]">Links to</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {linksTo.length ? linksTo.map((link) => <span key={link} className="rounded-md border border-[var(--border)] px-2 py-1 text-sm text-[var(--secondary)]">[[{link}]]</span>) : <span className="text-sm text-[var(--muted)]">No outgoing links.</span>}
            </div>
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.14em] text-[var(--gold)]">Linked from</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {linkedFrom.length ? linkedFrom.map((item) => <span key={item.id} className="rounded-md border border-[var(--border)] px-2 py-1 text-sm text-[var(--secondary)]">{item.title}</span>) : <span className="text-sm text-[var(--muted)]">No backlinks yet.</span>}
            </div>
          </div>
        </div>
        </ComposerSection>
      )}
      {note && (
        <ComposerSection icon={FiClock} eyebrow="History" title="Version history" helper="Preview and restore earlier note snapshots without leaving the composer.">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-[var(--secondary)]">Restore an earlier note snapshot.</p>
            </div>
            <Button type="button" variant="secondary" onClick={() => setShowVersions((value) => !value)}>{showVersions ? "Hide" : "Show"}</Button>
          </div>
          {showVersions && (
            <div className="mt-4 space-y-3">
              {versionsLoading && <p className="text-sm text-[var(--secondary)]">Loading versions...</p>}
              {!versionsLoading && versions.length === 0 && <p className="text-sm text-[var(--secondary)]">No previous versions yet.</p>}
              {!versionsLoading && versions.map((version) => (
                <div key={version.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold">{version.title || "Untitled"}</p>
                    <p className="text-xs text-[var(--muted)]">{new Date(version.createdAt).toLocaleString()}</p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={async () => {
                      try {
                        await unwrap(apiClient.post(`/api/notes/${note.id}/versions/${version.id}/restore`));
                        setTitle(version.title || "");
                        setContent(version.content || "");
                        onSave({ title: version.title || "", content: version.content || "", pinned, template, ...reminder });
                        toast.success("Version restored");
                      } catch (error) {
                        toast.error(getErrorMessage(error, "Could not restore version"));
                      }
                    }}
                  >
                    Restore
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ComposerSection>
      )}
      <ReminderControls value={reminder} onChange={setReminder} label="Revisit reminder" />
      <FormFooterActions
        isEdit={Boolean(note)}
        onDelete={() => { onDelete(note.id); onClose(); }}
        onClose={onClose}
        submitLabel={note ? "Save note" : "Create note"}
      />
    </form>
  );
}

function TaskForm({ task, onSave, onDelete, onClose }) {
  const [form, setForm] = useState({ title: task?.title || "", description: task?.description || "", status: task?.status || "todo", priority: task?.priority || "medium", dueDate: task?.dueDate || "", important: Boolean(task?.important), urgent: Boolean(task?.urgent), estimatedMinutes: task?.estimatedMinutes || 25, recurringRule: task?.recurringRule || "", subtasksText: (task?.subtasks || []).map((item) => item.title || item).join("\n"), dependenciesText: (task?.dependencies || []).join(", "), reminderAt: task?.reminderAt || "", reminderOffsets: task?.reminderOffsets || [30, 5, 1], reminderChannels: task?.reminderChannels || [] });
  const [natural, setNatural] = useState("");
  const set = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const payload = () => ({
    ...form,
    estimatedMinutes: Number(form.estimatedMinutes || 0),
    subtasks: form.subtasksText.split("\n").map((title) => title.trim()).filter(Boolean).map((title) => ({ title, done: false })),
    dependencies: form.dependenciesText.split(",").map((item) => item.trim()).filter(Boolean),
  });
  return (
    <form className="min-w-0 space-y-5" onSubmit={(event) => { event.preventDefault(); if (!form.title.trim()) return toast.error("Task title is required"); onSave(payload()); onClose(); }}>
      {!task && (
        <ComposerSection icon={FiZap} eyebrow="Smart capture" title="Natural language task" helper="Paste a rough task and TaskNote will extract date, priority, reminders, and recurrence where possible.">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <Input
              value={natural}
              onChange={(event) => setNatural(event.target.value)}
              placeholder="Submit report tomorrow 5pm high priority"
              className="h-12 rounded-xl bg-black/30 focus:shadow-[0_0_0_3px_rgba(230,185,87,0.12)]"
            />
            <Button type="button" variant="secondary" className="h-12" onClick={() => { const parsed = parseNaturalTask(natural); setForm((current) => ({ ...current, ...parsed })); }}>Preview parse</Button>
          </div>
          {natural && <p className="mt-3 text-sm text-[var(--secondary)]">TaskNote will parse date, priority, reminders, and recurrence before saving.</p>}
        </ComposerSection>
      )}
      <ComposerSection icon={FiCheckSquare} eyebrow="Main task" title="Define the work" helper="Give the task a clear outcome and enough context to make the next action obvious.">
        <ComposerField label="Task title">
          <Input
            autoFocus
            value={form.title}
            onChange={(event) => set("title", event.target.value)}
            placeholder="Draft the launch checklist"
            className="h-14 w-full rounded-2xl bg-black/30 text-lg font-bold focus:shadow-[0_0_0_3px_rgba(230,185,87,0.12)]"
          />
        </ComposerField>
        <ComposerField label="Description" helper="Add context, success criteria, links, or the first next step." className="mt-4">
          <Textarea
            value={form.description}
            onChange={(event) => set("description", event.target.value)}
            placeholder="What needs to happen? What would make this task complete?"
            className="min-h-[150px] w-full rounded-2xl bg-black/30 leading-7 focus:shadow-[0_0_0_3px_rgba(230,185,87,0.12)]"
          />
        </ComposerField>
      </ComposerSection>
      <ComposerSection icon={FiCalendar} eyebrow="Planning" title="Schedule and prioritize" helper="These details drive the dashboard, calendar, board, reminders, and analytics.">
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ComposerField label="Status">
            <Select className="h-12 rounded-xl bg-black/30" value={form.status} onChange={(event) => set("status", event.target.value)}><option value="todo">todo</option><option value="doing">doing</option><option value="done">done</option></Select>
          </ComposerField>
          <ComposerField label="Priority">
            <Select className="h-12 rounded-xl bg-black/30" value={form.priority} onChange={(event) => set("priority", event.target.value)}><option value="low">low</option><option value="medium">medium</option><option value="high">high</option><option value="urgent">urgent</option></Select>
          </ComposerField>
          <ComposerField label="Due date">
            <Input className="h-12 rounded-xl bg-black/30" type="date" value={form.dueDate} onChange={(event) => set("dueDate", event.target.value)} />
          </ComposerField>
          <ComposerField label="Estimate" helper="Minutes">
            <Input className="h-12 rounded-xl bg-black/30" type="number" min="1" value={form.estimatedMinutes} onChange={(event) => set("estimatedMinutes", event.target.value)} placeholder="25" />
          </ComposerField>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <SelectableChip checked={form.important} onChange={(event) => set("important", event.target.checked)} name="task-important">Important</SelectableChip>
          <SelectableChip checked={form.urgent} onChange={(event) => set("urgent", event.target.checked)} name="task-urgent">Urgent</SelectableChip>
        </div>
      </ComposerSection>
      <ComposerSection icon={FiRepeat} eyebrow="Advanced" title="Break it down" helper="Use subtasks, dependencies, and recurrence for work that needs more structure.">
        <div className="grid min-w-0 gap-4 lg:grid-cols-2">
          <ComposerField label="Subtasks" helper="One subtask per line.">
            <Textarea
              value={form.subtasksText}
              onChange={(event) => set("subtasksText", event.target.value)}
              placeholder="Research options&#10;Draft outline&#10;Send for review"
              className="min-h-36 rounded-2xl bg-black/30 leading-7 focus:shadow-[0_0_0_3px_rgba(230,185,87,0.12)]"
            />
          </ComposerField>
          <div className="min-w-0 space-y-4">
            <ComposerField label="Dependencies" helper="Enter task IDs separated by commas if this task is blocked by other work.">
              <Input
                value={form.dependenciesText}
                onChange={(event) => set("dependenciesText", event.target.value)}
                placeholder="Blocked by task IDs, comma separated"
                className="h-12 w-full rounded-xl bg-black/30"
              />
            </ComposerField>
            <ComposerField label="Recurrence" helper={form.recurringRule ? "A new occurrence will be scheduled when this task is completed." : "Keep this empty for one-off tasks."}>
              <Select className="h-12 rounded-xl bg-black/30" value={form.recurringRule} onChange={(event) => set("recurringRule", event.target.value)}>
                <option value="">No recurring</option>
                <option value="daily">Daily</option>
                <option value="weekdays">Weekdays</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </Select>
            </ComposerField>
          </div>
        </div>
      </ComposerSection>
      <ReminderControls value={form} onChange={(next) => setForm((current) => ({ ...current, ...next }))} />
      <FormFooterActions
        isEdit={Boolean(task)}
        onDelete={() => { onDelete(task.id); onClose(); }}
        onClose={onClose}
        submitLabel={task ? "Save task" : "Create task"}
      />
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
  const mobileItems = [navItems[0], navItems[2], navItems[3], navItems[5]];
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

function CommandPalette({ open, onClose, openNote, openTask, data }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(0);
  const [remoteResults, setRemoteResults] = useState(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const input = useRef(null);
  useEffect(() => { if (open) setTimeout(() => input.current?.focus(), 20); }, [open]);
  useEffect(() => {
    const handler = (event) => {
      if (event.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);
  const normalizedQuery = query.toLowerCase().trim();
  const typeMatch = normalizedQuery.match(/\btype:(notes?|tasks?|projects?|habits?|inbox|tags?|reminders?)\b/);
  const activeFilter = typeMatch ? typeMatch[1].replace(/s$/, "") : filter;
  const cleanQuery = normalizedQuery
    .replace(/\btype:\S+\b/g, "")
    .replace(/\bdue:\S+\b/g, "")
    .replace(/\bpriority:\S+\b/g, "")
    .replace(/\bstatus:\S+\b/g, "")
    .replace(/\btag:\S+\b/g, "")
    .trim();

  useEffect(() => {
    if (!open || !cleanQuery) {
      setRemoteResults(null);
      return undefined;
    }
    let alive = true;
    const timer = window.setTimeout(async () => {
      try {
        setLoadingSearch(true);
        const params = new URLSearchParams({ q: cleanQuery });
        if (activeFilter !== "all") params.set("type", activeFilter);
        const result = await unwrap(apiClient.get(`/api/search?${params.toString()}`));
        if (alive) setRemoteResults(result.results || null);
      } catch {
        if (alive) setRemoteResults(null);
      } finally {
        if (alive) setLoadingSearch(false);
      }
    }, 220);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [activeFilter, cleanQuery, open]);

  const actions = [
    { section: "Create", label: "New Task", icon: FiCheckSquare, run: openTask },
    { section: "Create", label: "New Note", icon: FiFileText, run: openNote },
    { section: "Create", label: "New Inbox Capture", icon: FiInbox, run: () => data.createInboxItem({ title: query || "Untitled capture", typeSuggestion: "idea" }) },
    { section: "Create", label: "New Reminder", icon: FiZap, run: () => navigate("/reminders") },
    { section: "Create", label: "Start Focus Session", icon: FiClock, run: () => navigate("/focus") },
    ...navItems.map((item) => ({ section: "Go to", label: item.label === "Board" ? "Kanban Board" : item.label, icon: item.icon, run: () => navigate(item.to) })),
    { section: "Go to", label: "Settings", icon: FiSettings, run: () => navigate("/settings") },
  ].filter((item) => item.label.toLowerCase().includes(cleanQuery) || !cleanQuery);

  const localSearch = [
    ...(data.notes || []).map((item) => ({ type: "note", icon: FiFileText, title: item.title, preview: item.content, meta: item.pinned ? "Pinned note" : "Note", run: () => openNote(item) })),
    ...(data.tasks || []).map((item) => ({ type: "task", icon: FiCheckSquare, title: item.title, preview: item.description, meta: `${item.status} · ${item.priority}${item.dueDate ? ` · ${formatDate(item.dueDate)}` : ""}`, run: () => openTask(item) })),
    ...(data.projects || []).map((item) => ({ type: "project", icon: FiFolder, title: item.name, preview: item.description, meta: item.status || "Project", run: () => navigate("/projects") })),
    ...(data.habits || []).map((item) => ({ type: "habit", icon: FiActivity, title: item.name, preview: `${item.completions?.length || 0} completions`, meta: "Habit", run: () => navigate("/habits") })),
    ...(data.tags || []).map((item) => ({ type: "tag", icon: FiTag, title: item.name, preview: "Color-coded label", meta: "Tag", run: () => navigate("/tags") })),
    ...(data.inboxItems || []).map((item) => ({ type: "inbox", icon: FiInbox, title: item.title, preview: item.content, meta: item.status || "Inbox", run: () => navigate("/inbox") })),
    ...(data.reminders || []).map((item) => ({ type: "reminder", icon: FiZap, title: item.title, preview: item.message, meta: item.dueAt ? new Date(item.dueAt).toLocaleString() : "Reminder", run: () => navigate("/reminders") })),
  ].filter((item) => {
    const matchesFilter = activeFilter === "all" || item.type === activeFilter || `${item.type}s` === activeFilter;
    const text = [item.title, item.preview, item.meta].join(" ").toLowerCase();
    return matchesFilter && (!cleanQuery || text.includes(cleanQuery));
  });

  const remoteFlat = remoteResults
    ? Object.entries(remoteResults).flatMap(([type, rows]) => (rows || []).map((row) => ({
      type: type.replace(/s$/, ""),
      icon: type.startsWith("task") ? FiCheckSquare : type.startsWith("project") ? FiFolder : type.startsWith("habit") ? FiActivity : type.startsWith("inbox") ? FiInbox : FiFileText,
      title: row.title || row.name || "Untitled",
      preview: row.content || row.description || row.status || "",
      meta: type.replace(/s$/, ""),
      run: () => {
        if (type.startsWith("note")) openNote((data.notes || []).find((note) => note.id === row.id) || null);
        else if (type.startsWith("task")) openTask((data.tasks || []).find((task) => task.id === row.id) || null);
        else navigate(type.startsWith("project") ? "/projects" : type.startsWith("habit") ? "/habits" : type.startsWith("inbox") ? "/inbox" : "/tags");
      },
    })))
    : null;
  const results = remoteFlat?.length ? remoteFlat : localSearch.slice(0, 14);
  const executable = [...actions, ...results];
  useEffect(() => setSelected(0), [query, filter, open]);
  const runSelected = () => {
    const item = executable[selected];
    if (item) {
      item.run();
      onClose();
    }
  };
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 p-3 backdrop-blur-sm sm:p-4"
      onMouseDown={onClose}
      onKeyDown={(event) => {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setSelected((value) => Math.min(executable.length - 1, value + 1));
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          setSelected((value) => Math.max(0, value - 1));
        }
        if (event.key === "Enter") {
          event.preventDefault();
          runSelected();
        }
      }}
    >
      <div className="mx-auto mt-14 max-h-[78vh] w-full max-w-[640px] overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--text)] shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex h-16 items-center gap-3 border-b border-[var(--border)] px-4">
          <FiSearch className="text-2xl text-[var(--muted)]" />
          <input ref={input} value={query} onChange={(event) => setQuery(event.target.value)} className="h-full flex-1 bg-transparent text-xl outline-none placeholder:text-[var(--muted)]" placeholder="Search or try filters: type:task tag:work priority:high due:today" />
          <button onClick={onClose} className="text-2xl text-[var(--muted)]"><FiX /></button>
        </div>
        <div className="flex gap-2 overflow-x-auto border-b border-[var(--border)] px-3 py-3">
          {["all", "note", "task", "project", "habit", "inbox"].map((item) => (
            <button key={item} onClick={() => setFilter(item)} className={cls("rounded-full border px-3 py-1 text-xs font-black uppercase", activeFilter === item ? "border-[var(--gold)] bg-[var(--gold-bg)] text-[var(--gold)]" : "border-[var(--border)] text-[var(--secondary)]")}>{item}</button>
          ))}
        </div>
        <div className="max-h-[calc(78vh-64px)] overflow-y-auto p-3">
          {["Create", "Go to"].map((section) => (
            <div key={section} className="border-b border-[var(--border)] py-2 last:border-0">
              <p className="px-2 py-2 text-sm font-bold text-[var(--muted)]">{section}</p>
              {actions.filter((item) => item.section === section).map((item) => {
                const Icon = item.icon;
                const index = executable.indexOf(item);
                return <button key={item.label} onClick={() => { item.run(); onClose(); }} className={cls("flex h-14 w-full items-center gap-4 rounded-md px-3 text-left text-lg font-bold transition hover:bg-[var(--gold-bg)]", selected === index && "bg-white/10 text-[var(--gold)]")}><Icon className="text-2xl" /> {item.label}</button>;
              })}
            </div>
          ))}
          <div className="border-b border-[var(--border)] py-2">
            <p className="px-2 py-2 text-sm font-bold text-[var(--muted)]">{loadingSearch ? "Searching..." : "Results"}</p>
            {results.length ? results.map((item) => {
              const Icon = item.icon;
              const index = executable.indexOf(item);
              return (
                <button key={`${item.type}-${item.title}-${index}`} onClick={() => { item.run(); onClose(); }} className={cls("flex w-full items-start gap-4 rounded-md px-3 py-3 text-left transition hover:bg-[var(--gold-bg)]", selected === index && "bg-white/10")}>
                  <Icon className="mt-1 shrink-0 text-xl text-[var(--gold)]" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 font-black"><span className="truncate">{item.title}</span><span className="rounded bg-[var(--elevated)] px-2 py-0.5 text-[10px] uppercase tracking-widest text-[var(--secondary)]">{item.type}</span></span>
                    <span className="mt-1 block truncate text-sm text-[var(--secondary)]">{item.preview || item.meta}</span>
                  </span>
                </button>
              );
            }) : <p className="px-3 py-5 text-sm text-[var(--secondary)]">No matching notes, tasks, projects, habits, inbox items, or reminders.</p>}
          </div>
          <div className="p-2 text-sm text-[var(--muted)]">Try: <kbd>type:task</kbd> <kbd>due:today</kbd> <kbd>reminder:today</kbd> <kbd>priority:high</kbd> <kbd>tag:work</kbd></div>
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
  const graph = data.graph || { nodes: [], edges: [] };
  const nodeById = new Map((graph.nodes || []).map((node) => [node.id, node]));
  const NoteCard = ({ note }) => (
    <button onClick={() => openNote(note)} className="w-full max-w-[412px] rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-left transition hover:border-[var(--gold)]/45" style={{ borderColor: note.color ? `${note.color}99` : undefined }}>
      <h3 className="text-xl font-black">{note.title}</h3>
      <div className="mt-3"><SyncBadge item={note} /></div>
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
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black">Knowledge Graph</h2>
            <p className="mt-1 text-[var(--secondary)]">Connect notes with <span className="font-bold text-[var(--gold)]">[[note title]]</span> links.</p>
          </div>
          <Button variant="secondary" onClick={data.refreshGraph}>Refresh graph</Button>
        </div>
        {(graph.edges || []).length ? (
          <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_1fr]">
            <div className="relative min-h-72 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--elevated)] p-5">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {(graph.nodes || []).map((node, index) => (
                  <button
                    key={node.id}
                    onClick={() => openNote(data.notes.find((note) => note.id === node.id) || null)}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 text-left transition hover:border-[var(--gold)]/50"
                    style={{ transform: `translateY(${index % 2 ? 18 : 0}px)` }}
                  >
                    <span className="mb-3 block h-2 w-10 rounded-full bg-[var(--gold)]" />
                    <span className="line-clamp-2 font-black">{node.title}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {(graph.edges || []).map((edge) => (
                <div key={`${edge.from}-${edge.to}`} className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--elevated)] p-3 text-sm">
                  <span className="font-bold">{nodeById.get(edge.from)?.title || edge.from}</span>
                  <span className="text-[var(--gold)]">{"->"}</span>
                  <span className="text-[var(--secondary)]">{nodeById.get(edge.to)?.title || edge.label || edge.to}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState icon={FiGrid} title="No note links yet." text="Create links using [[note title]] to build your knowledge graph." className="mt-6 min-h-64" />
        )}
      </Card>
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

function SyncBadge({ item }) {
  if (!item?._syncStatus || item._syncStatus === "synced") return null;
  const styles = {
    queued: "border-[var(--gold)]/35 bg-[var(--gold-bg)] text-[var(--gold)]",
    syncing: "border-sky-400/30 bg-sky-400/10 text-sky-200",
    failed: "border-red-400/30 bg-red-500/10 text-red-200",
    conflict: "border-orange-400/30 bg-orange-500/10 text-orange-200",
  };
  const label = item._syncStatus === "queued" ? "Pending sync" : item._syncStatus;
  return <span className={cls("inline-flex w-fit items-center rounded-md border px-2 py-1 text-xs font-black uppercase tracking-[0.08em]", styles[item._syncStatus] || styles.queued)}>{label}</span>;
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

function InboxPage({ data, openNote, openTask }) {
  const [title, setTitle] = useState("");
  const active = (data.inboxItems || []).filter((item) => item.status === "unprocessed");
  const capture = (event) => {
    event.preventDefault();
    if (!title.trim()) return;
    const parsed = parseNaturalTask(title);
    const typeSuggestion = parsed.dueDate || parsed.priority !== "medium" || parsed.recurringRule ? "task" : "idea";
    data.createInboxItem({ title, typeSuggestion, source: "inbox" });
    setTitle("");
  };
  return (
    <>
      <PageHeader title="Inbox" subtitle="Capture now. Decide what it becomes later." action={<Button onClick={() => setTitle("")}><FiPlus /> Capture</Button>} />
      <Card className="p-5">
        <form onSubmit={capture} className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Drop a thought, task, habit, or reminder..." />
          <Button><FiInbox /> Add to Inbox</Button>
        </form>
      </Card>
      <div className="mt-7 grid gap-4 xl:grid-cols-2">
        {active.length ? active.map((item) => (
          <Card key={item.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <span className="rounded-md border border-[var(--gold)]/30 bg-[var(--gold-bg)] px-2 py-1 text-xs font-black uppercase text-[var(--gold)]">{item.typeSuggestion}</span>
                <h2 className="mt-4 break-words text-xl font-black">{item.title}</h2>
                {item.content && <p className="mt-2 text-[var(--secondary)]">{item.content}</p>}
              </div>
              <Button variant="ghost" onClick={() => data.updateInboxItem(item.id, { status: "archived" })}>Archive</Button>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => data.convertInboxItem(item.id, "note").then(() => openNote(null))}>To note</Button>
              <Button variant="secondary" onClick={() => data.convertInboxItem(item.id, "task").then(() => openTask(null))}>To task</Button>
              <Button variant="secondary" onClick={() => data.convertInboxItem(item.id, "habit")}>To habit</Button>
              <Button variant="danger" onClick={() => data.deleteInboxItem(item.id)}>Delete</Button>
            </div>
          </Card>
        )) : <EmptyState icon={FiInbox} title="Your mind is clear." text="Capture anything here when it is too early to organize it." className="xl:col-span-2" />}
      </div>
    </>
  );
}

function PlannerPage({ data }) {
  const [form, setForm] = useState({ title: "", startAt: `${todayKey()}T09:00`, endAt: `${todayKey()}T09:30`, taskId: "" });
  const todaysBlocks = (data.timeBlocks || []).filter((block) => dateOnly(block.startAt) === todayKey()).sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
  const set = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  return (
    <>
      <PageHeader title="Planner" subtitle="Turn tasks into protected time blocks." />
      <Card className="p-5">
        <form className="grid gap-3 xl:grid-cols-[1fr_210px_210px_220px_auto]" onSubmit={(event) => { event.preventDefault(); if (!form.title.trim()) return toast.error("Block title is required"); data.createTimeBlock({ ...form, reminderOffsets: [5], reminderChannels: [] }); setForm((current) => ({ ...current, title: "" })); }}>
          <Input value={form.title} onChange={(event) => set("title", event.target.value)} placeholder="Plan a block..." />
          <Input type="datetime-local" value={form.startAt} onChange={(event) => set("startAt", event.target.value)} />
          <Input type="datetime-local" value={form.endAt} onChange={(event) => set("endAt", event.target.value)} />
          <Select value={form.taskId} onChange={(event) => set("taskId", event.target.value)}><option value="">No linked task</option>{data.tasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}</Select>
          <Button><FiPlus /> Schedule</Button>
        </form>
      </Card>
      <Card className="mt-7 p-6">
        <h2 className="text-xl font-black">Today timeline</h2>
        <div className="mt-5 space-y-3">
          {todaysBlocks.length ? todaysBlocks.map((block) => (
            <div key={block.id} className="grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--elevated)] p-4 sm:grid-cols-[140px_1fr_auto] sm:items-center">
              <span className="font-black text-[var(--gold)]">{new Date(block.startAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {new Date(block.endAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              <div><p className="font-black">{block.title}</p><p className="text-sm text-[var(--secondary)]">{block.status}</p></div>
              <Button variant={block.status === "completed" ? "secondary" : "primary"} onClick={() => data.updateTimeBlock(block.id, { status: block.status === "completed" ? "planned" : "completed" })}>{block.status === "completed" ? "Reopen" : "Complete"}</Button>
            </div>
          )) : <EmptyState icon={FiClock} title="No blocks planned." text="Schedule your first focused block above." />}
        </div>
      </Card>
    </>
  );
}

function ProjectsPage({ data }) {
  const [project, setProject] = useState({ name: "", description: "", color: gold });
  return (
    <>
      <PageHeader title="Projects" subtitle="Group work into focused outcomes." />
      <Card className="p-5">
        <form className="grid gap-3 lg:grid-cols-[1fr_1fr_160px_auto]" onSubmit={(event) => { event.preventDefault(); if (!project.name.trim()) return; data.createProject(project); setProject({ name: "", description: "", color: gold }); }}>
          <Input value={project.name} onChange={(event) => setProject((current) => ({ ...current, name: event.target.value }))} placeholder="Project name" />
          <Input value={project.description} onChange={(event) => setProject((current) => ({ ...current, description: event.target.value }))} placeholder="Description" />
          <div className="flex items-center gap-2">{colors.slice(0, 4).map((item) => <ColorSwatch key={item} color={item} selected={project.color === item} onClick={() => setProject((current) => ({ ...current, color: item }))} />)}</div>
          <Button><FiPlus /> Add</Button>
        </form>
      </Card>
      <div className="mt-7 grid gap-4 xl:grid-cols-3">
        {(data.projects || []).length ? data.projects.map((item) => {
          const tasks = data.tasks.filter((task) => task.projectId === item.id);
          const done = tasks.filter((task) => task.status === "done").length;
          const progress = tasks.length ? Math.round((done / tasks.length) * 100) : item.progress || 0;
          return (
            <Card key={item.id} className="p-5">
              <div className="flex items-start justify-between gap-4"><div><span className="block h-3 w-12 rounded-full" style={{ background: item.color }} /><h2 className="mt-4 text-xl font-black">{item.name}</h2><p className="mt-2 text-[var(--secondary)]">{item.description || "No description yet."}</p></div><Button variant="ghost" onClick={() => data.archiveProject(item.id)}>Archive</Button></div>
              <div className="mt-5 h-2 rounded-full bg-[var(--elevated)]"><span className="block h-2 rounded-full bg-[var(--gold)]" style={{ width: `${progress}%` }} /></div>
              <p className="mt-3 text-sm text-[var(--secondary)]">{progress}% complete · {tasks.length} tasks</p>
            </Card>
          );
        }) : <EmptyState icon={FiFolder} title="No projects yet." text="Create a project to connect tasks, notes, and focus time." className="xl:col-span-3" />}
      </div>
    </>
  );
}

function TemplatesPage({ data, openNote, openTask }) {
  const [form, setForm] = useState({ name: "", type: "note", body: "" });
  return (
    <>
      <PageHeader title="Templates" subtitle="Start repeated work from a polished structure." />
      <Card className="p-5">
        <form className="grid gap-3 lg:grid-cols-[1fr_160px_1fr_auto]" onSubmit={(event) => { event.preventDefault(); if (!form.name.trim()) return; data.createTemplate(form); setForm({ name: "", type: "note", body: "" }); }}>
          <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Template name" />
          <Select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}><option value="note">note</option><option value="task">task</option><option value="project">project</option><option value="review">review</option></Select>
          <Input value={form.body} onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))} placeholder="Starter content" />
          <Button><FiPlus /> Save</Button>
        </form>
      </Card>
      <div className="mt-7 grid gap-4 xl:grid-cols-3">
        {(data.templates || []).map((template) => (
          <Card key={template.id} className="p-5">
            <span className="rounded-md border border-[var(--gold)]/30 bg-[var(--gold-bg)] px-2 py-1 text-xs font-black uppercase text-[var(--gold)]">{template.type}</span>
            <h2 className="mt-4 text-xl font-black">{template.name}</h2>
            <p className="mt-2 line-clamp-3 whitespace-pre-line text-[var(--secondary)]">{template.body || "Structured starter template."}</p>
            <div className="mt-5 flex gap-2">
              {template.type === "note" && <Button variant="secondary" onClick={() => { data.createNote({ title: template.name, content: template.body, template: template.name }); openNote(null); }}>Use</Button>}
              {template.type === "task" && <Button variant="secondary" onClick={() => { data.createTask({ title: template.name, description: template.body, ...(template.defaults || {}) }); openTask(null); }}>Use</Button>}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

function ReviewsPage({ data, stats }) {
  const [type, setType] = useState("daily");
  const [reflection, setReflection] = useState("");
  const metrics = { completedTasks: stats.completedThisWeek.length, focusMinutes: stats.focusToday, overdueTasks: stats.overdue.length, notesCreated: data.notes.filter((note) => note.createdAt?.slice(0, 10) === todayKey()).length };
  return (
    <>
      <PageHeader title="Reviews" subtitle="Turn activity into reflection and better planning." />
      <Card className="p-6">
        <div className="flex flex-wrap gap-3">{["daily", "weekly", "monthly"].map((item) => <Button key={item} variant={type === item ? "primary" : "secondary"} onClick={() => setType(item)}>{item}</Button>)}</div>
        <div className="mt-6 grid gap-4 sm:grid-cols-4">{Object.entries(metrics).map(([label, value]) => <div key={label} className="rounded-xl border border-[var(--border)] bg-[var(--elevated)] p-4"><p className="text-xs uppercase tracking-[0.14em] text-[var(--secondary)]">{label.replace(/([A-Z])/g, " $1")}</p><strong className="text-3xl">{value}</strong></div>)}</div>
        <Textarea className="mt-6 w-full" value={reflection} onChange={(event) => setReflection(event.target.value)} placeholder="What worked, what dragged, and what should move forward?" />
        <Button className="mt-4" onClick={() => { data.createReview({ type, metrics, reflection }); setReflection(""); }}>Save review</Button>
      </Card>
      <div className="mt-7 space-y-4">{(data.reviews || []).length ? data.reviews.map((review) => <Card key={review.id} className="p-5"><p className="text-sm font-black uppercase tracking-[0.14em] text-[var(--gold)]">{review.type}</p><p className="mt-2 text-[var(--secondary)]">{review.reflection || "No reflection text."}</p></Card>) : <EmptyState title="No reviews saved." text="Start with today's review to build a planning streak." />}</div>
    </>
  );
}

function ReminderCenterPage({ data }) {
  const reminders = data.reminders || [];
  return (
    <>
      <PageHeader title="Reminders" subtitle="Review, snooze, and cancel every nudge in one place." />
      <div className="grid gap-4">
        {reminders.length ? reminders.map((reminder) => (
          <Card key={reminder.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div><span className="rounded-md border border-[var(--gold)]/30 bg-[var(--gold-bg)] px-2 py-1 text-xs font-black uppercase text-[var(--gold)]">{reminder.status}</span><h2 className="mt-3 text-xl font-black">{reminder.title}</h2><p className="text-[var(--secondary)]">{new Date(reminder.dueAt).toLocaleString()} · {(reminder.channels || []).join(" + ") || "no channel"}</p>{reminder.lastError && <p className="mt-2 text-red-300">{reminder.lastError}</p>}</div>
            <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => data.snoozeReminder(reminder.id, 10)}>Snooze 10m</Button><Button variant="secondary" onClick={() => data.snoozeReminder(reminder.id, 1440)}>Tomorrow</Button><Button variant="danger" onClick={() => data.cancelReminder(reminder.id)}>Cancel</Button></div>
          </Card>
        )) : <EmptyState icon={FiClock} title="No reminders." text="Add reminders to tasks, notes, habits, or time blocks." />}
      </div>
    </>
  );
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

function OfflineBanner({ sync }) {
  if (!sync || (sync.isOnline && !sync.queuedCount && !sync.failedCount && !sync.conflictCount && !sync.isSyncing)) return null;
  return (
    <Card className="mb-6 border-[var(--gold)]/25 bg-[var(--gold-bg)] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-black text-[var(--gold)]">{sync.isOnline ? "Sync status" : "You're offline"}</p>
          <p className="text-sm text-[var(--secondary)]">
            {sync.isOnline ? "Queued offline changes will sync automatically." : "Changes are stored on this device and will sync when you reconnect."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {!!sync.queuedCount && <span className="rounded-md border border-[var(--gold)]/30 px-2 py-1">{sync.queuedCount} queued</span>}
          {!!sync.failedCount && <span className="rounded-md border border-red-400/30 px-2 py-1 text-red-200">{sync.failedCount} failed</span>}
          {!!sync.conflictCount && <span className="rounded-md border border-orange-400/30 px-2 py-1 text-orange-200">{sync.conflictCount} conflicts</span>}
          <Button variant="secondary" onClick={sync.failedCount ? sync.retryFailed : sync.triggerSync} disabled={!sync.isOnline || sync.isSyncing}>
            {sync.isSyncing ? "Syncing..." : sync.failedCount ? "Retry" : "Sync now"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function SyncQueuePanel({ sync }) {
  if (!sync) return null;
  const visible = sync.queue.filter((item) => item.status !== "synced");
  return (
    <Card className="mb-7 p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-black">Offline Sync</h2>
          <p className="mt-3 text-[var(--secondary)]">Offline changes are stored only on this device until synced.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={sync.triggerSync} disabled={!sync.isOnline || sync.isSyncing}>{sync.isSyncing ? "Syncing..." : "Retry sync"}</Button>
          <Button variant="ghost" onClick={sync.clearSynced}>Clear synced history</Button>
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--elevated)] p-4"><p className="text-sm text-[var(--secondary)]">Network</p><strong>{sync.isOnline ? "Online" : "Offline"}</strong></div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--elevated)] p-4"><p className="text-sm text-[var(--secondary)]">Queued</p><strong>{sync.queuedCount}</strong></div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--elevated)] p-4"><p className="text-sm text-[var(--secondary)]">Failed</p><strong>{sync.failedCount}</strong></div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--elevated)] p-4"><p className="text-sm text-[var(--secondary)]">Conflicts</p><strong>{sync.conflictCount}</strong></div>
      </div>
      <div className="mt-5 space-y-2">
        {visible.length ? visible.map((item) => (
          <div key={item.id} className="flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--elevated)] p-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-black capitalize">{item.operation} {item.entityType}</p>
              <p className="text-sm text-[var(--secondary)]">{item.status}{item.error ? ` · ${item.error}` : ""}</p>
            </div>
            {item.status === "conflict" && (
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => sync.resolveConflict(item, "server")}>Keep server</Button>
                <Button onClick={() => sync.resolveConflict(item, "local")}>Keep local</Button>
              </div>
            )}
          </div>
        )) : <p className="rounded-xl border border-[var(--border)] bg-[var(--elevated)] p-4 text-[var(--secondary)]">No pending offline operations.</p>}
      </div>
    </Card>
  );
}

function SettingsPage({ data }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("tasknote.theme") || "amoled");
  const [importFile, setImportFile] = useState(null);
  const [importMode, setImportMode] = useState("skipDuplicates");
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState(null);
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
      <Card className="mb-7 p-8">
        <h2 className="text-xl font-black">Data</h2>
        <p className="mt-3 text-[var(--secondary)]">Export your workspace or safely merge a TaskNote backup into this account.</p>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <button onClick={data.exportBackup} className="rounded-2xl border border-[var(--border)] bg-[var(--elevated)] p-5 text-left transition hover:border-[var(--gold)]/50">
            <FiDownload className="text-2xl text-[var(--gold)]" />
            <h3 className="mt-4 font-black">Full backup JSON</h3>
            <p className="mt-1 text-sm text-[var(--secondary)]">Export notes, tasks, projects, reminders, reviews, and settings.</p>
          </button>
          <button onClick={data.exportNotesMarkdown} className="rounded-2xl border border-[var(--border)] bg-[var(--elevated)] p-5 text-left transition hover:border-[var(--gold)]/50">
            <FiFileText className="text-2xl text-[var(--gold)]" />
            <h3 className="mt-4 font-black">Notes Markdown</h3>
            <p className="mt-1 text-sm text-[var(--secondary)]">Download notes as a single Markdown archive.</p>
          </button>
          <button onClick={data.exportTasksCsv} className="rounded-2xl border border-[var(--border)] bg-[var(--elevated)] p-5 text-left transition hover:border-[var(--gold)]/50">
            <FiCheckSquare className="text-2xl text-[var(--gold)]" />
            <h3 className="mt-4 font-black">Tasks CSV</h3>
            <p className="mt-1 text-sm text-[var(--secondary)]">Export task status, priority, due dates, and estimates.</p>
          </button>
        </div>
        <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--elevated)] p-5">
          <h3 className="font-black">Import backup</h3>
          <p className="mt-1 text-sm text-[var(--secondary)]">Imported records are assigned to this user. Existing data is not overwritten silently.</p>
          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_190px_auto]">
            <Input type="file" accept="application/json,.json" onChange={(event) => setImportFile(event.target.files?.[0] || null)} />
            <Select value={importMode} onChange={(event) => setImportMode(event.target.value)}>
              <option value="skipDuplicates">Skip duplicates</option>
              <option value="merge">Merge all</option>
            </Select>
            <Button
              disabled={!importFile || importing}
              onClick={async () => {
                if (!window.confirm("Import this backup into your current TaskNote account?")) return;
                setImporting(true);
                try {
                  const summary = await data.importBackup(importFile, importMode);
                  setImportSummary(summary);
                } catch (error) {
                  toast.error(getErrorMessage(error, "Import failed"));
                } finally {
                  setImporting(false);
                }
              }}
            >
              <FiUpload /> {importing ? "Importing..." : "Import"}
            </Button>
          </div>
          {importSummary && (
            <div className="mt-4 grid gap-2 text-sm text-[var(--secondary)] sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(importSummary).map(([key, value]) => (
                <span key={key} className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2">
                  <strong className="text-[var(--text)]">{key}</strong>: {value.created || 0} created, {value.skipped || 0} skipped, {value.failed || 0} failed
                </span>
              ))}
            </div>
          )}
        </div>
      </Card>
      <SyncQueuePanel sync={data.offlineSync} />
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
    inbox: <InboxPage data={data} openNote={openNote} openTask={openTask} />,
    notes: <NotesPage data={data} openNote={openNote} />,
    tasks: <TasksPage data={data} updateTask={data.updateTask} deleteTask={data.deleteTask} openTask={openTask} />,
    board: <div className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"><BoardPage data={data} updateTask={data.updateTask} openTask={openTask} /></div>,
    calendar: <CalendarPage data={data} openTask={openTask} />,
    planner: <PlannerPage data={data} />,
    projects: <ProjectsPage data={data} />,
    focus: <FocusPage data={data} stats={stats} createSession={data.createSession} />,
    analytics: <AnalyticsPage data={data} stats={stats} />,
    habits: <HabitsPage data={data} />,
    tags: <TagsPage data={data} />,
    templates: <TemplatesPage data={data} openNote={openNote} openTask={openTask} />,
    reviews: <ReviewsPage data={data} stats={stats} />,
    reminders: <ReminderCenterPage data={data} />,
    settings: <SettingsPage data={data} />,
  }[page] || <DashboardPage data={data} stats={stats} />;

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--text)]">
      <Sidebar user={user} openQuickAdd={() => setCommandOpen(true)} />
      <main className="min-h-screen max-w-full overflow-x-hidden px-4 py-7 pb-28 sm:px-6 lg:ml-72 lg:px-8 xl:px-10">
        <div className="mx-auto w-full max-w-[1280px]">
          <OfflineBanner sync={data.offlineSync} />
          {screen}
        </div>
      </main>
      <MobileNav openQuickAdd={() => setCommandOpen(true)} />
      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} openNote={() => openNote(null)} openTask={() => openTask(null)} data={data} />
      <Modal open={noteModal.open} title={noteModal.note ? "Edit note" : "New note"} onClose={() => setNoteModal({ open: false, note: null })}>
        <NoteForm note={noteModal.note} notes={data.notes} onSave={(payload) => noteModal.note ? data.updateNote(noteModal.note.id, payload) : data.createNote(payload)} onDelete={data.deleteNote} onClose={() => setNoteModal({ open: false, note: null })} />
      </Modal>
      <Modal open={taskModal.open} title={taskModal.task ? "Edit task" : "New task"} onClose={() => setTaskModal({ open: false, task: null })}>
        <TaskForm task={taskModal.task} onSave={(payload) => taskModal.task ? data.updateTask(taskModal.task.id, payload) : data.createTask(payload)} onDelete={data.deleteTask} onClose={() => setTaskModal({ open: false, task: null })} />
      </Modal>
    </div>
  );
}

export default WorkspaceShell;
