import React, { useEffect, useMemo, useState } from "react";
import { FiSave, FiStar, FiX } from "react-icons/fi";
import Button from "../common/Button.jsx";
import Input from "../common/Input.jsx";

const categories = ["Personal", "Work", "Ideas", "Meeting", "Follow-up", "Important", "Urgent"];

const emptyNote = {
  title: "",
  content: "",
  category: "Personal",
  starred: false,
  pinned: false,
  color: "sky",
  reminderAt: "",
  notifyByEmail: false,
  notifyByPhone: false,
};

const NoteEditor = ({ note, mode = "edit", saving, onSave, onClose }) => {
  const isReadOnly = mode === "view";
  const draftKey = useMemo(() => (note?.id ? null : "tasknote-new-note-draft"), [note?.id]);
  const [form, setForm] = useState(emptyNote);

  useEffect(() => {
    if (note) {
      setForm({
        title: note.title || "",
        content: note.content || "",
        category: note.category || "Personal",
        starred: Boolean(note.starred),
        pinned: Boolean(note.pinned),
        color: note.color || "sky",
        reminderAt: note.reminderAt ? note.reminderAt.slice(0, 16) : "",
        notifyByEmail: Boolean(note.notifyByEmail),
        notifyByPhone: Boolean(note.notifyByPhone),
      });
      return;
    }

    const draft = draftKey ? localStorage.getItem(draftKey) : null;
    setForm(draft ? JSON.parse(draft) : emptyNote);
  }, [note, draftKey]);

  useEffect(() => {
    if (draftKey && !isReadOnly) {
      localStorage.setItem(draftKey, JSON.stringify(form));
    }
  }, [draftKey, form, isReadOnly]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave({
      ...form,
      reminderAt: form.reminderAt ? new Date(form.reminderAt).toISOString() : null,
    }, () => {
      if (draftKey) {
        localStorage.removeItem(draftKey);
      }
    });
  };

  return (
    <form className="note-editor" onSubmit={handleSubmit}>
      <div className="modal-header">
        <div>
          <h2>{isReadOnly ? "Read note" : note ? "Edit note" : "Create note"}</h2>
          <p>{note ? "Changes save back to your notebook." : "Drafts are saved locally while you type."}</p>
        </div>
        <button className="icon-button" type="button" onClick={onClose} aria-label="Close">
          <FiX />
        </button>
      </div>

      <Input
        label="Title"
        value={form.title}
        onChange={(event) => updateField("title", event.target.value)}
        placeholder="Project brief, meeting notes, a sudden good idea..."
        readOnly={isReadOnly}
        autoFocus
      />

      <label className="field">
        <span>Content</span>
        <textarea
          value={form.content}
          onChange={(event) => updateField("content", event.target.value)}
          placeholder="Write the details here..."
          readOnly={isReadOnly}
          rows={10}
        />
      </label>

      <div className="editor-row">
        <label className="field">
          <span>Category</span>
          <select
            value={form.category}
            onChange={(event) => updateField("category", event.target.value)}
            disabled={isReadOnly}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <button
          className={`favorite-toggle ${form.starred ? "active" : ""}`}
          type="button"
          onClick={() => !isReadOnly && updateField("starred", !form.starred)}
          disabled={isReadOnly}
        >
          <FiStar />
          {form.starred ? "Starred" : "Mark starred"}
        </button>
      </div>

      <div className="editor-row">
        <label className="field">
          <span>Color label</span>
          <select value={form.color} onChange={(event) => updateField("color", event.target.value)} disabled={isReadOnly}>
            {["sky", "emerald", "amber", "rose", "violet"].map((color) => (
              <option key={color} value={color}>{color}</option>
            ))}
          </select>
        </label>
        <label className="favorite-toggle">
          <input
            type="checkbox"
            checked={form.pinned}
            onChange={(event) => updateField("pinned", event.target.checked)}
            disabled={isReadOnly}
          />
          Pinned
        </label>
      </div>

      <div className="editor-row">
        <Input
          label="Reminder"
          type="datetime-local"
          value={form.reminderAt}
          onChange={(event) => updateField("reminderAt", event.target.value)}
          readOnly={isReadOnly}
        />
        <label className="favorite-toggle">
          <input
            type="checkbox"
            checked={form.notifyByEmail}
            onChange={(event) => updateField("notifyByEmail", event.target.checked)}
            disabled={isReadOnly}
          />
          Email
        </label>
        <label className="favorite-toggle">
          <input
            type="checkbox"
            checked={form.notifyByPhone}
            onChange={(event) => updateField("notifyByPhone", event.target.checked)}
            disabled={isReadOnly}
          />
          SMS
        </label>
      </div>

      {!isReadOnly && (
        <div className="modal-actions">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            <FiSave />
            {saving ? "Saving..." : "Save note"}
          </Button>
        </div>
      )}
    </form>
  );
};

export default NoteEditor;
