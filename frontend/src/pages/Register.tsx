import { useState } from "react";
import axios from "axios";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const submit = async (e: any) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/auth/register", { email, password });
      navigate("/");
    } catch (err) {
      if (axios.isAxiosError(err) && !err.response) {
        setError("The workspace API is unavailable. Check that the backend is running.");
      } else if (axios.isAxiosError(err) && err.response?.status === 409) {
        setError("That email is already registered. Sign in instead or use another email.");
      } else if (axios.isAxiosError(err) && err.response?.status === 422) {
        setError("Use a valid email and a password of at least 8 characters.");
      } else {
        setError("Registration failed. Please try again.");
      }
    }
  };

  return (
    <main className="auth-layout register-layout"><section className="auth-visual"><div className="visual-copy"><span className="eyebrow">STRATA / 02</span><h1>Bring the whole operation into focus.</h1><p>One workspace for projects, decisions, and momentum.</p></div></section><section className="auth-panel"><div className="auth-brand"><span className="brand-mark">S</span> Strata</div><div className="auth-form-wrap"><span className="eyebrow">GET STARTED</span><h2>Create your workspace</h2><p className="muted">Start with a clear view of the work that matters.</p><form onSubmit={submit} className="form-stack"><label>Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" /></label><label>Password<input type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="primary-button">Create account <span>{"->"}</span></button></form><p className="auth-switch">Already have an account? <a href="/">Sign in</a></p></div></section></main>
  );
}
