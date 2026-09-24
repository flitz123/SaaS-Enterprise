import { useEffect, useState } from "react";
import { connectWebSocket } from "../websocket/collaboration";
import { getDashboardSummary, type DashboardSummary } from "../api/dashboard";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [connection, setConnection] = useState("Connecting");

  useEffect(() => {
    getDashboardSummary().then(setSummary).catch(() => undefined);
    const socket = connectWebSocket(() => setConnection("Live"));
    socket.addEventListener("close", () => setConnection("Offline"));
    socket.addEventListener("error", () => setConnection("Offline"));
    return () => socket.close();
  }, []);

  return <main className="dashboard-page">
    <div className="page-intro"><div><span className="eyebrow">THURSDAY, SEPTEMBER 24</span><h2>Your workspace at a glance.</h2><p className="muted">A focused view of the work moving your business forward.</p></div><Link className="primary-button compact" to="/projects">Open projects <span>{"->"}</span></Link></div>
    <section className="metrics-grid"><article className="metric-card accent"><span className="metric-label">ACTIVE PROJECTS</span><strong>{summary ? summary.project_count.toString().padStart(2, "0") : "--"}</strong><span className="metric-note">Across your workspace</span></article><article className="metric-card"><span className="metric-label">TEAM PULSE</span><strong>{summary ? `${summary.pulse}%` : "--"}</strong><span className="metric-note positive">{summary ? `${summary.completed_tasks} of ${summary.total_tasks} tasks complete` : "Loading task activity"}</span></article><article className="metric-card"><span className="metric-label">LIVE CHANNEL</span><strong className="live-value"><i />{connection}</strong><span className="metric-note">Realtime collaboration</span></article></section>
    <section className="dashboard-grid"><article className="panel focus-panel"><div className="panel-heading"><div><span className="eyebrow">FOCUS AREA</span><h3>Build with intention.</h3></div><span className="panel-index">01 / 03</span></div><p>Good work gets easier when every decision has a home. Keep your active projects close and your next move visible.</p><Link to="/projects" className="text-link">View your projects <span>{"->"}</span></Link></article><article className="panel activity-panel"><div className="panel-heading"><div><span className="eyebrow">ACTIVITY</span><h3>Recent signals</h3></div><span className="activity-live"><i />Live</span></div><div className="activity-row"><span className="activity-icon">+</span><div><strong>Workspace connected</strong><small>Realtime channel is ready</small></div><time>Now</time></div><div className="activity-row"><span className="activity-icon warm">#</span><div><strong>Projects are waiting</strong><small>Give your workspace its first shape</small></div><time>Today</time></div></article></section>
  </main>;
}
