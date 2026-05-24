import React, { useEffect, useState } from "react";
import { FiRotateCcw, FiTrash2 } from "react-icons/fi";
import { toast } from "sonner";
import { apiClient, getErrorMessage } from "../api/apiClient.js";
import Button from "../components/common/Button.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import Loader from "../components/common/Loader.jsx";
import AppShell from "../components/layout/AppShell.jsx";
import Header from "../components/layout/Header.jsx";

const DeletedNotes = () => {
  const [deletedNotes, setDeletedNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDeletedNotes = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.get("/api/deleted-notes");
      setDeletedNotes(response.data.data.deletedNotes);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to load deleted notes"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeletedNotes();
  }, []);

  const restoreNote = async (note) => {
    try {
      await apiClient.post(`/api/deleted-notes/${note.id}/restore`);
      setDeletedNotes((current) => current.filter((entry) => entry.id !== note.id));
      toast.success("Note restored");
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Unable to restore note"));
    }
  };

  const permanentlyDelete = async (note) => {
    try {
      await apiClient.delete(`/api/deleted-notes/${note.id}`);
      setDeletedNotes((current) => current.filter((entry) => entry.id !== note.id));
      toast.success("Note permanently deleted");
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Unable to permanently delete note"));
    }
  };

  const emptyTrash = async () => {
    try {
      await apiClient.delete("/api/deleted-notes");
      setDeletedNotes([]);
      toast.success("Trash emptied");
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Unable to empty trash"));
    }
  };

  return (
    <AppShell>
      {({ openMenu }) => (
        <>
          <Header
            title="Deleted Notes"
            subtitle="Restore notes or remove them permanently."
            onMenu={openMenu}
          />

          <section className="trash-toolbar">
            <p>{deletedNotes.length} deleted note{deletedNotes.length === 1 ? "" : "s"}</p>
            {!!deletedNotes.length && (
              <Button variant="danger" onClick={emptyTrash}>
                <FiTrash2 />
                Empty trash
              </Button>
            )}
          </section>

          {loading ? (
            <Loader label="Loading deleted notes" />
          ) : error ? (
            <EmptyState title="Could not load trash" description={error} actionLabel="Retry" onAction={loadDeletedNotes} />
          ) : deletedNotes.length ? (
            <div className="notes-grid">
              {deletedNotes.map((note) => (
                <article className="note-card deleted-card" key={note.id}>
                  <div className="note-card-top">
                    <span className="category-badge">{note.category}</span>
                    <small>{new Date(note.deletedAt).toLocaleDateString()}</small>
                  </div>
                  <h3>{note.title}</h3>
                  <p>{note.content}</p>
                  <div className="modal-actions">
                    <Button variant="secondary" onClick={() => restoreNote(note)}>
                      <FiRotateCcw />
                      Restore
                    </Button>
                    <Button variant="danger" onClick={() => permanentlyDelete(note)}>
                      <FiTrash2 />
                      Delete forever
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="Trash is empty" description="Deleted notes will appear here until restored or removed." />
          )}
        </>
      )}
    </AppShell>
  );
};

export default DeletedNotes;
