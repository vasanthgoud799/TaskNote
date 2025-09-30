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
  const [isViewing, setIsViewing] = useState(false);
  const [showStarred, setShowStarred] = useState(false);

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

  const handleViewNote = (note) => {
    setSelectedNote(note);
    setIsViewing(true);
    setShowCreateNote(true);
  };
  // const handleEditNote = (note, event) => {
  //   event.stopPropagation();
  //   console.log("Editing note:", note);
  //   setSelectedNote(note);
  //   setIsViewing(false);
  //   setShowCreateNote(true);
  // };
  
  
  const filteredNotes = notes.filter(
    (note) =>
      note?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note?.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const starredNotes = filteredNotes.filter((note) => note.isStarred);

  return (
    <div className="home-container">
      {showCreateNote ? (
        <CreateNote 
          setShowCreateNote={setShowCreateNote} 
          setNotes={setNotes} 
          notes={notes} 
          selectedNote={selectedNote} 
          isViewing={isViewing} 
          setIsViewing={setIsViewing} 
        />
      ) : (
        <>
          <div className="notesTitle">
            <h1 className="title">Your Notes</h1>
          </div>

          <div className="top-bar">
            <div className="tabs">
              <button 
                className={`tab ${!showStarred ? "active" : ""}`} 
                onClick={() => setShowStarred(false)}
              >
                All ({notes.length})
              </button>
              <button 
                className={`tab ${showStarred ? "active" : ""}`} 
                onClick={() => setShowStarred(true)}
              >
                Starred ({starredNotes.length})
              </button>
            </div>
            <input
              type="text"
              className="search-box"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="notes-wrapper" ref={notesContainerRef}>
            <div className="notes-list">
              {(showStarred ? starredNotes : filteredNotes).length > 0 ? (
                (showStarred ? starredNotes : filteredNotes).map((note, index) => (
                  <div 
                      key={note._id} 
                      className="note" 
                      ref={index === (showStarred ? starredNotes.length : filteredNotes.length) - 1 ? lastNoteRef : null}
                      onClick={(e) => {
                        if (!e.target.closest(".note-actions")) { 
                          handleViewNote(note);
                        }
                      }}
                    >


                    <div className="note-header">
                      <h3>{note.title}</h3>
                      <div className="note-actions">
                      {/* <button 
                          className="edit-btn" 
                          onClick={(e) => handleEditNote(note, e)}
                        >
                          ✏️
                        </button> */}


                        <button className="delete-btn" onClick={(e) => { e.stopPropagation(); handleDeleteNote(note._id); }}>🗑️</button>
                      </div>
                    </div>
                    <div className="separator"></div>
                    <p>{note.content.length > 100 ? `${note.content.substring(0, 100)}...` : note.content}</p>
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

          <button className="add-button" onClick={() => { setShowCreateNote(true); setSelectedNote(null); setIsViewing(false); }}>+</button>
        </>
      )}
    </div>
  );
};

export default HomeSection;
