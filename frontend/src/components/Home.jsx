import React, { useEffect, useLayoutEffect, useState, useRef } from "react";
import "./Home.css";
import CreateNote from "./CreateNote";
import { useAppStore } from "../store";
import { GET_NOTE_ROUTE, DELETE_NOTE_ROUTE } from "../utils/constant";
import { apiClient } from "../lib/api-client";
import { toast } from "sonner";

const HomeSection = () => {  
  const { userInfo } = useAppStore();
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [notes, setNotes] = useState(userInfo.notes || []);
  const [showCreateNote, setShowCreateNote] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNote, setSelectedNote] = useState(null);

  // Ref for tracking notes list
  const notesContainerRef = useRef(null);
  const lastNoteRef = useRef(null);

  useEffect(() => {
    document.body.classList.toggle("dark-theme", theme === "dark");
  }, [theme]);

  const fetchNotes = async () => {
    try {
      const response = await apiClient.get(GET_NOTE_ROUTE, { withCredentials: true });
      setNotes(response.data.notes || []);
    } catch (error) {
      console.error("Error fetching notes:", error);
      setNotes([]);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [showCreateNote]);

  // Scroll to bottom when notes update
  useLayoutEffect(() => {
    if (lastNoteRef.current) {
      lastNoteRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [notes]);

  const handleDeleteNote = async (noteId) => {
    try {
      const response = await apiClient.post(
        DELETE_NOTE_ROUTE, 
        { userId: userInfo.id, noteId }, 
        { withCredentials: true }
      );
      if (response.status === 200) {
        setNotes(response.data.notes);
        toast.success("Note deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note.");
    }
  };

  const handleEditNote = (note) => {
    setSelectedNote(note);
    setShowCreateNote(true);
  };

  const filteredNotes = notes.filter(
    (note) =>
      note?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note?.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="home-container">
      {showCreateNote ? (
        <CreateNote 
          setShowCreateNote={setShowCreateNote} 
          setNotes={setNotes} 
          notes={notes} 
          selectedNote={selectedNote} 
        />
      ) : (
        <>
          <div className="notesTitle">
            <h1 className="title">Your Notes</h1>
          </div>

          {/* Tabs & Search Bar */}
          <div className="top-bar">
            <div className="tabs">
              <button className="tab active">All ({notes.length})</button>
              <button className="tab">Starred (0)</button>
            </div>
            <input
              type="text"
              className="search-box"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Notes List - Wrapped in .notes-wrapper for correct scrolling */}
          <div className="notes-wrapper" ref={notesContainerRef}>
            <div className="notes-list">
              {filteredNotes.length > 0 ? (
                filteredNotes.map((note, index) => (
                  <div key={note._id} className="note" ref={index === filteredNotes.length - 1 ? lastNoteRef : null}>
                    <div className="note-header">
                      <h3>{note.title}</h3>
                      <div className="note-actions">
                        <button className="edit-btn" onClick={() => handleEditNote(note)}>✏️</button>
                        <button className="delete-btn" onClick={() => handleDeleteNote(note._id)}>🗑️</button>
                      </div>
                    </div>
                    <div className="separator"></div>
                    <p>{note.content}</p>
                    {note.category && <div className="category">{note.category}</div>}
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <img src="/empty-notes.svg" alt="No Notes" className="empty-image" />
                  <p className="empty-text">You haven’t any notes</p>
                </div>
              )}
            </div>
          </div>

          {/* Floating Add Button */}
          <button className="add-button" onClick={() => { setShowCreateNote(true); setSelectedNote(null); }}>+</button>
        </>
      )}
    </div>
  );
};

export default HomeSection;
