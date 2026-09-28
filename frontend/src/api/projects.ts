import api from "./axios"

export const getProjects = async () => {
    const res = await api.get("/projects")
    return res.data
}

export const createProject = async (name: string) => {
    const res = await api.post("/projects", { name })
    return res.data
}

export const deleteProject = async (id: number) => {
    await api.delete(`/projects/${id}`)
}

export type TaskStatus = "todo" | "completed" | "paused"
export type TaskAssignee = { user_id: number; email: string; progress: number }
export type Task = { id: number; title: string; status: TaskStatus; project_id: number; assignees: TaskAssignee[] }

export const getTasks = async (projectId: number): Promise<Task[]> => {
    const res = await api.get(`/projects/${projectId}/tasks`)
    return res.data
}

export const createTask = async (projectId: number, title: string) => {
    const res = await api.post(`/projects/${projectId}/tasks`, { title })
    return res.data as Task
}

export const updateTaskStatus = async (projectId: number, taskId: number, status: TaskStatus) => {
    const res = await api.patch(`/projects/${projectId}/tasks/${taskId}`, { status })
    return res.data as Task
}

export const assignTaskMember = async (projectId: number, taskId: number, userId: number): Promise<TaskAssignee> => {
    const res = await api.post(`/projects/${projectId}/tasks/${taskId}/assignees`, { user_id: userId })
    return res.data
}

export const updateTaskMemberProgress = async (projectId: number, taskId: number, userId: number, progress: number): Promise<TaskAssignee> => {
    const res = await api.patch(`/projects/${projectId}/tasks/${taskId}/assignees/${userId}`, { progress })
    return res.data
}

export const removeTaskMember = async (projectId: number, taskId: number, userId: number) => {
    await api.delete(`/projects/${projectId}/tasks/${taskId}/assignees/${userId}`)
}

export const deleteTask = async (projectId: number, taskId: number) => {
    await api.delete(`/projects/${projectId}/tasks/${taskId}`)
}