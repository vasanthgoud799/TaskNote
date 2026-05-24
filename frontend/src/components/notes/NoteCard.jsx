import React from "react";
import { FiClock, FiEdit3, FiMapPin, FiStar, FiTrash2 } from "react-icons/fi";

const formatDate = (value) =>
  new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const NoteCard = ({ note, onOpen, onEdit, onDelete, onToggleStar, onTogglePin }) => (
  <article className="note-card" onClick={() => onOpen(note)}>
    <div className="note-card-top">
      <span className="category-badge">{note.pinned ? "Pinned" : note.category || "Personal"}</span>
      <div className="note-card-actions">
        {onTogglePin && (
          <button
            className={`icon-button star-button ${note.pinned ? "active" : ""}`}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onTogglePin(note);
            }}
            aria-label={note.pinned ? "Unpin note" : "Pin note"}
          >
            <FiMapPin />
          </button>
        )}
        <button
          className={`icon-button star-button ${note.starred ? "active" : ""}`}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleStar(note);
          }}
          aria-label={note.starred ? "Unstar note" : "Star note"}
        >
          <FiStar />
        </button>
      </div>
    </div>

    <h3>{note.title}</h3>
    <p>{note.content}</p>

    <div className="note-card-footer">
      <span>
        <FiClock />
        {formatDate(note.updatedAt)}
      </span>
      <div className="note-card-actions">
        <button
          className="icon-button"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onEdit(note);
          }}
          aria-label="Edit note"
        >
          <FiEdit3 />
        </button>
        <button
          className="icon-button danger"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDelete(note);
          }}
          aria-label="Delete note"
        >
          <FiTrash2 />
        </button>
      </div>
    </div>
  </article>
);

export default NoteCard;
