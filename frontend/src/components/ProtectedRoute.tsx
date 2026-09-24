import { useContext, type ReactNode } from "react";
import { AuthContext } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const auth = useContext(AuthContext);
  const token = auth?.token;
  if (!token) return <Navigate to="/" />;
  return children;
}
