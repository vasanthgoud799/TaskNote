import React from "react";
import { FiDownload, FiMenu, FiPlus, FiSearch } from "react-icons/fi";
import Button from "../common/Button.jsx";
import { usePWAInstall } from "../../hooks/usePWAInstall.js";

const Header = ({ title, subtitle, search, onSearch, onCreateNote, onMenu, actionLabel = "New Note", rightSlot }) => {
  const { canInstall, install } = usePWAInstall();

  return (
    <header className="app-header">
      <button className="icon-button mobile-menu" type="button" onClick={onMenu} aria-label="Open menu">
        <FiMenu />
      </button>

      <div className="header-title">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>

      {onSearch && (
        <label className="search-field">
          <FiSearch />
          <input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search notes"
            type="search"
          />
        </label>
      )}

      {(rightSlot || canInstall || onCreateNote) && (
        <div className="header-actions">
          {rightSlot}
        {canInstall && (
          <Button variant="secondary" onClick={install}>
            <FiDownload />
            <span>Install</span>
          </Button>
        )}
        {onCreateNote && (
          <Button onClick={onCreateNote}>
            <FiPlus />
            <span>{actionLabel}</span>
          </Button>
        )}
        </div>
      )}
    </header>
  );
};

export default Header;
