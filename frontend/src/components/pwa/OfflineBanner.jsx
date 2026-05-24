import React from "react";

const OfflineBanner = ({ online, pendingCount = 0 }) => (
  <div className={`mb-4 rounded-xl px-4 py-3 text-sm font-semibold ${online ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}>
    {online
      ? pendingCount
        ? `${pendingCount} offline change${pendingCount === 1 ? "" : "s"} waiting to sync.`
        : "Online. Notes and reminders sync normally."
      : "Offline mode. Cached notes are available and new changes will be marked pending sync."}
  </div>
);

export default OfflineBanner;
