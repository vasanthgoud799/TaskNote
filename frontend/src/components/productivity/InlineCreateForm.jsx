import React, { useState } from "react";
import { FiPlus } from "react-icons/fi";
import Button from "../common/Button.jsx";

const InlineCreateForm = ({ placeholder, submitLabel = "Add", onSubmit, fields = [] }) => {
  const initialState = fields.reduce((state, field) => ({ ...state, [field.name]: field.defaultValue || "" }), {
    title: "",
  });
  const [form, setForm] = useState(initialState);
  const [saving, setSaving] = useState(false);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await onSubmit(form);
      setForm(initialState);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="panel mb-4 grid gap-3 md:grid-cols-[1fr_auto]" onSubmit={handleSubmit}>
      <input
        className="rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900"
        value={form.title}
        onChange={(event) => updateField("title", event.target.value)}
        placeholder={placeholder}
      />
      {fields.map((field) => (
        <input
          key={field.name}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900"
          type={field.type || "text"}
          value={form[field.name]}
          onChange={(event) => updateField(field.name, event.target.value)}
          placeholder={field.placeholder}
        />
      ))}
      <Button type="submit" disabled={saving}>
        <FiPlus />
        {saving ? "Adding..." : submitLabel}
      </Button>
    </form>
  );
};

export default InlineCreateForm;
