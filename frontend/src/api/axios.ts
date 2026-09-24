import axios from "axios"

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000"
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

export default api