import React from "react";
import { FiInbox } from "react-icons/fi";
import Button from "./Button.jsx";

const EmptyState = ({ title, description, actionLabel, onAction }) => (
  <div className="empty-state">
    <div className="empty-icon">
      <FiInbox />
    </div>
    <h3>{title}</h3>
    {description && <p>{description}</p>}
    {actionLabel && onAction && (
      <Button onClick={onAction} variant="secondary">
        {actionLabel}
      </Button>
    )}
  </div>
);

export default EmptyState;
