import axios from "axios"

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV
        ? "http://localhost:8000"
        : "https://saa-s-enterprise-oabb.vercel.app")
})

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token")
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    const tenantId = localStorage.getItem("tenantId")
    if (tenantId) {
        config.headers["X-Tenant-ID"] = tenantId
    }
    return config
})

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
            const url = error.config?.url ?? ""
            if (!url.includes("/auth/login") && !url.includes("/auth/register")) {
                window.dispatchEvent(new Event("auth:expired"))
            }
        }
        return Promise.reject(error)
    }
)

export default api