import { useContext, useEffect, useState, type FormEvent } from "react";
import { addMember, getMembers, removeMember, updateMemberRole, type Member } from "../api/tenants";
import { AuthContext } from "../context/AuthContext";

export default function Team() {
  const auth = useContext(AuthContext);
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const currentTenant = auth?.tenants.find((tenant) => tenant.id === auth.tenantId);
  const canManage = currentTenant?.role === "owner" || currentTenant?.role === "admin";

  const loadMembers = () => {
    if (auth?.tenantId) getMembers(auth.tenantId).then(setMembers).catch(() => setError("Unable to load workspace members."));
  };

  useEffect(() => { loadMembers(); }, [auth?.tenantId]);

  const invite = async (event: FormEvent) => {
    event.preventDefault();
    if (!auth?.tenantId || !canManage || !email.trim()) return;
    setError("");
    try { await addMember(auth.tenantId, email.trim(), role); setEmail(""); setNotice("Member added to the workspace."); loadMembers(); }
    catch { setError("This user must register first, or is already a member."); }
  };

  const changeRole = async (member: Member, nextRole: "admin" | "member") => {
    if (!auth?.tenantId) return;
    try { await updateMemberRole(auth.tenantId, member.id, nextRole); loadMembers(); }
    catch { setError("Only the workspace owner can change roles."); }
  };

  const remove = async (member: Member) => {
    if (!auth?.tenantId || !window.confirm(`Remove ${member.email} from this workspace?`)) return;
    try { await removeMember(auth.tenantId, member.id); setNotice("Member access removed."); loadMembers(); }
    catch { setError("Only workspace admins can remove members, and the owner cannot be removed."); }
  };

  return <main className="settings-page">
    <div className="page-intro"><div><span className="eyebrow">WORKSPACE / TEAM</span><h2>Your people, in sync.</h2><p className="muted">Manage access and roles for the active workspace.</p></div><span className="prototype-badge live-badge">LIVE ACCESS</span></div>
    <section className="settings-grid"><article className="settings-panel invite-panel"><span className="eyebrow">ADD MEMBER</span><h3>Build the right room.</h3><p className="muted">Only registered users can be added to a workspace.</p><form className="invite-form" onSubmit={invite}><input type="email" required disabled={!canManage} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="teammate@company.com" /><select className="role-select" disabled={!canManage} value={role} onChange={(event) => setRole(event.target.value as "admin" | "member")}><option value="member">Member</option><option value="admin">Admin</option></select><button className="primary-button compact" disabled={!canManage}>Add <span>+</span></button></form>{notice && <p className="success-note">{notice}</p>}{error && <p className="form-error" role="alert">{error}</p>}</article><article className="settings-panel seat-panel"><span className="eyebrow">ACCESS LEVEL</span><strong>{currentTenant?.role ?? "--"}</strong><p className="muted">Your role in this workspace</p><div className="seat-bar"><span style={{ width: `${Math.min(members.length * 10, 100)}%` }} /></div></article></section>
    <section className="member-panel"><div className="panel-heading"><div><span className="eyebrow">MEMBERS / {members.length}</span><h3>Workspace access</h3></div><span className="prototype-badge live-badge">PERSISTED</span></div><div className="member-list">{members.map((member) => <div className="member-row" key={member.id}><span className="member-avatar">{member.email.slice(0, 2).toUpperCase()}</span><div className="member-info"><strong>{member.email}</strong><small>User ID {member.id}</small></div><select value={member.role} onChange={(event) => changeRole(member, event.target.value as "admin" | "member")} aria-label={`Role for ${member.email}`} disabled={member.role === "owner" || currentTenant?.role !== "owner"}><option value="owner">Owner</option><option value="admin">Admin</option><option value="member">Member</option></select>{member.role !== "owner" && canManage && <button className="text-danger" onClick={() => remove(member)}>Remove</button>}</div>)}</div></section>
  </main>;
}
