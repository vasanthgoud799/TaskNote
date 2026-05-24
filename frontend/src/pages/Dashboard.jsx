import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiCheckCircle, FiFileText, FiRefreshCw, FiTrendingUp } from "react-icons/fi";
import { toast } from "sonner";
import { apiClient, getErrorMessage } from "../api/apiClient.js";
import Button from "../components/common/Button.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import AppShell from "../components/layout/AppShell.jsx";
import Header from "../components/layout/Header.jsx";
import NoteModal from "../components/notes/NoteModal.jsx";
import NotesGrid from "../components/notes/NotesGrid.jsx";
import OfflineBanner from "../components/pwa/OfflineBanner.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { useDebounce } from "../hooks/useDebounce.js";
import { useOnlineStatus } from "../hooks/useOnlineStatus.js";
import {
  addOfflineMutation,
  clearOfflineMutation,
  readCachedNotes,
  readOfflineMutations,
  saveCachedNotes,
} from "../utils/storageUtils.js";

const viewTitles = {
  all: ["Dashboard", "Your productivity command center for today."],
  notes: ["Notes", "Your complete notebook, sorted by recent activity."],
  starred: ["Starred Notes", "The notes you marked as important."],
  categories: ["Categories", "Scan your notebook by topic and focus area."],
  templates: ["Templates", "Start faster with structured note formats."],
  reminders: ["Reminders", "Upcoming email and SMS nudges for important notes."],
  settings: ["Settings", "Customize your TaskNote workspace."],
};

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning.";
  if (hour < 17) return "Good afternoon.";
  return "Good evening.";
};

const readableToday = () =>
  new Date().toLocaleDateString("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

const templates = [
  { title: "Meeting notes", content: "## Agenda\n\n- \n\n## Decisions\n\n- \n\n## Follow-ups\n\n- ", category: "Meeting" },
  { title: "Daily journal", content: "## Today\n\n## Wins\n\n## Tomorrow\n\n", category: "Personal" },
  { title: "Project plan", content: "## Goal\n\n## Milestones\n\n## Risks\n\n", category: "Work" },
  { title: "Bug report", content: "## Summary\n\n## Steps to reproduce\n\n## Expected\n\n## Actual\n\n", category: "Work" },
  { title: "Ideas list", content: "## Idea\n\n## Why it matters\n\n## Next step\n\n", category: "Ideas" },
];

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const Dashboard = ({ view }) => {
  const { theme, toggleTheme } = useTheme();
  const online = useOnlineStatus();
  const [notes, setNotes] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [habits, setHabits] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [focusStats, setFocusStats] = useState(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 180);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const loadNotes = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.get("/api/notes");
      setNotes(response.data.data.notes);
      await saveCachedNotes(response.data.data.notes);
      const [taskResponse, projectResponse, habitResponse, reminderResponse, focusResponse] = await Promise.all([
        apiClient.get("/api/tasks"),
        apiClient.get("/api/projects"),
        apiClient.get("/api/habits"),
        apiClient.get("/api/reminders"),
        apiClient.get("/api/focus-sessions"),
      ]);
      setTasks(taskResponse.data.data.tasks);
      setProjects(projectResponse.data.data.projects);
      setHabits(habitResponse.data.data.habits);
      setReminders(reminderResponse.data.data.reminders);
      setFocusStats(focusResponse.data.data.stats);
    } catch (requestError) {
      const cached = await readCachedNotes();
      if (cached.length) {
        setNotes(cached);
        toast.info("Loaded cached notes for offline mode");
      } else {
        setError(getErrorMessage(requestError, "Unable to load notes"));
      }
    } finally {
      setLoading(false);
      setPendingCount((await readOfflineMutations()).length);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  useEffect(() => {
    if (!online) return;
    const sync = async () => {
      const queue = await readOfflineMutations();
      for (const mutation of queue) {
        try {
          if (mutation.type === "create") await apiClient.post("/api/notes", mutation.payload);
          if (mutation.type === "update") await apiClient.put(`/api/notes/${mutation.noteId}`, mutation.payload);
          if (mutation.type === "delete") await apiClient.delete(`/api/notes/${mutation.noteId}`);
          await clearOfflineMutation(mutation.id);
        } catch {
          break;
        }
      }
      const remaining = await readOfflineMutations();
      setPendingCount(remaining.length);
      if (queue.length && !remaining.length) {
        toast.success("Offline changes synced");
        loadNotes();
      }
    };
    sync();
  }, [online]);

  const categoryCounts = useMemo(() => {
    const counts = notes.reduce((map, note) => {
      const category = note.category || "Personal";
      map.set(category, (map.get(category) || 0) + 1);
      return map;
    }, new Map());

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [notes]);

  const filteredNotes = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return notes.filter((note) => {
      const matchesQuery =
        !query ||
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query) ||
        note.category.toLowerCase().includes(query);
      const matchesStar = view !== "starred" || note.starred;
      const matchesCategory = selectedCategory === "All" || note.category === selectedCategory;
      return matchesQuery && matchesStar && matchesCategory;
    });
  }, [notes, debouncedSearch, selectedCategory, view]);

  const recentlyUpdated = useMemo(() => notes.slice(0, 3), [notes]);
  const recentActivity = useMemo(() => {
    const noteActivity = notes.map((note) => ({
      id: `note-${note.id}`,
      title: note.title,
      meta: note.category || "Note",
      date: note.updatedAt || note.createdAt,
      icon: FiFileText,
      to: "/notes",
    }));
    const taskActivity = tasks.map((task) => ({
      id: `task-${task.id}`,
      title: task.title,
      meta: task.status,
      date: task.updatedAt || task.createdAt,
      icon: FiCheckCircle,
      to: "/tasks",
    }));
    const habitActivity = habits.map((habit) => ({
      id: `habit-${habit.id}`,
      title: habit.name,
      meta: habit.completedToday ? "Completed today" : "Habit",
      date: habit.updatedAt || habit.createdAt,
      icon: FiTrendingUp,
      to: "/habits",
    }));
    return [...noteActivity, ...taskActivity, ...habitActivity]
      .filter((item) => item.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  }, [habits, notes, tasks]);

  const upsertNote = (note) => {
    setNotes((current) => {
      const exists = current.some((entry) => entry.id === note.id);
      const nextNotes = exists ? current.map((entry) => (entry.id === note.id ? note : entry)) : [note, ...current];
      return nextNotes.sort((a, b) => Number(b.pinned) - Number(a.pinned) || new Date(b.updatedAt) - new Date(a.updatedAt));
    });
  };

  const handleSaveNote = async (payload, afterSave) => {
    if (!payload.title.trim() || !payload.content.trim()) {
      toast.error("Title and content are required");
      return;
    }

    setSaving(true);
    try {
      if (!online) {
        const tempNote = {
          ...payload,
          id: modal?.note?.id || `offline-${crypto.randomUUID()}`,
          createdAt: modal?.note?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          pendingSync: true,
        };
        upsertNote(tempNote);
        await addOfflineMutation({ type: modal?.note ? "update" : "create", noteId: modal?.note?.id, payload });
        afterSave?.();
        setModal(null);
        setPendingCount((await readOfflineMutations()).length);
        toast.success("Saved offline. It will sync when you reconnect.");
        return;
      }

      const endpoint = modal?.note?.id ? `/api/notes/${modal.note.id}` : "/api/notes";
      const method = modal?.note?.id ? "put" : "post";
      const response = await apiClient[method](endpoint, payload);
      upsertNote(response.data.data.note);
      afterSave?.();
      setModal(null);
      toast.success(response.data.message);
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Unable to save note"));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStar = async (note) => {
    const previousNotes = notes;
    const optimisticNote = { ...note, starred: !note.starred };
    upsertNote(optimisticNote);
    try {
      const response = await apiClient.patch(`/api/notes/${note.id}/star`, { starred: optimisticNote.starred });
      upsertNote(response.data.data.note);
    } catch (requestError) {
      setNotes(previousNotes);
      toast.error(getErrorMessage(requestError, "Unable to update starred state"));
    }
  };

  const handleTogglePin = async (note) => {
    const previousNotes = notes;
    const optimisticNote = { ...note, pinned: !note.pinned };
    upsertNote(optimisticNote);
    try {
      const response = await apiClient.put(`/api/notes/${note.id}`, { pinned: optimisticNote.pinned });
      upsertNote(response.data.data.note);
      toast.success(optimisticNote.pinned ? "Note pinned" : "Note unpinned");
    } catch (requestError) {
      setNotes(previousNotes);
      toast.error(getErrorMessage(requestError, "Unable to update pinned state"));
    }
  };

  const handleDelete = async (note) => {
    if (!window.confirm(`Move "${note.title}" to trash?`)) return;
    const previousNotes = notes;
    setNotes((current) => current.filter((entry) => entry.id !== note.id));
    try {
      if (!online) {
        await addOfflineMutation({ type: "delete", noteId: note.id, payload: {} });
        setPendingCount((await readOfflineMutations()).length);
        toast.success("Delete queued for sync");
        return;
      }
      await apiClient.delete(`/api/notes/${note.id}`);
      toast.success("Note moved to trash");
    } catch (requestError) {
      setNotes(previousNotes);
      toast.error(getErrorMessage(requestError, "Unable to delete note"));
    }
  };

  const [title, subtitle] = view === "all" ? [greeting(), readableToday()] : viewTitles[view] || viewTitles.all;
  const showNoteTools = ["notes", "starred", "categories", "templates", "reminders"].includes(view);
  const today = dateKey(new Date());
  const dueToday = tasks.filter((task) => task.dueDate?.slice(0, 10) === today && task.status !== "done");
  const overdue = tasks.filter((task) => task.dueDate && task.dueDate.slice(0, 10) < today && task.status !== "done");
  const completedToday = tasks.filter((task) => task.status === "done" && task.updatedAt?.slice(0, 10) === today);
  const pendingReminders = reminders.filter((reminder) => reminder.status === "pending");
  const productivityScore = Math.min(
    100,
    Math.round(completedToday.length * 18 + habits.filter((habit) => habit.completedToday).length * 14 + notes.length * 2 + (focusStats?.weekMinutes || 0) / 5)
  );
  const statusCounts = {
    todo: tasks.filter((task) => task.status === "todo").length,
    doing: tasks.filter((task) => task.status === "doing").length,
    done: tasks.filter((task) => task.status === "done").length,
  };
  const weekDays = getLast7Days();
  const weeklyTaskData = weekDays.map((day) => ({
    ...day,
    value: tasks.filter((task) => task.status === "done" && task.updatedAt?.slice(0, 10) === day.key).length,
  }));
  const pinnedNotes = filteredNotes.filter((note) => note.pinned);
  const unpinnedNotes = filteredNotes.filter((note) => !note.pinned);

  return (
    <AppShell>
      {({ openMenu }) => (
        <>
          <Header
            title={title}
            subtitle={subtitle}
            search={showNoteTools ? search : undefined}
            onSearch={showNoteTools ? setSearch : undefined}
            onCreateNote={showNoteTools ? () => setModal({ mode: "edit", note: null }) : undefined}
            actionLabel="New Note"
            onMenu={openMenu}
            rightSlot={view === "all" ? <span className="header-streak">1-day streak</span> : null}
          />
          <OfflineBanner online={online} pendingCount={pendingCount} />

          {view === "all" && (
            <DashboardHome
              completedToday={completedToday}
              dueToday={dueToday}
              focusStats={focusStats}
              habits={habits}
              notes={notes}
              overdue={overdue}
              pendingReminders={pendingReminders}
              productivityScore={productivityScore}
              projects={projects}
              recentActivity={recentActivity}
              statusCounts={statusCounts}
              weeklyTaskData={weeklyTaskData}
            />
          )}

          {view === "all" ? null : view === "templates" ? (
            <section className="notes-grid">
              {templates.map((template) => (
                <article className="note-card" key={template.title}>
                  <span className="category-badge">{template.category}</span>
                  <h3>{template.title}</h3>
                  <p>{template.content}</p>
                  <Button onClick={() => setModal({ mode: "edit", note: { ...template, starred: false, color: "sky" } })}>Use template</Button>
                </article>
              ))}
            </section>
          ) : view === "reminders" ? (
            reminders.length ? (
              <section className="notes-grid">
                {reminders.map((reminder) => (
                  <article className="note-card" key={reminder.id}>
                    <span className="category-badge">{reminder.status}</span>
                    <h3>{reminder.title}</h3>
                    <p>{new Date(reminder.reminderAt).toLocaleString()} via {reminder.channels.join(", ")}</p>
                  </article>
                ))}
              </section>
            ) : (
              <EmptyState title="No reminders yet" description="Add a reminder date and notification channel while editing a note." />
            )
          ) : view === "settings" ? (
            <section className="panel settings-panel">
              <h2>Workspace settings</h2>
              <p>Theme preference is saved locally and applied immediately across TaskNote.</p>
              <Button onClick={toggleTheme} variant="secondary">Switch to {theme === "dark" ? "light" : "dark"} mode</Button>
            </section>
          ) : view === "notes" ? (
            <NotesHome
              error={error}
              loading={loading}
              onCreate={() => setModal({ mode: "edit", note: null })}
              onDelete={handleDelete}
              onEdit={(note) => setModal({ mode: "edit", note })}
              onOpen={(note) => setModal({ mode: "view", note })}
              onRetry={loadNotes}
              onTogglePin={handleTogglePin}
              onToggleStar={handleToggleStar}
              pinnedNotes={pinnedNotes}
              search={search}
              unpinnedNotes={unpinnedNotes}
            />
          ) : (
            <>
              <section className="dashboard-toolbar">
                <div className="category-pills">
                  <button className={selectedCategory === "All" ? "active" : ""} type="button" onClick={() => setSelectedCategory("All")}>All</button>
                  {categoryCounts.map((category) => (
                    <button className={selectedCategory === category.name ? "active" : ""} key={category.name} type="button" onClick={() => setSelectedCategory(category.name)}>
                      {category.name} <span>{category.count}</span>
                    </button>
                  ))}
                </div>
                <Button variant="ghost" onClick={loadNotes}><FiRefreshCw />Refresh</Button>
              </section>

              {view === "categories" && (
                <section className="category-summary">
                  {categoryCounts.length ? categoryCounts.map((category) => (
                    <button key={category.name} className="category-summary-card" type="button" onClick={() => setSelectedCategory(category.name)}>
                      <span>{category.name}</span><strong>{category.count}</strong>
                    </button>
                  )) : <EmptyState title="No categories yet" description="Create notes with categories to see a summary." />}
                </section>
              )}

              {!!recentlyUpdated.length && view === "all" && (
                <section className="recent-section">
                  <h2>Recently updated</h2>
                  <div>{recentlyUpdated.map((note) => <button key={note.id} type="button" onClick={() => setModal({ mode: "view", note })}><span>{note.title}</span><small>{note.category}</small></button>)}</div>
                </section>
              )}

              <NotesGrid
                notes={filteredNotes}
                loading={loading}
                error={error}
                onRetry={loadNotes}
                onCreate={() => setModal({ mode: "edit", note: null })}
                onOpen={(note) => setModal({ mode: "view", note })}
                onEdit={(note) => setModal({ mode: "edit", note })}
                onDelete={handleDelete}
                onTogglePin={handleTogglePin}
                onToggleStar={handleToggleStar}
                emptyTitle={search ? "No matching notes" : view === "starred" ? "No starred notes" : "No notes yet"}
                emptyDescription={search ? "Try another keyword or clear the search field." : "Create a note and it will appear here instantly."}
              />
            </>
          )}

          {modal && <NoteModal note={modal.note} mode={modal.mode} saving={saving} onClose={() => setModal(null)} onSave={handleSaveNote} />}
        </>
      )}
    </AppShell>
  );
};

const Widget = ({ title, value, detail, tone = "default" }) => (
  <article className={`rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl ${
    tone === "danger"
      ? "border-[#5a2b26] bg-[#2a1412] text-[#ffb4ab]"
      : tone === "good"
        ? "border-[#3f3421] bg-[#211b12] text-[#f0c96a]"
        : "border-[#242424] bg-[#121212] text-[#f5f5f5]"
  }`}>
    <p className="text-xs font-black uppercase tracking-wide opacity-70">{title}</p>
    <strong className="mt-2 block text-3xl font-black">{value}</strong>
    <span className="mt-1 block text-sm opacity-70">{detail}</span>
  </article>
);

const DashboardHome = ({
  completedToday,
  dueToday,
  focusStats,
  habits,
  notes,
  overdue,
  pendingReminders,
  productivityScore,
  projects,
  recentActivity,
  statusCounts,
  weeklyTaskData,
}) => {
  const bestHabitStreak = habits.reduce((best, habit) => Math.max(best, habit.currentStreak || 0), 0);
  const urgentOpen = overdue.length + dueToday.filter((task) => ["high", "urgent"].includes(task.priority)).length;

  return (
    <div className="grid gap-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Widget title="Due Today" value={dueToday.length} detail={dueToday[0]?.title || "All clear"} />
        <Widget title="Overdue" value={overdue.length} detail={overdue.length ? "Needs attention" : "All clear"} tone={overdue.length ? "danger" : "good"} />
        <Widget title="Completed Today" value={completedToday.length} detail={`${completedToday.length} this week`} tone="good" />
        <Widget title="Focus Today" value={`${focusStats?.todayMinutes || 0}m`} detail={`${focusStats?.weekMinutes || 0}m this week`} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_25rem]">
        <article className="rounded-3xl border border-[#242424] bg-[#121212] p-5 shadow-2xl shadow-black/20">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-black text-[#f5f5f5]">This Week</h2>
            <span className="text-sm font-bold text-[#a3a3a3]">Task velocity</span>
          </div>
          <LineChart data={weeklyTaskData} />
        </article>

        <article className="rounded-3xl border border-[#242424] bg-[#121212] p-5">
          <h2 className="text-xl font-black text-[#f5f5f5]">Productivity</h2>
          <div className="mt-5 grid place-items-center">
            <div
              className="grid h-44 w-44 place-items-center rounded-full"
              style={{ background: `conic-gradient(#e5b85c ${productivityScore}%, #24211d ${productivityScore}% 100%)` }}
            >
              <div className="grid h-[82%] w-[82%] place-items-center rounded-full bg-[#0b0b0b]">
                <div className="text-center">
                  <strong className="block text-5xl font-black text-[#f5f5f5]">{productivityScore}</strong>
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-[#a3a3a3]">Score</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-7 grid grid-cols-3 gap-3 text-center">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status}>
                <strong className="block text-2xl font-black text-[#f5f5f5]">{count}</strong>
                <span className="text-xs font-black uppercase text-[#a3a3a3]">{status}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_25rem]">
        <article className="rounded-3xl border border-[#242424] bg-[#121212] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black text-[#f5f5f5]">Today&apos;s Focus</h2>
            <Link className="font-black text-[#f5f5f5] hover:text-[#e5b85c]" to="/tasks">View all</Link>
          </div>
          {dueToday.length || overdue.length ? (
            <div className="grid gap-3">
              {[...overdue, ...dueToday].slice(0, 4).map((task) => (
                <Link key={task.id} className="rounded-2xl border border-[#242424] bg-[#0b0b0b] p-4 transition hover:border-[#e5b85c]/50" to="/tasks">
                  <strong className="block text-[#f5f5f5]">{task.title}</strong>
                  <span className="mt-1 block text-sm text-[#a3a3a3]">{task.priority} · {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No date"}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid min-h-48 place-items-center text-center">
              <div>
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-[#6a532b] text-[#e5b85c]"><FiCheckCircle /></span>
                <h3 className="mt-4 text-xl font-black text-[#f5f5f5]">All clear.</h3>
                <p className="mt-1 text-[#a3a3a3]">Nothing waiting on your attention.</p>
              </div>
            </div>
          )}
        </article>

        <article className="rounded-3xl border border-[#242424] bg-[#121212] p-5">
          <h2 className="text-xl font-black text-[#f5f5f5]">Recent Activity</h2>
          {recentActivity.length ? (
            <div className="mt-5 grid gap-4">
              {recentActivity.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.id} className="flex items-center gap-3" to={item.to}>
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-[#0b0b0b] text-[#e5b85c]"><Icon /></span>
                    <span className="min-w-0">
                      <strong className="block truncate text-[#f5f5f5]">{item.title}</strong>
                      <small className="text-[#a3a3a3]">{relativeTime(item.date)}</small>
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="mt-6 text-[#a3a3a3]">Create a note, task, or habit to start the activity feed.</p>
          )}
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Widget title="Notes" value={notes.length} detail={`${notes.filter((note) => note.pinned).length} pinned`} />
        <Widget title="Week Velocity" value={weeklyTaskData.reduce((sum, day) => sum + day.value, 0)} detail="Tasks completed" />
        <Widget title="Done" value={statusCounts.done} detail="All-time visible" tone="good" />
        <Widget title="Urgent Open" value={urgentOpen} detail={`${pendingReminders.length} reminders`} tone={urgentOpen ? "danger" : "default"} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Widget title="Habit Streaks" value={bestHabitStreak} detail={`${habits.filter((habit) => habit.completedToday).length} completed today`} />
        <Widget title="Projects" value={projects.length} detail={projects[0]?.name || "No active project"} />
        <Widget title="Reminders" value={pendingReminders.length} detail="Pending reminders" />
        <Widget title="Focus Week" value={`${focusStats?.weekMinutes || 0}m`} detail={`${focusStats?.sessionCount || 0} sessions`} />
      </section>
    </div>
  );
};

const NotesHome = ({ error, loading, onCreate, onDelete, onEdit, onOpen, onRetry, onTogglePin, onToggleStar, pinnedNotes, search, unpinnedNotes }) => {
  if (loading || error || (!pinnedNotes.length && !unpinnedNotes.length)) {
    return (
      <NotesGrid
        notes={[...pinnedNotes, ...unpinnedNotes]}
        loading={loading}
        error={error}
        onRetry={onRetry}
        onCreate={onCreate}
        onOpen={onOpen}
        onEdit={onEdit}
        onDelete={onDelete}
        onTogglePin={onTogglePin}
        onToggleStar={onToggleStar}
        emptyTitle={search ? "No matching notes" : "No notes yet"}
        emptyDescription={search ? "Try another keyword or clear search." : "Create a note and pin your most important thinking."}
      />
    );
  }

  return (
    <div className="grid gap-10">
      {!!pinnedNotes.length && (
        <section>
          <h2 className="mb-4 text-sm font-black uppercase tracking-[0.22em] text-[#a3a3a3]">Pinned</h2>
          <NotesGrid
            notes={pinnedNotes}
            onCreate={onCreate}
            onOpen={onOpen}
            onEdit={onEdit}
            onDelete={onDelete}
            onTogglePin={onTogglePin}
            onToggleStar={onToggleStar}
          />
        </section>
      )}
      <section>
        <h2 className="mb-4 text-sm font-black uppercase tracking-[0.22em] text-[#a3a3a3]">All Notes</h2>
        <NotesGrid
          notes={unpinnedNotes}
          onCreate={onCreate}
          onOpen={onOpen}
          onEdit={onEdit}
          onDelete={onDelete}
          onTogglePin={onTogglePin}
          onToggleStar={onToggleStar}
          emptyTitle={search ? "No matching notes" : "No unpinned notes"}
          emptyDescription={search ? "Try another keyword or clear search." : "Pinned notes are shown above."}
        />
      </section>
    </div>
  );
};

const LineChart = ({ data }) => {
  const width = 720;
  const height = 220;
  const maxValue = Math.max(4, ...data.map((day) => day.value));
  const points = data.map((day, index) => {
    const x = 24 + (index * (width - 48)) / Math.max(1, data.length - 1);
    const y = height - 28 - (day.value / maxValue) * (height - 58);
    return { ...day, x, y };
  });
  const path = points.map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`).join(" ");

  return (
    <svg className="h-64 w-full overflow-visible" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Weekly completed tasks">
      {[0, 1, 2, 3, 4].map((line) => {
        const y = 18 + line * 38;
        return <line key={line} x1="24" x2={width - 24} y1={y} y2={y} stroke="#242424" strokeDasharray="4 6" />;
      })}
      <path d={path} fill="none" stroke="#e5b85c" strokeLinecap="round" strokeWidth="3" />
      {points.map((point) => (
        <g key={point.key}>
          <circle cx={point.x} cy={point.y} fill="#0b0b0b" r="5" stroke="#e5b85c" strokeWidth="3" />
          <text fill="#9b9287" fontSize="13" textAnchor="middle" x={point.x} y={height - 4}>{point.label}</text>
        </g>
      ))}
    </svg>
  );
};

const getLast7Days = () =>
  Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return {
      key: dateKey(date),
      label: date.toLocaleDateString("en", { weekday: "short" }),
    };
  });

const relativeTime = (value) => {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
};

export default Dashboard;
