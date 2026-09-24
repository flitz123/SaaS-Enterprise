import api from "./axios"

export type Tenant = { id: number; name: string; role: "owner" | "admin" | "member" }
export type Member = { id: number; email: string; role: "owner" | "admin" | "member" }

export const getTenants = async (): Promise<Tenant[]> => (await api.get("/tenants/")).data
export const getMembers = async (tenantId: number): Promise<Member[]> => (await api.get(`/tenants/${tenantId}/members`)).data
export const addMember = async (tenantId: number, email: string, role: "admin" | "member") => (await api.post(`/tenants/${tenantId}/members`, { email, role })).data
export const updateMemberRole = async (tenantId: number, userId: number, role: "admin" | "member") => (await api.patch(`/tenants/${tenantId}/members/${userId}`, { role })).data
export const removeMember = async (tenantId: number, userId: number) => api.delete(`/tenants/${tenantId}/members/${userId}`)