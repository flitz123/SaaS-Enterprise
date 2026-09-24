import { createContext, useEffect, useState, type ReactNode } from "react";
import { loginUser, switchTenant as switchTenantRequest } from "../api/auth";
import { getTenants, type Tenant } from "../api/tenants";

type AuthContextValue = {
  token: string | null;
  tenantId: number | null;
  tenants: Tenant[];
  login: (email: string, password: string) => Promise<void>;
  switchTenant: (tenantId: number) => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [tenantId, setTenantId] = useState<number | null>(() => {
    const value = localStorage.getItem("tenantId");
    return value ? Number(value) : null;
  });
  const [tenants, setTenants] = useState<Tenant[]>([]);

  const login = async (email: string, password: string) => {
    const res = await loginUser(email, password);
    localStorage.setItem("token", res.access_token);
    localStorage.setItem("tenantId", String(res.tenant_id));
    setToken(res.access_token);
    setTenantId(res.tenant_id);
  };

  useEffect(() => {
    if (!token) { setTenants([]); return; }
    getTenants().then((available) => {
      setTenants(available);
      if (!tenantId && available[0]) {
        localStorage.setItem("tenantId", String(available[0].id));
        setTenantId(available[0].id);
      }
    }).catch(() => setTenants([]));
  }, [token, tenantId]);

  const switchTenant = async (nextTenantId: number) => {
    const res = await switchTenantRequest(nextTenantId);
    localStorage.setItem("token", res.access_token);
    localStorage.setItem("tenantId", String(nextTenantId));
    setToken(res.access_token);
    setTenantId(nextTenantId);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("tenantId");
    setToken(null);
    setTenantId(null);
  };

  return (
    <AuthContext.Provider value={{ token, tenantId, tenants, login, switchTenant, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
