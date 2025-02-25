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
  const [newNote, setNewNote] = useState(
    selectedNote || { title: "", content: "", isStarred: false, category: "" }
  );
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
  }, []);

  const handleSaveNote = async () => {
    if (newNote.title.trim() === "" || newNote.content.trim() === "") {
      toast.error("Title and content are required!");
      return;
    }

    try {
      let response;
      if (selectedNote) {
        // Update existing note
        response = await apiClient.put(
          UPDATE_NOTE_ROUTE, // Using your original route
          {
            userId:userInfo.id,
            noteId: selectedNote._id,
            title: newNote.title,
            content: newNote.content,
            category: newNote.category || "Uncategorized",
            isStarred: newNote.isStarred,
          },
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
        // Create new note
        response = await apiClient.post(
          CREATE_NOTE_ROUTE,
          {
            userId: userInfo.id,
            title: newNote.title,
            content: newNote.content,
            category: newNote.category || "Uncategorized",
            isStarred: newNote.isStarred,
          },
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
          <h1>{selectedNote ? "Edit Note" : "Create Note"}</h1>
          <span
            className={`star-icon ${newNote.isStarred ? "starred" : ""}`}
            onClick={() =>
              setNewNote({ ...newNote, isStarred: !newNote.isStarred })
            }
          >
            {newNote.isStarred ? "⭐" : "☆"}
          </span>
        </div>

        <input
          type="text"
          placeholder="Title"
          value={newNote.title}
          onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
        />

        <textarea
          placeholder="Write your note here..."
          value={newNote.content}
          onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
        ></textarea>

        <div className="categories">
          {categories.map((tag) => (
            <button
              key={tag.name}
              className={`category ${
                newNote.category === tag.name ? "selected" : ""
              }`}
              style={{
                background:
                  newNote.category === tag.name ? tag.color : "transparent",
                color: newNote.category === tag.name ? "white" : tag.color,
                border: `1px solid ${tag.color}`,
              }}
              onClick={() => setNewNote({ ...newNote, category: tag.name })}
            >
              {tag.name}
            </button>
          ))}
        </div>

        <div className="buttons">
          <button className="cancel-button" onClick={() => setShowCreateNote(false)}>
            Cancel
          </button>
          <button className="create-button" onClick={handleSaveNote}>
            {selectedNote ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateNote;
