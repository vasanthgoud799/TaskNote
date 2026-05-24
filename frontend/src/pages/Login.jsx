import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowRight, FiLock } from "react-icons/fi";
import { toast } from "sonner";
import { getErrorMessage } from "../api/apiClient.js";
import Button from "../components/common/Button.jsx";
import Input from "../components/common/Input.jsx";
import { useAuth } from "../auth/AuthProvider.jsx";

const Login = () => {
  const navigate = useNavigate();
  const { loginWithPassword } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.email || !form.password) {
      toast.error("Email and password are required");
      return;
    }

    setSubmitting(true);
    try {
      await loginWithPassword(form);
      toast.success("Welcome back");
      navigate("/dashboard");
    } catch (error) {
      toast.error(getErrorMessage(error, "Login failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <Link className="auth-brand" to="/">
        <FiLock />
        TaskNote
      </Link>
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-heading">
          <span>TaskNote</span>
          <h1>Sign in to TaskNote</h1>
          <p>Use your TaskNote email and password to continue.</p>
        </div>

        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(event) => updateField("email", event.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />
        <Input
          label="Password"
          type="password"
          value={form.password}
          onChange={(event) => updateField("password", event.target.value)}
          placeholder="Your password"
          autoComplete="current-password"
        />

        <Button type="submit" disabled={submitting} className="auth-submit">
          {submitting ? "Logging in..." : "Login"}
          <FiArrowRight />
        </Button>

        <p className="auth-switch">
          New to TaskNote? <Link to="/sign-up">Create an account</Link>
        </p>
      </form>
    </main>
  );
};

export default Login;
