import { useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const auth = useContext(AuthContext);
  const login = auth?.login;
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: any) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (!login) throw new Error("Authentication is unavailable");
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      if (axios.isAxiosError(err) && !err.response) {
        setError("The workspace API is unavailable. Check that the backend is running.");
      } else if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError("That email or password is not recognized.");
      } else {
        setError("Sign in failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-layout">
      <section className="auth-visual"><div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" />
        <div className="visual-copy"><span className="eyebrow">STRATA / 01</span><h1>Make complex work feel simple.</h1><p>A calm command center for teams building what comes next.</p></div>
        <div className="visual-meta"><span>01</span><span>Clarity for ambitious teams</span></div>
      </section>
      <section className="auth-panel"><div className="auth-brand"><span className="brand-mark">S</span> Strata</div><div className="auth-form-wrap"><span className="eyebrow">WELCOME BACK</span><h2>Sign in to your workspace</h2><p className="muted">Pick up exactly where your team left off.</p>
        <form onSubmit={submit} className="form-stack">
          <label>Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" /></label>
          <label>Password<input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button" disabled={submitting}>{submitting ? "Signing in..." : "Continue"}<span>{"->"}</span></button>
        </form>
        <p className="auth-switch">New to Strata? <a href="/register">Create an account</a></p>
      </div></section>
    </main>
  );
}
