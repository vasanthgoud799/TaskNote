import React from "react";
import { FiCheckCircle, FiPause, FiTrash2 } from "react-icons/fi";
import EmptyState from "../../components/common/EmptyState.jsx";
import Loader from "../../components/common/Loader.jsx";
import AppShell from "../../components/layout/AppShell.jsx";
import Header from "../../components/layout/Header.jsx";
import InlineCreateForm from "../../components/productivity/InlineCreateForm.jsx";
import { apiClient } from "../../api/apiClient.js";
import { useResource } from "../../hooks/useResource.js";

const HabitsPage = () => {
  const { items: habits, setItems, loading, error, load, create, update, remove } = useResource("/api/habits", "habits");

  const toggleToday = async (habit) => {
    const response = await apiClient.post(`/api/habits/${habit.id}/toggle-today`);
    const nextHabit = response.data.data.habit;
    setItems((current) => current.map((entry) => (entry.id === habit.id ? nextHabit : entry)));
  };

  return (
    <AppShell>
      {({ openMenu }) => (
        <>
          <Header title="Habits" subtitle="Streaks, consistency, and small daily wins." onMenu={openMenu} />
          <InlineCreateForm placeholder="Add a habit..." submitLabel="Add habit" onSubmit={(form) => create({ name: form.title }, "habit")} />
          {loading ? (
            <Loader label="Loading habits" />
          ) : error ? (
            <EmptyState title="Could not load habits" description={error} actionLabel="Retry" onAction={load} />
          ) : habits.length ? (
            <section className="notes-grid">
              {habits.map((habit) => (
                <article className="note-card" key={habit.id}>
                  <div className="note-card-top">
                    <span className="category-badge">{habit.frequency}</span>
                    <strong>{habit.currentStreak} day streak</strong>
                  </div>
                  <h3>{habit.name}</h3>
                  <p>{habit.completedToday ? "Completed today. Nice." : "Not completed today yet."}</p>
                  <div className="note-card-footer">
                    <button className="btn btn-secondary" type="button" onClick={() => toggleToday(habit)}>
                      <FiCheckCircle /> {habit.completedToday ? "Undo" : "Complete"}
                    </button>
                    <div className="note-card-actions">
                      <button className="icon-button" type="button" onClick={() => update(habit.id, { paused: !habit.paused }, "habit")} aria-label="Pause habit"><FiPause /></button>
                      <button className="icon-button danger" type="button" onClick={() => remove(habit.id)} aria-label="Archive habit"><FiTrash2 /></button>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          ) : (
            <EmptyState title="No habits yet" description="Start with one tiny repeatable behavior." />
          )}
        </>
      )}
    </AppShell>
  );
};

export default HabitsPage;
