import React, { useEffect, useState } from "react";
import EmptyState from "../../components/common/EmptyState.jsx";
import Loader from "../../components/common/Loader.jsx";
import AppShell from "../../components/layout/AppShell.jsx";
import Header from "../../components/layout/Header.jsx";
import { apiClient } from "../../api/apiClient.js";

const AnalyticsPage = () => {
  const [state, setState] = useState({ loading: true, notes: [], tasks: [], habits: [], reminders: [], focusStats: null });

  useEffect(() => {
    Promise.all([
      apiClient.get("/api/notes"),
      apiClient.get("/api/tasks"),
      apiClient.get("/api/habits"),
      apiClient.get("/api/reminders"),
      apiClient.get("/api/focus-sessions"),
    ])
      .then(([notes, tasks, habits, reminders, focus]) => {
        setState({
          loading: false,
          notes: notes.data.data.notes,
          tasks: tasks.data.data.tasks,
          habits: habits.data.data.habits,
          reminders: reminders.data.data.reminders,
          focusStats: focus.data.data.stats,
        });
      })
      .catch(() => setState((current) => ({ ...current, loading: false })));
  }, []);

  const doneTasks = state.tasks.filter((task) => task.status === "done").length;
  const focusMinutes = state.focusStats?.weekMinutes || 0;
  const score = Math.min(100, Math.round(doneTasks * 12 + state.notes.length * 3 + state.habits.filter((habit) => habit.completedToday).length * 10 + focusMinutes / 5));

  return (
    <AppShell>
      {({ openMenu }) => (
        <>
          <Header title="Analytics" subtitle="A focused snapshot of your productivity system." onMenu={openMenu} />
          {state.loading ? (
            <Loader label="Calculating insights" />
          ) : (
            <>
              <section className="dashboard-stats">
                <Metric label="Productivity score" value={`${score}%`} />
                <Metric label="Completed tasks" value={doneTasks} />
                <Metric label="Focus this week" value={`${focusMinutes}m`} />
              </section>
              <section className="grid gap-5 lg:grid-cols-2">
                <ChartCard title="Tasks by status" rows={["todo", "doing", "done"].map((status) => ({ label: status, value: state.tasks.filter((task) => task.status === status).length }))} />
                <ChartCard title="Tasks by priority" rows={["low", "medium", "high", "urgent"].map((priority) => ({ label: priority, value: state.tasks.filter((task) => task.priority === priority).length }))} />
              </section>
              <section className="panel mt-5">
                <h2 className="mb-3 text-lg font-black">Weekly wins</h2>
                {doneTasks || state.notes.length || focusMinutes ? (
                  <p className="text-[#a3a3a3]">You completed {doneTasks} tasks, focused for {focusMinutes} minutes, and kept {state.notes.length} notes active.</p>
                ) : (
                  <EmptyState title="No wins logged yet" description="Complete a task or create a note to start analytics." />
                )}
              </section>
            </>
          )}
        </>
      )}
    </AppShell>
  );
};

const Metric = ({ label, value }) => (
  <div className="stat-card">
    <div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  </div>
);

const ChartCard = ({ title, rows }) => {
  const max = Math.max(1, ...rows.map((row) => row.value));
  return (
    <article className="rounded-3xl border border-[#242424] bg-[#121212] p-5">
      <h2 className="mb-5 text-lg font-black text-[#f5f5f5]">{title}</h2>
      <div className="grid gap-4">
        {rows.map((row) => (
          <div key={row.label} className="grid gap-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold uppercase text-[#a3a3a3]">{row.label}</span>
              <strong className="text-[#f5f5f5]">{row.value}</strong>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-[#0b0b0b]">
              <span className="block h-full rounded-full bg-[#e5b85c]" style={{ width: `${(row.value / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
};

export default AnalyticsPage;
