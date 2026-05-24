import React, { useEffect, useMemo, useState } from "react";
import { FiSearch, FiX } from "react-icons/fi";

const CommandPalette = ({ open, onClose, actions }) => {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const filtered = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();
    return actions.filter((action) => {
      const haystack = `${action.label} ${action.group || ""} ${action.hint || ""}`.toLowerCase();
      if (!normalizedQuery) return true;
      return normalizedQuery
        .split(/\s+/)
        .filter(Boolean)
        .every((term) => haystack.includes(term));
    });
  }, [actions, query]);

  const grouped = useMemo(
    () =>
      filtered.reduce((groups, action) => {
        const group = action.group || "Actions";
        groups.set(group, [...(groups.get(group) || []), action]);
        return groups;
      }, new Map()),
    [filtered]
  );

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-start bg-black/72 p-3 pt-16 backdrop-blur-sm sm:pt-20" onMouseDown={onClose}>
      <div className="mx-auto flex max-h-[min(78vh,42rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-[#242424] bg-[#0b0b0b] shadow-2xl shadow-black/50" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-[#242424] px-4 py-3">
          <FiSearch className="text-[#e5b85c]" />
          <input
            autoFocus
            className="w-full bg-transparent text-[#f5f5f5] outline-none placeholder:text-[#737373]"
            placeholder="Search or try filters: type:task tag:work priority:high due:today"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") onClose();
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActiveIndex((index) => Math.min(index + 1, filtered.length - 1));
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((index) => Math.max(index - 1, 0));
              }
              if (event.key === "Enter" && filtered[activeIndex]) {
                event.preventDefault();
                filtered[activeIndex].run();
                onClose();
              }
            }}
          />
          <button className="rounded-xl p-2 text-[#737373] transition hover:bg-[#202020] hover:text-[#f5f5f5]" type="button" onClick={onClose} aria-label="Close command palette">
            <FiX />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-2">
          {Array.from(grouped.entries()).map(([group, items]) => (
            <section key={group} className="py-1">
              <p className="px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#737373]">{group}</p>
              {items.map((action) => {
                const index = filtered.indexOf(action);
                const Icon = action.icon;
                return (
                  <button
                    key={`${group}-${action.label}`}
                    className={`flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-3 text-left text-sm font-bold transition ${
                      index === activeIndex ? "bg-[#2a2a2a] text-[#f5f5f5] ring-1 ring-[#e5b85c]/50" : "text-[#a3a3a3] hover:bg-[#202020] hover:text-[#f5f5f5]"
                    }`}
                    type="button"
                    onClick={() => {
                      action.run();
                      onClose();
                    }}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      {Icon && <Icon className={index === activeIndex ? "shrink-0 text-[#e5b85c]" : "shrink-0"} />}
                      <span className="truncate">{action.label}</span>
                    </span>
                    {action.hint && <small className="shrink-0 rounded-lg bg-[#202020] px-2 py-1 text-[#a3a3a3]">{action.hint}</small>}
                  </button>
                );
              })}
            </section>
          ))}
          {!filtered.length && <p className="px-3 py-8 text-center text-sm text-[#737373]">No commands found.</p>}
        </div>
        <div className="border-t border-[#242424] px-4 py-3 text-sm text-[#737373]">
          Try: <kbd className="rounded bg-[#202020] px-2 py-1">type:task</kbd> <kbd className="rounded bg-[#202020] px-2 py-1">due:today</kbd> <kbd className="rounded bg-[#202020] px-2 py-1">priority:high</kbd>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
