import { createContext, useState, type ReactNode } from "react";
import { loginUser } from "../api/auth";

type AuthContextValue = {
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));

  const login = async (email: string, password: string) => {
    const res = await loginUser(email, password);
    localStorage.setItem("token", res.access_token);
    setToken(res.access_token);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
