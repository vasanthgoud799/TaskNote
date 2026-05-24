import React, { useState } from "react";
import { FiEdit3, FiPlus, FiRefreshCw, FiTag, FiTrash2 } from "react-icons/fi";
import { toast } from "sonner";
import { getErrorMessage } from "../../api/apiClient.js";
import EmptyState from "../../components/common/EmptyState.jsx";
import AppShell from "../../components/layout/AppShell.jsx";
import Header from "../../components/layout/Header.jsx";
import { useResource } from "../../hooks/useResource.js";

const tagColors = ["#e5b85c", "#c9942b", "#8f7a4a", "#a78b5f", "#e0b34f", "#f0c96a"];

const TagsPage = () => {
  const { items: tags, loading, error, load, create, update, remove } = useResource("/api/tags", "tags");
  const [form, setForm] = useState({ name: "", color: tagColors[0] });
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error("Tag name is required");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await update(editingId, form, "tag");
      } else {
        await create(form, "tag");
      }
      setForm({ name: "", color: tagColors[0] });
      setEditingId(null);
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Unable to save tag"));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (tag) => {
    setEditingId(tag.id);
    setForm({ name: tag.name, color: tag.color });
  };

  const handleDelete = async (tag) => {
    const usedCount = (tag.noteCount || 0) + (tag.taskCount || 0);
    const message = usedCount
      ? `"${tag.name}" is used by ${usedCount} item${usedCount === 1 ? "" : "s"}. Delete it anyway?`
      : `Delete "${tag.name}"?`;
    if (!window.confirm(message)) return;
    try {
      await remove(tag.id);
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Unable to delete tag"));
    }
  };

  return (
    <AppShell>
      {({ openMenu }) => (
        <>
          <Header title="Tags" subtitle="Organize notes and tasks with a restrained, focused taxonomy." onMenu={openMenu} />

          <div className="mx-auto grid max-w-6xl gap-5">
            <form className="rounded-3xl border border-[#242424] bg-[#121212] p-5 shadow-2xl shadow-black/20" onSubmit={handleSubmit}>
              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <label className="grid gap-2">
                  <span className="text-sm font-bold text-[#a3a3a3]">{editingId ? "Edit tag" : "New tag"}</span>
                  <input
                    className="rounded-2xl border border-[#242424] bg-[#0b0b0b] px-4 py-3 text-[#f5f5f5] outline-none transition placeholder:text-[#737373] focus:border-[#e5b85c] focus:ring-4 focus:ring-[#e5b85c]/10"
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="e.g., Work, Personal, Deep Work"
                  />
                </label>
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#e5b85c] px-5 py-3 font-black text-[#171107] transition hover:bg-[#f0c96a] disabled:opacity-60 md:self-end"
                  type="submit"
                  disabled={saving}
                >
                  <FiPlus />
                  {saving ? "Saving..." : editingId ? "Update" : "Add"}
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {tagColors.map((color) => (
                  <button
                    key={color}
                    className={`h-9 w-9 rounded-2xl border-2 transition ${form.color === color ? "border-white" : "border-[#242424]"}`}
                    style={{ backgroundColor: color }}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, color }))}
                    aria-label={`Use ${color}`}
                  />
                ))}
              </div>
            </form>

            <div className="flex justify-end">
              <button
                className="inline-flex items-center gap-2 rounded-2xl border border-[#242424] bg-[#121212] px-4 py-2 font-bold text-[#a3a3a3] transition hover:border-[#e5b85c]/50 hover:text-[#f5f5f5]"
                type="button"
                onClick={load}
              >
                <FiRefreshCw />
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="grid gap-4 md:grid-cols-3">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="h-40 animate-pulse rounded-3xl border border-[#242424] bg-[#121212]" />
                ))}
              </div>
            ) : error ? (
              <EmptyState title="Unable to load tags" description={error} actionLabel="Retry" onAction={load} />
            ) : tags.length ? (
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {tags.map((tag) => (
                  <article key={tag.id} className="rounded-3xl border border-[#242424] bg-[#121212] p-5 transition hover:-translate-y-1 hover:border-[#e5b85c]/50 hover:shadow-2xl hover:shadow-black/20">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-11 w-11 place-items-center rounded-2xl text-[#171107]" style={{ backgroundColor: tag.color }}>
                          <FiTag />
                        </span>
                        <div>
                          <h3 className="text-lg font-black text-[#f5f5f5]">{tag.name}</h3>
                          <p className="text-sm text-[#a3a3a3]">{tag.noteCount} notes · {tag.taskCount} tasks</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="grid h-9 w-9 place-items-center rounded-xl border border-[#242424] text-[#a3a3a3] transition hover:text-[#f5f5f5]" type="button" onClick={() => startEdit(tag)} aria-label={`Edit ${tag.name}`}>
                          <FiEdit3 />
                        </button>
                        <button className="grid h-9 w-9 place-items-center rounded-xl border border-[#242424] text-[#ff7c72] transition hover:bg-[#ff7c72]/10" type="button" onClick={() => handleDelete(tag)} aria-label={`Delete ${tag.name}`}>
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </section>
            ) : (
              <EmptyState title="No tags yet" description="Create a tag to group tasks and note categories in one place." actionLabel="Create tag" onAction={() => document.querySelector("input")?.focus()} />
            )}
          </div>
        </>
      )}
    </AppShell>
  );
};

export default TagsPage;
