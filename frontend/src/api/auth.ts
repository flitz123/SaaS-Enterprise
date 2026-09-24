import api from "./axios"

export const loginUser = async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password })
    return res.data
}

export const switchTenant = async (tenantId: number) => {
    const res = await api.post(`/auth/switch-tenant/${tenantId}`)
    return res.data
}