import React, { useEffect, useMemo, useState } from "react";
import { FiBarChart2, FiCalendar, FiCheckSquare, FiClock, FiFileText, FiGrid, FiHome, FiMoon, FiPlus, FiSearch, FiSettings, FiTag, FiZap } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { apiClient } from "../../api/apiClient.js";
import CommandPalette from "../command/CommandPalette.jsx";
import QuickAddModal from "../command/QuickAddModal.jsx";
import Sidebar from "./Sidebar.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";

const AppShell = ({ children }) => {
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [searchables, setSearchables] = useState([]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "n") {
        event.preventDefault();
        setQuickAddOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!commandOpen) return;
    Promise.allSettled([
      apiClient.get("/api/notes"),
      apiClient.get("/api/tasks"),
      apiClient.get("/api/tags"),
      apiClient.get("/api/habits"),
    ]).then(([notes, tasks, tags, habits]) => {
      const noteItems = notes.status === "fulfilled" ? notes.value.data.data.notes.map((item) => ({ label: `Note: ${item.title}`, group: "Notes", icon: FiFileText, hint: `type:note ${item.category || ""}`, run: () => navigate("/notes") })) : [];
      const taskItems = tasks.status === "fulfilled" ? tasks.value.data.data.tasks.map((item) => ({ label: `Task: ${item.title}`, group: "Tasks", icon: FiCheckSquare, hint: `type:task status:${item.status} priority:${item.priority}`, run: () => navigate("/tasks") })) : [];
      const tagItems = tags.status === "fulfilled" ? tags.value.data.data.tags.map((item) => ({ label: `Tag: ${item.name}`, group: "Tags", icon: FiTag, hint: `tag:${item.name}`, run: () => navigate("/tags") })) : [];
      const habitItems = habits.status === "fulfilled" ? habits.value.data.data.habits.map((item) => ({ label: `Habit: ${item.name}`, group: "Habits", icon: FiZap, hint: "type:habit", run: () => navigate("/habits") })) : [];
      setSearchables([...noteItems, ...taskItems, ...tagItems, ...habitItems].slice(0, 40));
    });
  }, [commandOpen, navigate]);

  const actions = useMemo(
    () => [
      { label: "New Task", group: "Create", icon: FiCheckSquare, hint: "type:task", run: () => setQuickAddOpen(true) },
      { label: "New Note", group: "Create", icon: FiFileText, hint: "type:note", run: () => setQuickAddOpen(true) },
      { label: "Start Focus Session", group: "Create", icon: FiClock, hint: "focus", run: () => navigate("/focus") },
      { label: "Quick add", group: "Create", icon: FiPlus, hint: "Ctrl N", run: () => setQuickAddOpen(true) },
      { label: "Dashboard", group: "Go to", icon: FiHome, run: () => navigate("/dashboard") },
      { label: "Notes", group: "Go to", icon: FiFileText, run: () => navigate("/notes") },
      { label: "Tasks", group: "Go to", icon: FiCheckSquare, run: () => navigate("/tasks") },
      { label: "Kanban Board", group: "Go to", icon: FiGrid, run: () => navigate("/board") },
      { label: "Calendar", group: "Go to", icon: FiCalendar, run: () => navigate("/calendar") },
      { label: "Analytics", group: "Go to", icon: FiBarChart2, run: () => navigate("/analytics") },
      { label: "Habits", group: "Go to", icon: FiZap, run: () => navigate("/habits") },
      { label: "Tags", group: "Go to", icon: FiTag, run: () => navigate("/tags") },
      { label: "Settings", group: "Go to", icon: FiSettings, run: () => navigate("/settings") },
      { label: "Use dark theme", group: "Theme", icon: FiMoon, run: () => setTheme("dark") },
      { label: "Use AMOLED theme", group: "Theme", icon: FiMoon, run: () => setTheme("amoled") },
      { label: "Use light theme", group: "Theme", icon: FiMoon, run: () => setTheme("light") },
      { label: "Search help", group: "Tip", icon: FiSearch, hint: "type:task", run: () => toast.info("Try filters like type:task, due:today, priority:high, or tag:work.") },
      ...searchables,
    ],
    [navigate, searchables, setTheme]
  );

  return (
    <div className="app-shell">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} onQuickAdd={() => setQuickAddOpen(true)} />
      {mobileOpen && <button className="sidebar-scrim" type="button" onClick={() => setMobileOpen(false)} />}
      <main className="app-main">
        {typeof children === "function" ? children({ openMenu: () => setMobileOpen(true) }) : children}
      </main>
      <QuickAddModal open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} actions={actions} />
    </div>
  );
};

export default AppShell;
