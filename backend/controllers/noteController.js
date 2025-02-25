import User from "../models/User.js";

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

    // Find the user and update their notes array
    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { notes: { _id: noteId } } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res
      .status(200)
      .json({ message: "Note deleted successfully", notes: user.notes });
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
