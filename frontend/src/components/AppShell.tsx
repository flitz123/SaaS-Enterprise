import { NavLink, useNavigate } from "react-router-dom";
import { useContext, type ReactNode } from "react";
import { AuthContext } from "../context/AuthContext";

export default function AppShell({ children }: { children: ReactNode }) {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const logout = () => {
    auth?.logout();
    navigate("/");
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">S</span><span>Strata</span></div>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span className="nav-glyph">+</span> Overview
          </NavLink>
          <NavLink to="/projects" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span className="nav-glyph">#</span> Projects
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <div className="status-dot"><span /> Systems operational</div>
          <button className="logout-button" onClick={logout}>Sign out</button>
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <div><span className="eyebrow">ENTERPRISE CONTROL PLANE</span><h1>Good to see you</h1></div>
          <div className="avatar">S</div>
        </header>
        <div className="page-content">{children}</div>
      </div>
    </div>
  );
}