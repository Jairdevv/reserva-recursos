import { Navigate, Outlet } from "react-router-dom";
import { useSession } from "./session";

export default function AdminRoute() {
  const session = useSession();
  return session?.usuario.rol === "admin"
    ? <Outlet />
    : <Navigate to="/recursos" replace />;
}
