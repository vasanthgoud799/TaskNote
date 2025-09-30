import React, { useState, useEffect } from "react";
import "./CreateNote.css";
import { CREATE_NOTE_ROUTE, UPDATE_NOTE_ROUTE } from "../utils/constant";
import { useAppStore } from "../store";
import { apiClient } from "../lib/api-client";
import { toast } from "sonner";

const categories = [
  { name: "Urgent", color: "#e63946" },
  { name: "Important", color: "#ff9f1c" },
  { name: "Work", color: "#2a9d8f" },
  { name: "Personal", color: "#264653" },
  { name: "Meeting", color: "#457b9d" },
  { name: "Deadline", color: "#d90429" },
  { name: "To-Do", color: "#06d6a0" },
  { name: "Follow-Up", color: "#f4a261" },
];

const CreateNote = ({ setShowCreateNote, setNotes, notes, selectedNote }) => {
  const { userInfo } = useAppStore();
  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    isStarred: false,
    category: "",
  });
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const [isViewing, setIsViewing] = useState(false);

  // Debugging Logs
  console.log("Component Rendered");
  console.log("Selected Note:", selectedNote);
  console.log("isViewing State:", isViewing);

  useEffect(() => {
    if (selectedNote) {
      console.log("Updating state with selected note...");
      setNewNote(selectedNote);
      setIsViewing(true); // Start in view mode
    } else {
      setNewNote({ title: "", content: "", isStarred: false, category: "" });
      setIsViewing(false);
    }
  }, [selectedNote]);

  const handleEdit = () => {
    console.log("Edit button clicked, setting isViewing to false...");
    setIsViewing(false);
  };

  const handleSaveNote = async () => {
    if (!newNote.title.trim() || !newNote.content.trim()) {
      toast.error("Title and content are required!");
      return;
    }

    try {
      let response;
      if (selectedNote) {
        response = await apiClient.put(
          UPDATE_NOTE_ROUTE,
          { userId: userInfo.id, noteId: selectedNote._id, ...newNote },
          { withCredentials: true }
        );

        if (response.status === 200) {
          toast.success("Note updated successfully!");
          setNotes((prevNotes) =>
            prevNotes.map((note) =>
              note._id === selectedNote._id ? response.data.note : note
            )
          );
        }
      } else {
        response = await apiClient.post(
          CREATE_NOTE_ROUTE,
          { userId: userInfo.id, ...newNote },
          { withCredentials: true }
        );

        if (response.status === 200) {
          toast.success("Note added successfully!");
          setNotes([...notes, response.data.note]);
        }
      }

      setShowCreateNote(false);
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("Failed to save note. Please try again.");
    }
  };

  return (
    <div className={`create-note-container ${theme}`}>
      <div className="create-note">
        <div className="header">
          <h1>{isViewing ? "View Note" : selectedNote ? "Edit Note" : "Create Note"}</h1>
          <span
            className={`star-icon ${newNote.isStarred ? "starred" : ""}`}
            onClick={() => setNewNote({ ...newNote, isStarred: !newNote.isStarred })}
          >
            {newNote.isStarred ? "⭐" : "☆"}
          </span>
        </div>

        <input
          type="text"
          placeholder="Title"
          value={newNote.title}
          onChange={(e) => !isViewing && setNewNote({ ...newNote, title: e.target.value })}
          readOnly={isViewing}
        />

        <textarea
          placeholder="Write your note here..."
          value={newNote.content}
          onChange={(e) => !isViewing && setNewNote({ ...newNote, content: e.target.value })}
          readOnly={isViewing}
        ></textarea>

        <div className="categories">
          {categories.map((tag) => (
            <button
              key={tag.name}
              className={`category ${newNote.category === tag.name ? "selected" : ""}`}
              style={{
                background: newNote.category === tag.name ? tag.color : "transparent",
                color: newNote.category === tag.name ? "white" : tag.color,
                border: `1px solid ${tag.color}`,
              }}
              onClick={() => !isViewing && setNewNote({ ...newNote, category: tag.name })}
            >
              {tag.name}
            </button>
          ))}
        </div>

        <div className="buttons">
          <button className="cancel-button" onClick={() => setShowCreateNote(false)}>
            Close
          </button>
          {isViewing ? (
            <button className="edit-button" onClick={handleEdit}>
              Edit
            </button>
          ) : (
            <button className="create-button" onClick={handleSaveNote}>
              {selectedNote ? "Update" : "Create"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateNote;
