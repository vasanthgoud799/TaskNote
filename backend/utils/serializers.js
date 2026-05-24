export const serializeNote = (note) => ({
  id: note._id?.toString(),
  title: note.title,
  content: note.content,
  category: note.category,
  starred: Boolean(note.starred),
  pinned: Boolean(note.pinned),
  color: note.color || "sky",
  reminderAt: note.reminderAt,
  notifyByEmail: Boolean(note.notifyByEmail),
  notifyByPhone: Boolean(note.notifyByPhone),
  createdAt: note.createdAt,
  updatedAt: note.updatedAt,
});

export const serializeDeletedNote = (note) => ({
  id: note._id?.toString(),
  originalNoteId: note.originalNoteId?.toString(),
  title: note.title,
  content: note.content,
  category: note.category,
  starred: Boolean(note.starred),
  pinned: Boolean(note.pinned),
  color: note.color || "sky",
  reminderAt: note.reminderAt,
  notifyByEmail: Boolean(note.notifyByEmail),
  notifyByPhone: Boolean(note.notifyByPhone),
  originalCreatedAt: note.originalCreatedAt,
  originalUpdatedAt: note.originalUpdatedAt,
  deletedAt: note.deletedAt,
});

export const serializeUser = (user) => ({
  id: user._id?.toString(),
  name: user.name,
  email: user.email,
  emailVerified: true,
  profileImage: user.profileImage,
  phone: user.phone,
  notificationPreferences: user.notificationPreferences,
  notes: (user.notes || []).map(serializeNote),
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});
