import React, { useMemo, useState } from "react";
import { FiCheckSquare, FiClock, FiFileText, FiFolder, FiPlus, FiX, FiZap } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { apiClient, getErrorMessage } from "../../api/apiClient.js";

const quickTypes = [
  { id: "note", label: "Note", icon: FiFileText, path: "/notes", placeholder: "Capture an idea..." },
  { id: "task", label: "Task", icon: FiCheckSquare, path: "/tasks", placeholder: "Add a task..." },
  { id: "habit", label: "Habit", icon: FiZap, path: "/habits", placeholder: "Build a habit..." },
  { id: "project", label: "Project", icon: FiFolder, path: "/projects", placeholder: "Name a project..." },
  { id: "focus", label: "Focus", icon: FiClock, path: "/focus", placeholder: "Start a focus session" },
];

const endpointByType = {
  note: "/api/notes",
  task: "/api/tasks",
  habit: "/api/habits",
  project: "/api/projects",
};

const payloadByType = {
  note: (title) => ({ title, content: title, category: "Inbox", color: "gold" }),
  task: (title) => ({ title, priority: "medium", status: "todo" }),
  habit: (title) => ({ name: title, color: "#e5b85c" }),
  project: (title) => ({ name: title, color: "gold", icon: "folder" }),
};

const QuickAddModal = ({ open, onClose }) => {
  const navigate = useNavigate();
  const [type, setType] = useState("note");
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedType = useMemo(() => quickTypes.find((item) => item.id === type), [type]);

  if (!open) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (type === "focus") {
      onClose();
      navigate("/focus");
      return;
    }
    if (!title.trim()) {
      toast.error("Add a title first");
      return;
    }

    setSaving(true);
    try {
      await apiClient.post(endpointByType[type], payloadByType[type](title.trim()));
      toast.success(`${selectedType.label} added`);
      setTitle("");
      onClose();
      navigate(selectedType.path);
    } catch (error) {
      toast.error(getErrorMessage(error, `Unable to add ${selectedType.label.toLowerCase()}`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/78 p-4 backdrop-blur-[2px]" onMouseDown={onClose}>
      <form
        className="w-full max-w-[714px] overflow-hidden rounded-[28px] border border-[#2a2a2a] bg-[#090909] shadow-[0_24px_90px_rgba(0,0,0,0.72)]"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="flex items-center justify-between border-b border-[#242424] px-6 py-5">
          <div>
            <p className="text-[13px] font-black uppercase tracking-[0.36em] text-[#f0c96a]">Quick Add</p>
            <h2 className="mt-2 text-[26px] font-black leading-none tracking-[-0.02em] text-[#f5f5f5]">Capture without losing flow</h2>
          </div>
          <button
            className="grid h-12 w-12 place-items-center rounded-[20px] border border-[#242424] text-xl text-[#a3a3a3] transition hover:border-[#e5b85c]/50 hover:text-[#f5f5f5]"
            type="button"
            onClick={onClose}
            aria-label="Close quick add"
          >
            <FiX />
          </button>
        </div>

        <div className="grid gap-5 px-6 py-[26px]">
          <div className="grid grid-cols-2 gap-3">
            {quickTypes.map((item) => {
              const Icon = item.icon;
              const active = item.id === type;
              return (
                <button
                  key={item.id}
                  className={`flex h-[62px] items-center justify-center gap-3 rounded-[20px] border px-4 text-[21px] font-semibold transition ${
                    active
                      ? "border-[#e5b85c] bg-[#e5b85c] text-[#111111]"
                      : "border-[#242424] bg-[#121212] text-[#a3a3a3] hover:border-[#e5b85c]/50 hover:text-[#f5f5f5]"
                  }`}
                  type="button"
                  onClick={() => setType(item.id)}
                >
                  <Icon />
                  {item.label}
                </button>
              );
            })}
          </div>

          <label className="grid gap-2">
            <span className="text-[18px] font-black text-[#a3a3a3]">{type === "focus" ? "Focus" : `${selectedType.label} title`}</span>
            <input
              autoFocus
              className="h-[78px] rounded-[22px] border border-[#2a2a2a] bg-[#121212] px-5 text-[20px] text-[#f5f5f5] outline-none transition placeholder:text-[#737373] focus:border-[#e5b85c] focus:ring-4 focus:ring-[#e5b85c]/25"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={selectedType.placeholder}
              disabled={type === "focus"}
            />
          </label>
        </div>

        <div className="grid gap-4 border-t border-[#242424] px-6 py-[26px]">
          <button
            className="inline-flex h-[61px] items-center justify-center gap-3 rounded-[21px] bg-[#e5b85c] px-5 text-[20px] font-semibold text-[#111111] transition hover:bg-[#f0c96a] disabled:opacity-60"
            type="submit"
            disabled={saving}
          >
            <FiPlus />
            {type === "focus" ? "Start Focus" : saving ? "Adding..." : `Add ${selectedType.label}`}
          </button>
          <button
            className="h-[61px] rounded-[21px] border border-[#242424] px-5 text-[19px] font-medium text-[#a3a3a3] transition hover:border-[#e5b85c]/50 hover:text-[#f5f5f5]"
            type="button"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuickAddModal;
