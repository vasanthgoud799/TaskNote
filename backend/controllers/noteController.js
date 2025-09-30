import User from "../models/User.js";
import DeletedNote from "../models/DeletedNote.js";

export const createNote = async (req, res) => {
  try {
    const { userId, title, content, category } = req.body;
    console.log(userId, content, title, category);
    // Check if required fields are provided
    if (!userId || !title || !content) {
      return res
        .status(400)
        .json({ message: "User ID, title, and content are required" });
    }

    // Create the new note object
    const newNote = {
      title,
      content,
      category: category || "Uncategorized",
      isStarred: false,
    };

    // Find user and update notes array
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $push: { notes: newNote } }, // Push the new note to the notes array
      { new: true } // Return updated document
    );

    if (!updatedUser) {
      //   console.log("KNCDNCN");
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Note added successfully",
      notes: updatedUser.notes, // Return updated notes
    });
  } catch (err) {
    console.error("Error creating note:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getNotes = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findById(userId).populate("notes");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ notes: user.notes });
  } catch (error) {
    console.error("Error fetching notes:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteNote = async (req, res) => {
  try {
    const { userId, noteId } = req.body;

    // Find the user and extract the note
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const noteToDelete = user.notes.find(
      (note) => note._id.toString() === noteId
    );
    if (!noteToDelete) {
      return res.status(404).json({ message: "Note not found" });
    }

    // Move note to DeletedNotes collection
    await DeletedNote.create({
      userId,
      title: noteToDelete.title,
      content: noteToDelete.content,
      category: noteToDelete.category,
    });

    // Remove from the user's notes
    user.notes = user.notes.filter((note) => note._id.toString() !== noteId);
    await user.save();

    return res
      .status(200)
      .json({ message: "Note moved to trash", notes: user.notes });
  } catch (error) {
    console.error("Error deleting note:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateNote = async (req, res) => {
  try {
    const { userId, noteId, title, content, category, isStarred } = req.body;

    const user = await User.findOneAndUpdate(
      { _id: userId, "notes._id": noteId },
      {
        $set: {
          "notes.$.title": title,
          "notes.$.content": content,
          "notes.$.category": category,
          "notes.$.isStarred": isStarred,
        },
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User or note not found" });
    }

    res.status(200).json({ message: "Note updated successfully", user });
  } catch (error) {
    console.error("Error updating note:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const restoreNote = async (req, res) => {
  try {
    const { userId, noteId } = req.body;
    console.log(userId, noteId);
    // Find the deleted note
    const deletedNote = await DeletedNote.findOne({ _id: noteId, userId });
    if (!deletedNote) {
      return res.status(404).json({ message: "Note not found in trash" });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Restore the note to user's notes
    user.notes.push({
      title: deletedNote.title,
      content: deletedNote.content,
      category: deletedNote.category,
    });

    await user.save();

    // Remove from DeletedNotes collection
    await DeletedNote.deleteOne({ _id: noteId });

    return res.status(200).json({
      message: "Note restored successfully",
      notes: user.notes,
    });
  } catch (error) {
    console.error("Error restoring note:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getDeletedNotes = async (req, res) => {
  try {
    const userId = req.userId;
    const deletedNotes = await DeletedNote.find({ userId });

    return res.status(200).json({ deletedNotes });
  } catch (error) {
    console.error("Error fetching deleted notes:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
