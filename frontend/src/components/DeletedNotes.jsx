import React, { useEffect, useState, useRef } from "react";
import { apiClient } from "../lib/api-client";
import { toast } from "sonner";
import { useAppStore } from "../store";
import { GET_DELETED_NOTES_ROUTE, RESTORE_NOTE_ROUTE } from "../utils/constant";
import "./DeletedNotes.css"; // Ensure you have a CSS file to style these cards

const DeletedNotes = () => {
  const { userInfo } = useAppStore();
  const [deletedNotes, setDeletedNotes] = useState([]);
  const notesContainerRef = useRef(null);

  useEffect(() => {
    const fetchDeletedNotes = async () => {
      try {
        const response = await apiClient.get(GET_DELETED_NOTES_ROUTE, {
          withCredentials: true,
        });
        setDeletedNotes(response.data.deletedNotes || []);
      } catch (error) {
        console.error("Error fetching deleted notes:", error);
        setDeletedNotes([]);
      }
    };

    fetchDeletedNotes();
  }, []);

  const handleRestoreNote = async (noteId) => {
    try {
      const response = await apiClient.post(
        RESTORE_NOTE_ROUTE,
        { userId: userInfo.id, noteId },
        { withCredentials: true }
      );

      if (response.status === 200) {
        setDeletedNotes((prevNotes) => prevNotes.filter((note) => note._id !== noteId));
        toast.success("Note restored successfully!");
      }
    } catch (error) {
      console.error("Error restoring note:", error);
      toast.error("Failed to restore note.");
    }
  };

  return (
    <div className="deleted-notes-container">
      <div className="notesTitle">
        <h1 className="title">Deleted Notes</h1>
      </div>
      
      <div className="deleted-notes-wrapper" ref={notesContainerRef}>
        <div className="deleted-notes-list">
          {deletedNotes.length > 0 ? (
            deletedNotes.map((note) => (
              <div key={note._id} className="deleted-note-card">
                <div className="note-header">
                  <h3>{note.title}</h3>
                  <button className="restore-btn" onClick={() => handleRestoreNote(note._id)}>♻️ Restore</button>
                </div>
                <div className="separator"></div>
                <p>{note.content}</p>
                {note.category && <div className="category">{note.category}</div>}
              </div>
            ))
          ) : (
            <div className="empty-state">
              <img src="/empty-notes.svg" alt="No Deleted Notes" className="empty-image" />
              <p className="empty-text">No deleted notes available.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeletedNotes;
