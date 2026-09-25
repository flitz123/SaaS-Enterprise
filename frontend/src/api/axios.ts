import axios from "axios"

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "https://saas-enterprise-2ehf.onrender.com/"
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