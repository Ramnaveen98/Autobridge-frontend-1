import { Navigate } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";

export default function Protected({
  allow,
  children,
}: {
  allow?: Array<"ADMIN" | "AGENT" | "USER">;
  children: React.ReactNode;
}) {
  const { token, role } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (allow && role && !allow.includes(role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
