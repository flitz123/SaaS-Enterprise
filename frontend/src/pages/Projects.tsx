import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { createProject, createTask, deleteProject, deleteTask, getProjects, getTasks, updateTaskStatus, type Task, type TaskStatus } from "../api/projects";

type Project = { id: number; name: string };

export default function Projects() {
	const [projects, setProjects] = useState<Project[]>([]);
	const [error, setError] = useState("");
	const [name, setName] = useState("");
	const [saving, setSaving] = useState(false);
	const [selectedProject, setSelectedProject] = useState<Project | null>(null);
	const [tasks, setTasks] = useState<Task[]>([]);
	const [taskTitle, setTaskTitle] = useState("");
	const [taskSaving, setTaskSaving] = useState(false);

	const loadProjects = () => getProjects().then(setProjects).catch(() => setError("Unable to load projects."));
	const loadTasks = (projectId: number) => getTasks(projectId).then(setTasks).catch(() => setError("Unable to load tasks."));

	useEffect(() => {
		loadProjects();
	}, []);

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
		try { await deleteProject(project.id); if (selectedProject?.id === project.id) { setSelectedProject(null); setTasks([]); } await loadProjects(); }
		catch { setError("Unable to delete this project."); }
	};

	const selectProject = (project: Project) => {
		setSelectedProject(project);
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
			{projects.length === 0 && !error ? <div className="empty-state"><span className="empty-mark">+</span><h3>Your first project starts here.</h3><p>Create a project above and give your team a shared direction.</p></div> : <div className="project-list">{projects.map((project) => <article className={selectedProject?.id === project.id ? "project-card selected" : "project-card"} key={project.id} onClick={() => selectProject(project)}><span className="project-number">{String(project.id).padStart(2, "0")}</span><div><h3>{project.name}</h3><span>Active project</span></div><button className="delete-button" onClick={(event) => { event.stopPropagation(); remove(project); }} aria-label={`Delete ${project.name}`} title="Delete project">Delete</button><span className="project-arrow">{"->"}</span></article>)}</div>}
			{selectedProject && <section className="task-panel"><div className="task-heading"><div><span className="eyebrow">PROJECT / TASKS</span><h3>{selectedProject.name}</h3></div><span className="task-count">{tasks.filter((task) => task.status === "completed").length}/{tasks.length} complete</span></div><form className="create-task" onSubmit={addTask}><input aria-label="Task title" value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Add a task to this project" /><button className="primary-button compact" disabled={taskSaving}>{taskSaving ? "Adding..." : "Add task"}<span>+</span></button></form>{tasks.length === 0 ? <p className="task-empty">No tasks yet. Add the next concrete step above.</p> : <div className="task-list">{tasks.map((task) => <div className={`task-row ${task.status}`} key={task.id}><span className="task-state" aria-hidden="true" /> <span className="task-title">{task.title}</span><span className="task-status">{task.status === "completed" ? "Completed" : task.status === "paused" ? "Paused" : "To do"}</span>{task.status !== "completed" && <button className="task-action" onClick={() => changeTaskStatus(task, "completed")}>Complete</button>}{task.status !== "paused" && task.status !== "completed" && <button className="task-action" onClick={() => changeTaskStatus(task, "paused")}>Pause</button>}{task.status === "paused" && <button className="task-action" onClick={() => changeTaskStatus(task, "todo")}>Resume</button>}<button className="task-remove" onClick={() => removeTask(task)} aria-label={`Remove ${task.title}`} title="Remove task">x</button></div>)}</div>}</section>}
		</main>
	);
}
