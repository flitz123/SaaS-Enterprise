import { useContext, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { assignTaskMember, createProject, createTask, deleteProject, deleteTask, getProjects, getTasks, removeTaskMember, updateTaskMemberProgress, updateTaskStatus, type Task, type TaskAssignee, type TaskStatus } from "../api/projects";
import { getMembers, type Member } from "../api/tenants";
import { AuthContext } from "../context/AuthContext";

type Project = { id: number; name: string; can_delete: boolean };

export default function Projects() {
	const auth = useContext(AuthContext);
	const [projects, setProjects] = useState<Project[]>([]);
	const [members, setMembers] = useState<Member[]>([]);
	const [error, setError] = useState("");
	const [name, setName] = useState("");
	const [saving, setSaving] = useState(false);
	const [selectedProject, setSelectedProject] = useState<Project | null>(null);
	const [tasks, setTasks] = useState<Task[]>([]);
	const requestIds = useRef({ projects: 0, tasks: 0, members: 0 });
	const [taskTitle, setTaskTitle] = useState("");
	const [taskSaving, setTaskSaving] = useState(false);

	const loadProjects = () => {
		const requestId = ++requestIds.current.projects;
		return getProjects().then((loadedProjects) => {
			if (requestIds.current.projects === requestId) setProjects(loadedProjects);
		}).catch(() => {
			if (requestIds.current.projects === requestId) setError("Unable to load projects.");
		});
	};
	const loadTasks = (projectId: number) => {
		const requestId = ++requestIds.current.tasks;
		return getTasks(projectId).then((loadedTasks) => {
			if (requestIds.current.tasks === requestId) setTasks(loadedTasks);
		}).catch(() => {
			if (requestIds.current.tasks === requestId) setError("Unable to load tasks.");
		});
	};
	const taskProgress = (task: Task) => task.status === "completed"
		? 100
		: task.assignees.length
			? Math.round(task.assignees.reduce((total, assignee) => total + assignee.progress, 0) / task.assignees.length)
			: 0;
	const projectProgress = tasks.length
		? Math.round(tasks.reduce((total, task) => total + taskProgress(task), 0) / tasks.length)
		: 0;

	useEffect(() => {
		requestIds.current.projects += 1;
		requestIds.current.tasks += 1;
		setSelectedProject(null);
		setTasks([]);
		setError("");
		if (auth?.tenantId) loadProjects();
		else setProjects([]);
	}, [auth?.tenantId]);

	useEffect(() => {
		const requestId = ++requestIds.current.members;
		setMembers([]);
		if (!auth?.tenantId) return;
		getMembers(auth.tenantId).then((loadedMembers) => {
			if (requestIds.current.members === requestId) setMembers(loadedMembers);
		}).catch(() => {
			if (requestIds.current.members === requestId) setError("Unable to load workspace members.");
		});
	}, [auth?.tenantId]);

	const submit = async (event: FormEvent) => {
		event.preventDefault();
		if (!name.trim()) return;
		setSaving(true);
		setError("");
		try { await createProject(name.trim()); setName(""); await loadProjects(); }
		catch { setError("Unable to create this project."); }
		finally { setSaving(false); }
	};

	const remove = async (project: Project) => {
		if (!window.confirm(`Delete ${project.name}?`)) return;
		setError("");
		try { await deleteProject(project.id); if (selectedProject?.id === project.id) { requestIds.current.tasks += 1; setSelectedProject(null); setTasks([]); } await loadProjects(); }
		catch { setError("Unable to delete this project."); }
	};

	const selectProject = (project: Project) => {
		setSelectedProject(project);
		setTasks([]);
		setError("");
		loadTasks(project.id);
	};

	const addTask = async (event: FormEvent) => {
		event.preventDefault();
		if (!selectedProject || !taskTitle.trim()) return;
		setTaskSaving(true);
		try { const task = await createTask(selectedProject.id, taskTitle.trim()); setTasks((current) => [...current, task]); setTaskTitle(""); }
		catch { setError("Unable to add this task."); }
		finally { setTaskSaving(false); }
	};

	const changeTaskStatus = async (task: Task, status: TaskStatus) => {
		if (!selectedProject) return;
		try { const updated = await updateTaskStatus(selectedProject.id, task.id, status); setTasks((current) => current.map((item) => item.id === updated.id ? updated : item)); }
		catch { setError("Unable to update this task."); }
	};

	const changeTaskAssignee = async (task: Task, userId: number) => {
		if (!selectedProject) return;
		try {
			const assignee = await assignTaskMember(selectedProject.id, task.id, userId);
			setTasks((current) => current.map((item) => item.id === task.id ? { ...item, assignees: [...item.assignees, assignee] } : item));
		} catch { setError("Unable to assign this member."); }
	};

	const changeMemberProgress = async (task: Task, assignee: TaskAssignee, progress: number) => {
		if (!selectedProject || !Number.isInteger(progress) || progress < 0 || progress > 100 || progress === assignee.progress) return;
		try {
			const updated = await updateTaskMemberProgress(selectedProject.id, task.id, assignee.user_id, progress);
			setTasks((current) => current.map((item) => item.id === task.id ? { ...item, assignees: item.assignees.map((member) => member.user_id === assignee.user_id ? updated : member) } : item));
		} catch { setError("Unable to update member progress."); }
	};

	const unassignTaskMember = async (task: Task, assignee: TaskAssignee) => {
		if (!selectedProject) return;
		try {
			await removeTaskMember(selectedProject.id, task.id, assignee.user_id);
			setTasks((current) => current.map((item) => item.id === task.id ? { ...item, assignees: item.assignees.filter((member) => member.user_id !== assignee.user_id) } : item));
		} catch { setError("Unable to remove this assignee."); }
	};

	const removeTask = async (task: Task) => {
		if (!selectedProject || !window.confirm(`Remove ${task.title}?`)) return;
		try { await deleteTask(selectedProject.id, task.id); setTasks((current) => current.filter((item) => item.id !== task.id)); }
		catch { setError("Unable to remove this task."); }
	};

	return (
		<main className="projects-page">
			<div className="page-intro"><div><span className="eyebrow">WORKSPACE / PROJECTS</span><h2>Projects with momentum.</h2><p className="muted">Keep the work that matters visible and moving.</p></div></div>
			<form className="create-project" onSubmit={submit}><input aria-label="Project name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Name a new project" /><button className="primary-button compact" disabled={saving}>{saving ? "Creating..." : "Create project"}<span>+</span></button></form>
			{error && <p role="alert">{error}</p>}
			{projects.length === 0 && !error ? <div className="empty-state"><span className="empty-mark">+</span><h3>Your first project starts here.</h3><p>Create a project above and give your team a shared direction.</p></div> : <div className="project-list">{projects.map((project) => <article className={selectedProject?.id === project.id ? "project-card selected" : "project-card"} key={project.id} onClick={() => selectProject(project)}><span className="project-number">{String(project.id).padStart(2, "0")}</span><div><h3>{project.name}</h3><span>Active project</span></div>{project.can_delete && <button className="delete-button" onClick={(event) => { event.stopPropagation(); remove(project); }} aria-label={`Delete ${project.name}`} title="Delete project">Delete</button>}<span className="project-arrow">{"->"}</span></article>)}</div>}
			{selectedProject && <section className="task-panel"><div className="task-heading"><div><span className="eyebrow">PROJECT / TASKS</span><h3>{selectedProject.name}</h3></div><div className="task-heading-summary"><div className="project-progress"><div><span>PROJECT PROGRESS</span><strong>{projectProgress}%</strong></div><progress max="100" value={projectProgress} aria-label={`${projectProgress}% project progress`} /></div><span className="task-count">{tasks.filter((task) => task.status === "completed").length}/{tasks.length} complete</span></div></div><form className="create-task" onSubmit={addTask}><input aria-label="Task title" value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Add a task to this project" /><button className="primary-button compact" disabled={taskSaving}>{taskSaving ? "Adding..." : "Add task"}<span>+</span></button></form>{tasks.length === 0 ? <p className="task-empty">No tasks yet. Add the next concrete step above.</p> : <div className="task-list">{tasks.map((task) => <div className={`task-row ${task.status}`} key={task.id}><span className="task-state" aria-hidden="true" /> <span className="task-title">{task.title}</span><span className="task-status">{task.status === "completed" ? "Completed" : task.status === "paused" ? "Paused" : "To do"}</span>{task.status !== "completed" && <button className="task-action" onClick={() => changeTaskStatus(task, "completed")}>Complete</button>}{task.status !== "paused" && task.status !== "completed" && <button className="task-action" onClick={() => changeTaskStatus(task, "paused")}>Pause</button>}{task.status === "paused" && <button className="task-action" onClick={() => changeTaskStatus(task, "todo")}>Resume</button>}<button className="task-remove" onClick={() => removeTask(task)} aria-label={`Remove ${task.title}`} title="Remove task">x</button><div className="task-assignees"><label className="assignee-add">Assign member<select aria-label={`Assign member to ${task.title}`} value="" onChange={(event) => { if (event.target.value) changeTaskAssignee(task, Number(event.target.value)); }}><option value="">Choose member</option>{members.filter((member) => !task.assignees.some((assignee) => assignee.user_id === member.id)).map((member) => <option key={member.id} value={member.id}>{member.email}</option>)}</select></label>{task.assignees.map((assignee) => <div className="assignee-progress" key={assignee.user_id}><span>{assignee.email}</span><label>Progress<input key={`${task.id}-${assignee.user_id}-${assignee.progress}`} type="number" min="0" max="100" defaultValue={assignee.progress} aria-label={`${assignee.email} progress on ${task.title}`} onBlur={(event) => changeMemberProgress(task, assignee, Number(event.currentTarget.value))} />%</label><button className="task-remove" onClick={() => unassignTaskMember(task, assignee)} aria-label={`Unassign ${assignee.email}`} title="Unassign member">x</button></div>)}</div></div>)}</div>}</section>}
		</main>
	);
}
