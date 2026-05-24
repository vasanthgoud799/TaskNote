import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowRight, FiFeather } from "react-icons/fi";
import { toast } from "sonner";
import { getErrorMessage } from "../api/apiClient.js";
import Button from "../components/common/Button.jsx";
import Input from "../components/common/Input.jsx";
import { useAuth } from "../auth/AuthProvider.jsx";

const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.email || !form.password) {
      toast.error("Name, email, and password are required");
      return;
    }

    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setSubmitting(true);
    try {
      await signup(form);
      toast.success("Your TaskNote workspace is ready");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, "Signup failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <Link className="auth-brand" to="/">
        <FiFeather />
        TaskNote
      </Link>
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-heading">
          <span>TaskNote</span>
          <h1>Create your account</h1>
          <p>Create a secure TaskNote account stored in your backend database.</p>
        </div>

        <Input
          label="Name"
          value={form.name}
          onChange={(event) => updateField("name", event.target.value)}
          placeholder="Your name"
          autoComplete="name"
        />
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
          placeholder="At least 6 characters"
          autoComplete="new-password"
        />

        <Button type="submit" disabled={submitting} className="auth-submit">
          {submitting ? "Creating..." : "Create account"}
          <FiArrowRight />
        </Button>

        <p className="auth-switch">
          Already have an account? <Link to="/sign-in">Login</Link>
        </p>
      </form>
    </main>
  );
};

export default Signup;
