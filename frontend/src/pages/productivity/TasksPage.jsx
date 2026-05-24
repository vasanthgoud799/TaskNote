import React, { useMemo, useState } from "react";
import { FiCheck, FiClock, FiEdit3, FiSearch, FiTrash2 } from "react-icons/fi";
import { toast } from "sonner";
import EmptyState from "../../components/common/EmptyState.jsx";
import Loader from "../../components/common/Loader.jsx";
import AppShell from "../../components/layout/AppShell.jsx";
import Header from "../../components/layout/Header.jsx";
import { useResource } from "../../hooks/useResource.js";

const statuses = ["todo", "doing", "done"];
const priorities = ["low", "medium", "high", "urgent"];

const priorityTone = {
  low: "border-[#3d372d] text-[#a3a3a3]",
  medium: "border-[#564325] text-[#f0c96a]",
  high: "border-[#6b3f22] text-[#ffbd7a]",
  urgent: "border-[#6b2922] text-[#ff8c82]",
};

const TasksPage = ({ view = "list" }) => {
  const { items: tasks, setItems, loading, error, load, create, update, remove } = useResource("/api/tasks", "tasks");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [form, setForm] = useState({ title: "", dueDate: "", priority: "medium" });
  const [taskView, setTaskView] = useState("list");
  const [editingTask, setEditingTask] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [monthCursor, setMonthCursor] = useState(new Date());
  const [draggingId, setDraggingId] = useState(null);

  const filteredTasks = useMemo(() => {
    const search = query.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesQuery =
        !search ||
        task.title.toLowerCase().includes(search) ||
        (task.description || "").toLowerCase().includes(search) ||
        task.tags?.some((tag) => tag.toLowerCase().includes(search));
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
      return matchesQuery && matchesStatus && matchesPriority;
    });
  }, [priorityFilter, query, statusFilter, tasks]);

  const columns = useMemo(
    () => Object.fromEntries(statuses.map((status) => [status, filteredTasks.filter((task) => task.status === status)])),
    [filteredTasks]
  );

  const matrix = useMemo(
    () => ({
      "Do first": filteredTasks.filter((task) => ["urgent", "high"].includes(task.priority) && isUrgent(task)),
      Schedule: filteredTasks.filter((task) => ["urgent", "high"].includes(task.priority) && !isUrgent(task)),
      Delegate: filteredTasks.filter((task) => !["urgent", "high"].includes(task.priority) && isUrgent(task)),
      Eliminate: filteredTasks.filter((task) => !["urgent", "high"].includes(task.priority) && !isUrgent(task)),
    }),
    [filteredTasks]
  );

  const title = view === "board" ? "Board" : view === "calendar" ? "Calendar" : "Tasks";
  const subtitle =
    view === "board"
      ? "Drag cards between columns to move work forward."
      : view === "calendar"
        ? "See your week at a glance, plan the next."
        : "Plan, prioritize, and finish meaningful work.";

  const saveTask = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) {
      toast.error("Task title is required");
      return;
    }
    const payload = {
      title: form.title.trim(),
      dueDate: form.dueDate || null,
      priority: form.priority,
      description: form.description || "",
      status: form.status || "todo",
      tags: form.tags ? form.tags.split(",").map((tag) => tag.trim()).filter(Boolean) : [],
    };
    if (editingTask) {
      await update(editingTask.id, payload, "task");
    } else {
      await create(payload, "task");
    }
    setForm({ title: "", dueDate: "", priority: "medium" });
    setEditingTask(null);
  };

  const startEdit = (task) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description || "",
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
      priority: task.priority,
      status: task.status,
      tags: task.tags?.join(", ") || "",
    });
  };

  const moveTask = async (taskId, status) => {
    const task = tasks.find((entry) => entry.id === taskId);
    if (!task || task.status === status) return;
    const previous = tasks;
    setItems((current) => current.map((entry) => (entry.id === taskId ? { ...entry, status } : entry)));
    try {
      await update(taskId, { status }, "task");
    } catch {
      setItems(previous);
      toast.error("Could not move task");
    }
  };

  const calendarDays = useMemo(() => buildCalendar(monthCursor), [monthCursor]);
  const selectedKey = dateKey(selectedDate);
  const selectedTasks = tasks.filter((task) => task.dueDate?.slice(0, 10) === selectedKey);

  return (
    <AppShell>
      {({ openMenu }) => (
        <>
          <Header title={title} subtitle={subtitle} onMenu={openMenu} />

          {view === "list" && (
            <>
              <form className="mb-5 rounded-3xl border border-[#242424] bg-[#121212] p-4 shadow-2xl shadow-black/20" onSubmit={saveTask}>
                <div className="grid gap-3 lg:grid-cols-[1fr_10rem_10rem_auto]">
                  <input
                    className="rounded-2xl border border-[#242424] bg-[#0b0b0b] px-4 py-3 text-[#f5f5f5] outline-none focus:border-[#e5b85c]"
                    value={form.title}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                    placeholder="Add a task..."
                  />
                  <input
                    className="rounded-2xl border border-[#242424] bg-[#0b0b0b] px-4 py-3 text-[#f5f5f5] outline-none focus:border-[#e5b85c]"
                    type="date"
                    value={form.dueDate}
                    onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
                  />
                  <select
                    className="rounded-2xl border border-[#242424] bg-[#0b0b0b] px-4 py-3 text-[#f5f5f5] outline-none focus:border-[#e5b85c]"
                    value={form.priority}
                    onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}
                  >
                    {priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                  </select>
                  <button className="rounded-2xl bg-[#e5b85c] px-5 py-3 font-black text-[#171107] transition hover:bg-[#f0c96a]" type="submit">
                    {editingTask ? "Update" : "Add task"}
                  </button>
                </div>
                {editingTask && (
                  <button className="mt-3 text-sm font-bold text-[#a3a3a3] hover:text-[#f5f5f5]" type="button" onClick={() => { setEditingTask(null); setForm({ title: "", dueDate: "", priority: "medium" }); }}>
                    Cancel edit
                  </button>
                )}
              </form>

              <section className="mb-5 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
                <label className="relative">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#737373]" />
                  <input
                    className="w-full rounded-2xl border border-[#242424] bg-[#121212] py-3 pl-11 pr-4 text-[#f5f5f5] outline-none focus:border-[#e5b85c]"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search title, description, or tag"
                  />
                </label>
                <Filter value={statusFilter} onChange={setStatusFilter} options={["all", ...statuses]} />
                <Filter value={priorityFilter} onChange={setPriorityFilter} options={["all", ...priorities]} />
              </section>
            </>
          )}

          {loading ? (
            <Loader label="Loading tasks" />
          ) : error ? (
            <EmptyState title="Could not load tasks" description={error} actionLabel="Retry" onAction={load} />
          ) : view === "board" ? (
            <BoardView columns={columns} draggingId={draggingId} setDraggingId={setDraggingId} moveTask={moveTask} update={update} remove={remove} startEdit={startEdit} />
          ) : view === "calendar" ? (
            <CalendarView
              monthCursor={monthCursor}
              setMonthCursor={setMonthCursor}
              days={calendarDays}
              tasks={tasks}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              selectedTasks={selectedTasks}
              startEdit={startEdit}
            />
          ) : filteredTasks.length ? (
            <>
              <div className="mb-4 flex flex-wrap gap-2">
                {["list", "matrix"].map((item) => (
                  <button
                    key={item}
                    className={`rounded-2xl border px-4 py-2 text-sm font-black ${taskView === item ? "border-[#e5b85c] bg-[#e5b85c] text-[#171107]" : "border-[#242424] bg-[#121212] text-[#a3a3a3]"}`}
                    type="button"
                    onClick={() => setTaskView(item)}
                  >
                    {item === "list" ? "List" : "Matrix"}
                  </button>
                ))}
              </div>
              {taskView === "matrix" ? (
                <MatrixView matrix={matrix} startEdit={startEdit} expanded />
              ) : (
                <section className="grid gap-3">
                  {filteredTasks.map((task) => <TaskCard key={task.id} task={task} update={update} remove={remove} startEdit={startEdit} />)}
                </section>
              )}
            </>
          ) : (
            <EmptyState title="No tasks found" description="Create a task or clear your filters to get moving." />
          )}
        </>
      )}
    </AppShell>
  );
};

const Filter = ({ value, onChange, options }) => (
  <select
    className="rounded-2xl border border-[#242424] bg-[#121212] px-4 py-3 text-[#f5f5f5] outline-none focus:border-[#e5b85c]"
    value={value}
    onChange={(event) => onChange(event.target.value)}
  >
    {options.map((option) => <option key={option} value={option}>{option}</option>)}
  </select>
);

const TaskCard = ({ task, update, remove, startEdit, draggable = false, onDragStart, onDragEnd }) => (
  <article
    className="rounded-3xl border border-[#242424] bg-[#121212] p-4 transition hover:-translate-y-0.5 hover:border-[#e5b85c]/50 hover:shadow-2xl hover:shadow-black/20"
    draggable={draggable}
    onDragStart={onDragStart}
    onDragEnd={onDragEnd}
  >
    <div className="mb-3 flex items-center justify-between gap-3">
      <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase ${priorityTone[task.priority] || priorityTone.medium}`}>{task.priority}</span>
      <span className="text-xs font-bold uppercase text-[#737373]">{task.status}</span>
    </div>
    <h3 className={task.status === "done" ? "text-lg font-black text-[#737373] line-through" : "text-lg font-black text-[#f5f5f5]"}>{task.title}</h3>
    <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#a3a3a3]">{task.description || "No description yet."}</p>
    {!!task.tags?.length && <p className="mt-3 text-xs font-bold text-[#e5b85c]">{task.tags.join(" · ")}</p>}
    <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#242424] pt-3">
      <span className="inline-flex items-center gap-2 text-sm text-[#a3a3a3]"><FiClock />{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}</span>
      <div className="flex gap-2">
        <button className="icon-button" type="button" onClick={() => startEdit(task)} aria-label="Edit task"><FiEdit3 /></button>
        <button className="icon-button" type="button" onClick={() => update(task.id, { status: task.status === "done" ? "todo" : "done" }, "task")} aria-label="Toggle task done"><FiCheck /></button>
        <button className="icon-button danger" type="button" onClick={() => window.confirm(`Archive "${task.title}"?`) && remove(task.id)} aria-label="Archive task"><FiTrash2 /></button>
      </div>
    </div>
  </article>
);

const BoardView = ({ columns, draggingId, setDraggingId, moveTask, update, remove, startEdit }) => (
  <section className="grid gap-4 lg:grid-cols-3">
    {statuses.map((status) => (
      <div
        key={status}
        className={`min-h-[28rem] rounded-3xl border border-dashed p-4 transition ${draggingId ? "border-[#e5b85c] bg-[#e5b85c]/5" : "border-[#242424] bg-[#0b0b0b]"}`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={() => {
          moveTask(draggingId, status);
          setDraggingId(null);
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[#a3a3a3]">{status}</h2>
          <span className="rounded-xl bg-[#121212] px-3 py-1 text-sm font-black text-[#f5f5f5]">{columns[status].length}</span>
        </div>
        <div className="grid gap-3">
          {columns[status].length ? columns[status].map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              update={update}
              remove={remove}
              startEdit={startEdit}
              draggable
              onDragStart={() => setDraggingId(task.id)}
              onDragEnd={() => setDraggingId(null)}
            />
          )) : (
            <div className="grid min-h-32 place-items-center rounded-3xl border border-dashed border-[#242424] text-sm font-bold italic text-[#737373]">Drop here</div>
          )}
        </div>
      </div>
    ))}
  </section>
);

const MatrixView = ({ matrix, startEdit, expanded = false }) => (
  <section id="matrix" className={`grid gap-3 ${expanded ? "lg:grid-cols-2" : ""}`}>
    {Object.entries(matrix).map(([title, list]) => (
      <div key={title} className="rounded-3xl border border-[#242424] bg-[#0b0b0b] p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-black text-[#f5f5f5]">{title}</h2>
          <span className="text-sm font-black text-[#e5b85c]">{list.length}</span>
        </div>
        <div className="grid gap-2">
          {list.length ? list.map((task) => (
            <button key={task.id} className="rounded-2xl border border-[#242424] bg-[#121212] p-3 text-left text-sm text-[#a3a3a3] transition hover:border-[#e5b85c]/50 hover:text-[#f5f5f5]" type="button" onClick={() => startEdit(task)}>
              {task.title}
            </button>
          )) : <p className="text-sm text-[#737373]">Clear</p>}
        </div>
      </div>
    ))}
  </section>
);

const CalendarView = ({ monthCursor, setMonthCursor, days, tasks, selectedDate, setSelectedDate, selectedTasks, startEdit }) => (
  <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]">
    <div className="rounded-3xl border border-[#242424] bg-[#121212] p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button className="icon-button" type="button" onClick={() => setMonthCursor(addMonths(monthCursor, -1))}>‹</button>
          <button className="icon-button" type="button" onClick={() => setMonthCursor(addMonths(monthCursor, 1))}>›</button>
        </div>
        <h2 className="text-xl font-black text-[#f5f5f5]">{monthCursor.toLocaleDateString("en", { month: "long", year: "numeric" })}</h2>
        <button className="rounded-2xl border border-[#242424] px-4 py-2 font-bold text-[#a3a3a3] transition hover:border-[#e5b85c]/50 hover:text-[#f5f5f5]" type="button" onClick={() => { const today = new Date(); setMonthCursor(today); setSelectedDate(today); }}>Today</button>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-black uppercase tracking-wide text-[#737373]">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="mt-3 grid grid-cols-7 gap-2">
        {days.map((day) => {
          const key = dateKey(day.date);
          const dayTasks = tasks.filter((task) => task.dueDate?.slice(0, 10) === key);
          const selected = key === dateKey(selectedDate);
          return (
            <button
              key={key}
              className={`min-h-24 rounded-2xl border p-2 text-left transition ${selected ? "border-[#e5b85c] bg-[#e5b85c] text-[#171107]" : "border-[#242424] bg-[#0b0b0b] text-[#f5f5f5] hover:border-[#e5b85c]/50"} ${day.inMonth ? "" : "opacity-35"}`}
              type="button"
              onClick={() => setSelectedDate(day.date)}
            >
              <span className="font-black">{day.date.getDate()}</span>
              <div className="mt-2 grid gap-1">
                {dayTasks.slice(0, 2).map((task) => <span key={task.id} className="truncate rounded bg-black/20 px-2 py-1 text-xs">{task.title}</span>)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
    <aside className="rounded-3xl border border-[#242424] bg-[#121212] p-5">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#e5b85c]">{selectedDate.toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}</p>
      <div className="mt-5 grid gap-3">
        {selectedTasks.length ? selectedTasks.map((task) => (
          <button key={task.id} className="rounded-2xl border border-[#242424] bg-[#0b0b0b] p-3 text-left transition hover:border-[#e5b85c]/50" type="button" onClick={() => startEdit(task)}>
            <strong className="block text-[#f5f5f5]">{task.title}</strong>
            <span className="text-sm text-[#a3a3a3]">{task.priority}</span>
          </button>
        )) : <p className="py-12 text-center text-[#a3a3a3]">No tasks scheduled.</p>}
      </div>
    </aside>
  </section>
);

const isUrgent = (task) => {
  if (!task.dueDate) return false;
  const due = new Date(task.dueDate);
  const limit = new Date();
  limit.setDate(limit.getDate() + 2);
  return due <= limit;
};

const dateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const addMonths = (date, amount) => new Date(date.getFullYear(), date.getMonth() + amount, 1);

const buildCalendar = (cursor) => {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return { date, inMonth: date.getMonth() === cursor.getMonth() };
  });
};

export default TasksPage;
