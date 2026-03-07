import React, { createContext, useState } from "react";
import { loginUser } from "../api/auth";

export const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: any) => {
  const [token, setToken] = useState(localStorage.getItem("token"));

  const login = async (email: string, password: string) => {
    const res = await loginUser(email, password);
    localStorage.setItem("token", res.access_token);
    setToken(res.access_token);
  };

  return (
    <AuthContext.Provider value={{ token, login }}>
      {children}
    </AuthContext.Provider>
  );
};
