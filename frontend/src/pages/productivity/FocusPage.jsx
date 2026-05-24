import React, { useEffect, useMemo, useState } from "react";
import { FiClock, FiPause, FiPlay, FiRotateCcw, FiSave } from "react-icons/fi";
import { toast } from "sonner";
import { apiClient, getErrorMessage } from "../../api/apiClient.js";
import Button from "../../components/common/Button.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import Loader from "../../components/common/Loader.jsx";
import AppShell from "../../components/layout/AppShell.jsx";
import Header from "../../components/layout/Header.jsx";

const presets = [
  { id: "pomodoro", label: "Pomodoro 25", minutes: 25 },
  { id: "deep", label: "Deep 50", minutes: 50 },
  { id: "quick", label: "Quick 15", minutes: 15 },
];

const emptyStats = {
  todayMinutes: 0,
  weekMinutes: 0,
  sessionCount: 0,
  last7Days: [],
};

const FocusPage = () => {
  const [preset, setPreset] = useState(presets[0]);
  const [seconds, setSeconds] = useState(presets[0].minutes * 60);
  const [running, setRunning] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [tasks, setTasks] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(emptyStats);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const elapsedMinutes = Math.max(0, Math.ceil((preset.minutes * 60 - seconds) / 60));
  const progress = Math.min(100, Math.round(((preset.minutes * 60 - seconds) / (preset.minutes * 60)) * 100));

  const loadFocus = async () => {
    setLoading(true);
    try {
      const [taskResponse, focusResponse] = await Promise.all([
        apiClient.get("/api/tasks"),
        apiClient.get("/api/focus-sessions"),
      ]);
      setTasks(taskResponse.data.data.tasks.filter((task) => task.status !== "done"));
      setSessions(focusResponse.data.data.sessions || []);
      setStats(focusResponse.data.data.stats || emptyStats);
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to load focus data"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFocus();
  }, []);

  useEffect(() => {
    if (!running) return undefined;
    const timer = setInterval(() => {
      setSeconds((current) => {
        if (current <= 1) {
          setRunning(false);
          toast.success("Focus block complete. Save the session when you are ready.");
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [running]);

  const chartMax = useMemo(
    () => Math.max(30, ...stats.last7Days.map((day) => day.minutes || 0)),
    [stats.last7Days]
  );

  const switchPreset = (nextPreset) => {
    setPreset(nextPreset);
    setSeconds(nextPreset.minutes * 60);
    setRunning(false);
  };

  const saveSession = async () => {
    if (elapsedMinutes < 1) {
      toast.error("Focus for at least one minute before saving");
      return;
    }
    setSaving(true);
    try {
      const response = await apiClient.post("/api/focus-sessions", {
        durationMinutes: elapsedMinutes,
        preset: preset.id,
        taskId: selectedTaskId || null,
      });
      setSessions((current) => [response.data.data.session, ...current].slice(0, 10));
      setStats(response.data.data.stats || emptyStats);
      setSeconds(preset.minutes * 60);
      setRunning(false);
      toast.success(response.data.message);
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to save focus session"));
    } finally {
      setSaving(false);
    }
  };

  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const rest = (seconds % 60).toString().padStart(2, "0");

  return (
    <AppShell>
      {({ openMenu }) => (
        <>
          <Header title="Focus" subtitle="Deep work, undistracted. One block at a time." onMenu={openMenu} />
          {loading ? (
            <Loader label="Loading focus workspace" />
          ) : (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]">
              <section className="rounded-3xl border border-[#242424] bg-[#121212] p-5 shadow-2xl shadow-black/20">
                <div className="mx-auto grid max-w-xl place-items-center gap-6 text-center">
                  <div className="grid grid-cols-3 gap-2 rounded-2xl bg-[#0b0b0b] p-1">
                    {presets.map((item) => (
                      <button
                        key={item.id}
                        className={`rounded-xl px-3 py-2 text-sm font-black transition ${
                          preset.id === item.id ? "bg-[#e5b85c] text-[#171107]" : "text-[#a3a3a3] hover:text-[#f5f5f5]"
                        }`}
                        type="button"
                        onClick={() => switchPreset(item)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <div
                    className="grid aspect-square w-full max-w-sm place-items-center rounded-full"
                    style={{
                      background: `conic-gradient(#e5b85c ${progress}%, #202020 ${progress}% 100%)`,
                    }}
                  >
                    <div className="grid h-[88%] w-[88%] place-items-center rounded-full border border-[#242424] bg-[#0b0b0b]">
                      <div>
                        <strong className="block text-6xl font-black text-[#f5f5f5] sm:text-7xl">{minutes}:{rest}</strong>
                        <span className="mt-2 block text-sm font-black uppercase tracking-[0.24em] text-[#a3a3a3]">
                          {running ? "Focusing" : seconds === 0 ? "Complete" : "Ready"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <select
                    className="w-full rounded-2xl border border-[#242424] bg-[#0b0b0b] px-4 py-3 text-[#f5f5f5] outline-none focus:border-[#e5b85c]"
                    value={selectedTaskId}
                    onChange={(event) => setSelectedTaskId(event.target.value)}
                  >
                    <option value="">No task</option>
                    {tasks.map((task) => (
                      <option key={task.id} value={task.id}>{task.title}</option>
                    ))}
                  </select>

                  <div className="grid w-full gap-3 sm:grid-cols-3">
                    <Button onClick={() => setRunning((value) => !value)}>
                      {running ? <FiPause /> : <FiPlay />}
                      {running ? "Pause" : "Start"}
                    </Button>
                    <Button variant="secondary" onClick={saveSession} disabled={saving || elapsedMinutes < 1}>
                      <FiSave />
                      {saving ? "Saving" : "Save"}
                    </Button>
                    <Button variant="ghost" onClick={() => { setRunning(false); setSeconds(preset.minutes * 60); }}>
                      <FiRotateCcw />
                      Reset
                    </Button>
                  </div>
                </div>
              </section>

              <aside className="grid gap-5">
                <section className="rounded-3xl border border-[#242424] bg-[#121212] p-5">
                  <h2 className="text-xl font-black text-[#f5f5f5]">Today</h2>
                  <dl className="mt-5 grid gap-4">
                    <Stat label="Minutes" value={stats.todayMinutes} />
                    <Stat label="This week" value={`${stats.weekMinutes}m`} />
                    <Stat label="Sessions" value={stats.sessionCount} />
                  </dl>
                </section>

                <section className="rounded-3xl border border-[#242424] bg-[#121212] p-5">
                  <h2 className="text-xl font-black text-[#f5f5f5]">Last 7 days</h2>
                  {stats.last7Days.length ? (
                    <div className="mt-5 flex h-36 items-end gap-2">
                      {stats.last7Days.map((day) => (
                        <div key={day.date} className="grid flex-1 gap-2 text-center">
                          <div className="flex h-24 items-end rounded-xl bg-[#0b0b0b]">
                            <span
                              className="block w-full rounded-xl bg-[#e5b85c]"
                              style={{ height: `${Math.max(6, (day.minutes / chartMax) * 100)}%` }}
                            />
                          </div>
                          <small className="text-[#737373]">{day.label}</small>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState title="No sessions yet" description="Save a focus block to start the weekly chart." />
                  )}
                </section>
              </aside>
              <section className="rounded-3xl border border-[#242424] bg-[#121212] p-5 xl:col-span-2">
                <h2 className="text-xl font-black text-[#f5f5f5]">Recent sessions</h2>
                {sessions.length ? (
                  <div className="mt-5 grid gap-3">
                    {sessions.slice(0, 6).map((session) => (
                      <article key={session.id} className="flex items-center justify-between rounded-2xl border border-[#242424] bg-[#0b0b0b] p-4">
                        <div>
                          <strong className="block text-[#f5f5f5]">{session.durationMinutes} minute {session.preset}</strong>
                          <span className="text-sm text-[#a3a3a3]">{new Date(session.completedAt).toLocaleString()}</span>
                        </div>
                        <span className="rounded-full bg-[#e5b85c]/10 px-3 py-1 text-sm font-black text-[#e5b85c]">Saved</span>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="grid min-h-40 place-items-center text-center text-[#a3a3a3]">
                    <div>
                      <FiClock className="mx-auto mb-3 text-3xl text-[#8f7337]" />
                      <p>No sessions yet. Your first deep block is right above.</p>
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}
        </>
      )}
    </AppShell>
  );
};

const Stat = ({ label, value }) => (
  <div className="flex items-center justify-between gap-4">
    <dt className="text-[#a3a3a3]">{label}</dt>
    <dd className="text-2xl font-black text-[#f5f5f5]">{value}</dd>
  </div>
);

export default FocusPage;
