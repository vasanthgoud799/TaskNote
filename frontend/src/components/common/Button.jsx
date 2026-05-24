import React from "react";

const Button = ({
  children,
  className = "",
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}) => (
  <button type={type} className={`btn btn-${variant} btn-${size} ${className}`} {...props}>
    {children}
  </button>
);

export default Button;
