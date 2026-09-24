import api from "./axios"

export type DashboardSummary = {
    project_count: number
    total_tasks: number
    completed_tasks: number
    active_tasks: number
    paused_tasks: number
    pulse: number
}

export const getDashboardSummary = async (): Promise<DashboardSummary> => {
    const res = await api.get("/dashboard/summary")
    return res.data
}