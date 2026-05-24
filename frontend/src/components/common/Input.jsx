import React from "react";

const Input = ({ label, error, className = "", ...props }) => (
  <label className={`field ${className}`}>
    {label && <span>{label}</span>}
    <input {...props} />
    {error && <small className="field-error">{error}</small>}
  </label>
);

export default Input;
