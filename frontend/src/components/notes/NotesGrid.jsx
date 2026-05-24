import React from "react";
import EmptyState from "../common/EmptyState.jsx";
import NoteCard from "./NoteCard.jsx";

const NotesGrid = ({ notes, loading, error, onRetry, emptyTitle, emptyDescription, ...handlers }) => {
  if (loading) {
    return (
      <div className="skeleton-grid">
        {Array.from({ length: 6 }).map((_, index) => (
          <div className="skeleton-card" key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel">
        <EmptyState title="Could not load notes" description={error} actionLabel="Retry" onAction={onRetry} />
      </div>
    );
  }

  if (!notes.length) {
    return (
      <EmptyState
        title={emptyTitle || "No notes yet"}
        description={emptyDescription || "Create your first note to start organizing ideas."}
        actionLabel={handlers.onCreate ? "Create note" : undefined}
        onAction={handlers.onCreate}
      />
    );
  }

  return (
    <div className="notes-grid">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} {...handlers} />
      ))}
    </div>
  );
};

export default NotesGrid;
