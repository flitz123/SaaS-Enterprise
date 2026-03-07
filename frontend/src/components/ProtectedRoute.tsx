import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }: any) {
  const { token } = useContext(AuthContext);
  if (!token) return <Navigate to="/" />;
  return children;
}
